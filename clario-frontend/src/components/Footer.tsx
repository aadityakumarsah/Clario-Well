import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-3">Clario</h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Your daily companion for reflection, clarity, and emotional growth.
            </p>
          </div>
          <div>
            <h4 className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-4">Product</h4>
            <ul className="space-y-2 font-body text-sm">
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-body text-xs uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
            <ul className="space-y-2 font-body text-sm">
              <li><Link to="/privacy" className="text-foreground/70 hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-foreground/70 hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/30 text-center">
          <p className="font-body text-xs text-muted-foreground">
            © 2026 Clario. Crafted with intention.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
