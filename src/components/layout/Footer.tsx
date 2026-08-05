import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube } from "lucide-react";
import farmikLogo from "@/assets/farmik-oils-logo.png";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-muted border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">

          {/* Brand */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-3 mb-6">
              <img src={farmikLogo} alt="Farmik Oils" className="h-8 w-auto" />
              <span
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                className="text-xl font-medium text-foreground"
              >
                Farmik Oils
              </span>
            </Link>
            <p
              className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-8"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Cold-pressed the traditional way. Pure mustard oil extracted without heat or chemicals —
              preserving every nutrient, every drop of authentic flavour.
            </p>
            <div className="flex items-center gap-5">
              <a
                href="#"
                aria-label="Facebook"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Spacer */}
          <div className="hidden md:block md:col-span-1" />

          {/* Pages */}
          <div className="md:col-span-2">
            <h4
              className="text-xs uppercase tracking-widest text-foreground/50 mb-5"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Pages
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Home", to: "/" },
                { label: "Products", to: "/products" },
                { label: "About", to: "/about" },
                { label: "Blog", to: "/blog" },
                { label: "Contact", to: "/contact" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4
              className="text-xs uppercase tracking-widest text-foreground/50 mb-5"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Contact
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>
              <li>
                <a href="mailto:care@myfarmik.com" className="hover:text-foreground transition-colors">
                  care@myfarmik.com
                </a>
              </li>
              <li>
                <a href="tel:+919876543210" className="hover:text-foreground transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="text-muted-foreground/80 leading-relaxed">
                123 Traditional Oil Mill<br />
                Mustard Fields, Punjab, India
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            © {year} Farmik Oils. All rights reserved.
          </p>
          <div
            className="flex items-center gap-6 text-xs text-muted-foreground"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
};