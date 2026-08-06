import { Link } from "react-router-dom";
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import farmikLogo from "@/assets/farmik-oils-logo.png";

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#15291C] text-gray-300 border-t border-emerald-900/40">
      {/* Value Proposition Strip */}
      <div className="border-b border-emerald-900/40 bg-[#1A3C2A]/60 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="p-3 bg-emerald-800/40 rounded-xl text-[#A3E0A3]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-white font-semibold text-sm">100% Traditional Cold-Pressed</h5>
              <p className="text-xs text-gray-400">Zero chemicals, zero solvent extraction</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="p-3 bg-emerald-800/40 rounded-xl text-[#A3E0A3]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-white font-semibold text-sm">Fast Pan-India Shipping</h5>
              <p className="text-xs text-gray-400">Direct from farm to your doorstep</p>
            </div>
          </div>
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="p-3 bg-emerald-800/40 rounded-xl text-[#A3E0A3]">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h5 className="text-white font-semibold text-sm">Quality Guaranteed</h5>
              <p className="text-xs text-gray-400">Freshly churned in small, tested batches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand Info */}
          <div className="md:col-span-5">
            <Link to="/" className="inline-flex items-center gap-3 mb-5 group">
              <img src={farmikLogo} alt="myfarmik logo" className="h-10 w-auto text-emerald-400" />
              <div className="flex flex-col">
                <span
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  className="text-2xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors"
                >
                  myfarmik
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-emerald-400/80 -mt-1">
                  Purity to your kitchen
                </span>
              </div>
            </Link>

            <p className="text-sm text-gray-400 max-w-sm leading-relaxed mb-6">
              Cold-pressed the authentic way. Pure mustard oil extracted using traditional wooden churns —
              preserving natural aroma, essential omega fatty acids, and uncompromised taste.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="#"
                aria-label="Facebook"
                className="w-9 h-9 rounded-full bg-emerald-900/40 hover:bg-emerald-700/60 text-gray-300 hover:text-white flex items-center justify-center transition-all"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-emerald-900/40 hover:bg-emerald-700/60 text-gray-300 hover:text-white flex items-center justify-center transition-all"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="w-9 h-9 rounded-full bg-emerald-900/40 hover:bg-emerald-700/60 text-gray-300 hover:text-white flex items-center justify-center transition-all"
              >
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-5">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Shop Products", to: "/" },
                { label: "About Us", to: "/about" },
                { label: "Contact Us", to: "/contact" },
                { label: "Privacy Policy", to: "/privacy-policy" },
                { label: "Terms & Conditions", to: "/terms" },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-300 hover:text-emerald-400 transition-colors inline-block py-0.5"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="md:col-span-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-5">
              Get in Touch
            </h4>
            <ul className="space-y-3.5 text-sm text-gray-300">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-emerald-400 shrink-0" />
                <a href="mailto:care@myfarmik.com" className="hover:text-emerald-400 transition-colors">
                  care@myfarmik.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0" />
                <a href="tel:08287317599" className="hover:text-emerald-400 transition-colors">
                  +91 82873 17599
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-emerald-400 shrink-0 mt-1" />
                <span className="text-gray-400 leading-relaxed">
                  B-4, Block B, Sector 60<br />
                  Noida, Uttar Pradesh 201309
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and legal links */}
        <div className="border-t border-emerald-900/40 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {year} myfarmik. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-emerald-400 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};