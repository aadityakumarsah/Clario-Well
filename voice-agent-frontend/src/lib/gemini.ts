export class MediaHandler {
  audioContext: AudioContext | null = null;
  mediaStream: MediaStream | null = null;
  audioWorkletNode: AudioWorkletNode | null = null;
  nextStartTime: number = 0;
  scheduledSources: AudioBufferSourceNode[] = [];
  isRecording: boolean = false;
  isMuted: boolean = false;

  async initializeAudio() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      await this.audioContext.audioWorklet.addModule("/pcm-processor.js");
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  async startAudio(onAudioData: (data: ArrayBuffer) => void) {
    await this.initializeAudio();
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext!.createMediaStreamSource(this.mediaStream);
      this.audioWorkletNode = new AudioWorkletNode(this.audioContext!, "pcm-processor");

      this.audioWorkletNode.port.onmessage = (event) => {
        if (this.isRecording && this.audioContext && !this.isMuted) {
          const downsampled = this.downsampleBuffer(event.data, this.audioContext.sampleRate, 16000);
          const pcm16 = this.convertFloat32ToInt16(downsampled);
          onAudioData(pcm16);
        }
      };

      source.connect(this.audioWorkletNode);
      const muteGain = this.audioContext!.createGain();
      muteGain.gain.value = 0;
      this.audioWorkletNode.connect(muteGain);
      muteGain.connect(this.audioContext!.destination);
      this.isRecording = true;
    } catch (e) {
      console.error("Error starting audio:", e);
      throw e;
    }
  }

  stopAudio() {
    this.isRecording = false;
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((t) => t.stop());
      this.mediaStream = null;
    }
    if (this.audioWorkletNode) {
      this.audioWorkletNode.disconnect();
      this.audioWorkletNode = null;
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  playAudio(arrayBuffer: ArrayBuffer) {
    if (!this.audioContext) return;
    if (this.audioContext.state === "suspended") this.audioContext.resume();

    const pcmData = new Int16Array(arrayBuffer);
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768.0;
    }

    const buffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;
    this.nextStartTime = Math.max(now, this.nextStartTime);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;

    this.scheduledSources.push(source);
    source.onended = () => {
      const idx = this.scheduledSources.indexOf(source);
      if (idx > -1) this.scheduledSources.splice(idx, 1);
    };
  }

  stopAudioPlayback() {
    this.scheduledSources.forEach((s) => {
      try { s.stop(); } catch (_) {}
    });
    this.scheduledSources = [];
    if (this.audioContext) this.nextStartTime = this.audioContext.currentTime;
  }

  downsampleBuffer(buffer: Float32Array, sampleRate: number, outSampleRate: number): Float32Array {
    if (outSampleRate === sampleRate) return buffer;
    const ratio = sampleRate / outSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0, count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  convertFloat32ToInt16(buffer: Float32Array): ArrayBuffer {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
      buf[l] = Math.min(1, Math.max(-1, buffer[l])) * 0x7fff;
    }
    return buf.buffer;
  }
}

export class GeminiClient {
  websocket: WebSocket | null = null;
  onOpen: () => void;
  onMessage: (event: MessageEvent) => void;
  onClose: (event: CloseEvent) => void;
  onError: (event: Event) => void;

  constructor(config: {
    onOpen?: () => void;
    onMessage?: (event: MessageEvent) => void;
    onClose?: (event: CloseEvent) => void;
    onError?: (event: Event) => void;
  }) {
    this.onOpen = config.onOpen || (() => {});
    this.onMessage = config.onMessage || (() => {});
    this.onClose = config.onClose || (() => {});
    this.onError = config.onError || (() => {});
  }

  connect(token?: string, voice?: string, persona?: string, lang?: string, userName?: string) {
    let wsUrl = `${import.meta.env.VITE_BACKEND_BASE_URL}/websocket/gemini/live`;
    wsUrl = wsUrl.replace("https://", "wss://").replace("http://", "ws://");

    const params = new URLSearchParams();
    if (token) params.append("token", token);
    if (voice) params.append("voice", voice);
    if (persona) params.append("persona", persona);
    if (lang) params.append("lang", lang);
    if (userName) params.append("user_name", userName);

    const qs = params.toString();
    if (qs) wsUrl += `?${qs}`;

    this.websocket = new WebSocket(wsUrl);
    this.websocket.binaryType = "arraybuffer";
    this.websocket.onopen = () => this.onOpen();
    this.websocket.onmessage = (e) => this.onMessage(e);
    this.websocket.onclose = (e) => this.onClose(e);
    this.websocket.onerror = (e) => this.onError(e);
  }

  send(data: string | ArrayBuffer) {
    if (this.websocket?.readyState === WebSocket.OPEN) this.websocket.send(data);
  }

  sendText(text: string, options?: { persist?: boolean }) {
    const payload: Record<string, unknown> = { type: "text", content: text };
    if (options?.persist === false) payload.persist = false;
    this.send(JSON.stringify(payload));
  }

  sendConfig(metadata: Record<string, unknown>) {
    this.send(JSON.stringify({ type: "config", metadata }));
  }

  disconnect() {
    if (this.websocket) { this.websocket.close(); this.websocket = null; }
  }

  isConnected() {
    return this.websocket?.readyState === WebSocket.OPEN;
  }
}
