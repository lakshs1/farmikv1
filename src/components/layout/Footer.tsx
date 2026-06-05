import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import farmikLogo from "@/assets/farmik-oils-logo.png";

export const Footer = () => {
  return (
    <footer className="bg-muted border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={farmikLogo} 
                alt="Farmik Oils Logo" 
                className="h-10 w-auto"
              />
              <span className="font-bold text-xl text-primary">Farmik Oils</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Premium cold-pressed mustard oil, traditionally extracted to preserve natural nutrients and authentic taste. 
              Pure, healthy, and rich in omega-3 fatty acids.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Contact Info</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <a href="tel:904-885-7266" className="hover:text-primary transition-colors">904-885-7266</a>
              </li>
              <li className="flex items-center space-x-2 text-muted-foreground flex-wrap">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <a href="mailto:support@myfarmik.com" className="hover:text-primary transition-colors">support@myfarmik.com</a>
                <span className="mx-1 text-muted-foreground">,</span>
                <a href="mailto:care@myfarmik.com" className="hover:text-primary transition-colors">care@myfarmik.com</a>
              </li>
              <li className="flex items-start space-x-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                <a 
                  href="https://www.google.com/maps/place/Farmik/@28.6028927,77.3622366,214m/data=!3m2!1e3!4b1!4m6!3m5!1s0x390ce5d853fa9e83:0x3d629c2af3cac743!8m2!3d28.6028927!4d77.3628803!16s%2Fg%2F11xw3936yy?entry=ttu&g_ep=EgoyMDI2MDYwMS4wIKXMDSoASAFQAw%3D%3D" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-primary transition-colors"
                >
                  B-4, Block B, Sector 60,<br />Noida, Uttar Pradesh 201309
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            © 2024 Farmik Oils. All rights reserved. | Premium Cold-Pressed Mustard Oil | Best Quality Healthy Oils
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Keywords: best cold press oil, mustard oil, cold press mustard oils, farmik oils
          </p>
        </div>
      </div>
    </footer>
  );
};