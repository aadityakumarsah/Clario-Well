const KEY = 'clario_free_voice_used';

export function hasFreeSessionBeenUsed(): boolean {
  return localStorage.getItem(KEY) === '1';
}

export function markFreeSessionUsed(): void {
  localStorage.setItem(KEY, '1');
}
