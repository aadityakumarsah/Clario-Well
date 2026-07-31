import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div 
        className="absolute inset-0 pointer-events-none z-0"
        style={{ 
          background: "radial-gradient(circle at 50% -20%, rgba(167, 139, 250, 0.08) 0%, transparent 60%)"
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary animate-pulse" />
            <span className="font-display text-xl font-semibold tracking-wide">Clario</span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 md:py-16 relative z-10">
        <div className="space-y-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent mb-3 font-body">Legal Documentation</p>
            <h1 className="font-display text-4xl md:text-5xl font-light text-foreground leading-tight">
              Privacy <span className="italic text-primary font-semibold">Policy</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-4 font-body bg-card/50 px-3 py-1.5 rounded-md inline-block border border-border/30">
              Last Updated: July 31, 2026
            </p>
          </div>

          <div className="prose prose-stone dark:prose-invert max-w-none font-body text-base leading-relaxed text-muted-foreground space-y-6">
            <p className="text-lg text-foreground/80 leading-relaxed font-light">
              Welcome to <strong>Clario No Contact</strong> (com.clario.mobile) (referred to as "Clario", "we", "us", or "our"), 
              operated by <strong>Digital Pathshala</strong>. Your privacy is paramount to us. Clario is designed as a mindful companion 
              for reflection, emotional clarity, and wellness. This Privacy Policy details how we access, collect, use, and share 
              your data.
            </p>

            <section className="space-y-4 pt-4">
              <h2 className="font-display text-2xl font-semibold text-foreground border-b border-border/30 pb-2">1. Data We Collect and How We Access It</h2>
              <p>
                We minimize data collection to only what is necessary to deliver and improve our services.
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong className="text-foreground">Account Credentials:</strong> If you register or authenticate, we securely collect and store your email address 
                  and password. This authentication is securely powered and managed using Supabase.
                </li>
                <li>
                  <strong className="text-foreground">Voice and Audio Data:</strong> When utilizing Clario's voice journaling and reflection features, your voice recordings 
                  are securely processed through our secure FastAPI backend. They are analyzed using secure instances of the Google Gemini API 
                  to generate private, personal reflection reports. We do not use your voice data or transcripts for training models or for advertisement.
                </li>
                <li>
                  <strong className="text-foreground">Camera-Based Video Streams:</strong> Clario features camera-guided mindfulness tools, including Daily Check-In movement breaks 
                  (such as camera-tracked physical squats) and Air Drawing (spatial hand-tracking). Your video stream is 
                  <strong> processed entirely locally and in-browser on your device</strong> using MediaPipe technology. Video and camera streams are 
                  never transmitted to, stored, or recorded on our backend servers.
                </li>
                <li>
                  <strong className="text-foreground">Device and Log Data:</strong> We may collect standard diagnostic information, such as IP addresses, browser and operating 
                  system versions, and crash logs to resolve bugs and maintain security.
                </li>
              </ul>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="font-display text-2xl font-semibold text-foreground border-b border-border/30 pb-2">2. How We Use Your Data</h2>
              <p>We use your information exclusively to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, secure, and personalize Clario features (including your home garden progress, breathing patterns, and journals).</li>
                <li>Process your voice journals to offer helpful, non-clinical reflection reports.</li>
                <li>Verify your subscription status and manage premium pre-booking or access rules.</li>
                <li>Analyze app health, troubleshoot technical performance issues, and enhance general platform design.</li>
              </ul>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="font-display text-2xl font-semibold text-foreground border-b border-border/30 pb-2">3. Data Sharing and Third-Party Services</h2>
              <p>
                We do not sell, rent, or trade your personal data. We only share information with trusted providers essential to running 
                our service, subject to strict confidentiality agreements:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong className="text-foreground">Supabase:</strong> To provide secure user account login, identity management, and persistent database hosting.
                </li>
                <li>
                  <strong className="text-foreground">Google Gemini API:</strong> To analyze journaling transcripts and air-drawing metadata and return helpful emotional reflections. 
                  These interactions comply with enterprise-grade privacy boundaries; your data is not stored or utilized for base model training.
                </li>
                <li>
                  <strong className="text-foreground">Hosting Partners:</strong> Our website and web application are hosted on Cloudflare Pages and verified secure servers.
                </li>
              </ul>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="font-display text-2xl font-semibold text-foreground border-b border-border/30 pb-2">4. Camera and Audio Permissions</h2>
              <p>
                To provide specific in-app features, Clario may request access to your device's camera and microphone.
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <strong className="text-foreground">Microphone Permission:</strong> Required for the live Voice Journaling feature. Your audio is captured strictly when 
                  you activate recording, and is used solely to generate your reflection reports.
                </li>
                <li>
                  <strong className="text-foreground">Camera Permission:</strong> Required for Air Drawing, movement breaks, and spatial block interaction. The camera feed 
                  remains strictly in the temporary local memory of your browser and is never uploaded or saved.
                </li>
              </ul>
              <p>
                You can deny or revoke these permissions at any time via your browser or device operating system settings.
              </p>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="font-display text-2xl font-semibold text-foreground border-b border-border/30 pb-2">5. Data Security & Retention</h2>
              <p>
                We implement robust security standards to safeguard your information both during transmission and once stored. Your journal entries 
                and account profile are protected with modern encryption and JWT token-based session management. We retain personal data only 
                as long as your account is active or as needed to provide you with Clario's wellness services.
              </p>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="font-display text-2xl font-semibold text-foreground border-b border-border/30 pb-2">6. Your Rights and Choices</h2>
              <p>
                You hold full ownership of your data. At any time, you can:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access, modify, or update your account information.</li>
                <li>Request the complete deletion of your account and all associated journals, records, and garden progress by contacting us.</li>
                <li>Opt-out of optional permissions like camera or microphone inputs.</li>
              </ul>
            </section>

            <section className="space-y-4 pt-4">
              <h2 className="font-display text-2xl font-semibold text-foreground border-b border-border/30 pb-2">7. Contact Us</h2>
              <p>
                If you have any questions or concerns regarding this Privacy Policy or your data, please contact us at:
              </p>
              <div className="bg-card/40 border border-border/50 p-6 rounded-2xl text-foreground space-y-1 mt-4 shadow-sm">
                <p className="font-semibold text-lg text-primary">Digital Pathshala</p>
                <p className="text-muted-foreground text-sm">Email: <a href="mailto:support@digitalpathshala.org" className="text-foreground hover:underline">support@digitalpathshala.org</a></p>
                <p className="text-muted-foreground text-sm">Address: Lalitpur, Nepal</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/20 py-8 text-center text-xs text-muted-foreground font-body relative z-10">
        <p>© 2026 Clario. Crafted with intention by Digital Pathshala.</p>
      </footer>
    </div>
  );
};

export default Privacy;
