import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, X, Search, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import farmikLogo from "@/assets/farmik-oils-logo.png";

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();
  const { items } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [searchOpen]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { label: "Home", to: "/" },
    { label: "Products", to: "/products" },
    { label: "About", to: "/about" },
    { label: "Blog", to: "/blog" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <>
      <header
        style={{
          transition: "background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease, height 0.4s ease",
        }}
        className={`fixed top-0 left-0 right-0 z-50 ${
          scrolled
            ? "bg-background/90 backdrop-blur-md shadow-[0_1px_0_hsl(var(--border))]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div
            className={`flex items-center justify-between transition-all duration-400 ${
              scrolled ? "h-[60px]" : "h-[80px]"
            }`}
          >
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <img
                src={farmikLogo}
                alt="Farmik Oils"
                className="h-8 w-auto"
              />
              <span
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                className="text-xl font-medium tracking-wide text-foreground hidden sm:block"
              >
                Farmik
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-link text-sm text-foreground/80 hover:text-foreground transition-colors ${
                    isActive(link.to) ? "active text-foreground" : ""
                  }`}
                  style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.03em" }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-3">
              {/* Search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                className="p-2 text-foreground/70 hover:text-foreground transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>

              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-foreground/70 hover:text-foreground transition-colors">
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary block" />
                )}
              </Link>

              {/* User (desktop) */}
              {user ? (
                <div className="hidden md:flex items-center gap-3">
                  <Link to="/profile" className="p-2 text-foreground/70 hover:text-foreground transition-colors">
                    <User className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-sm text-foreground/60 hover:text-foreground transition-colors"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="hidden md:block text-sm text-foreground/60 hover:text-foreground transition-colors"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Sign In
                </Link>
              )}

              {/* Hamburger (mobile) */}
              <button
                className="md:hidden p-2 text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Search bar — slides down */}
        <div
          style={{
            maxHeight: searchOpen ? "72px" : "0",
            overflow: "hidden",
            transition: "max-height 0.35s cubic-bezier(0.22,1,0.36,1)",
            borderTop: searchOpen ? "1px solid hsl(var(--border))" : "none",
          }}
          className="bg-background/95 backdrop-blur-md"
        >
          <form onSubmit={handleSearch} className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center gap-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={searchRef}
              type="search"
              placeholder="Search products…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none border-none"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Drawer */}
      {/* Overlay */}
      <div
        onClick={() => setDrawerOpen(false)}
        className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
        style={{
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Drawer panel */}
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-background flex flex-col md:hidden"
        style={{
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: "-8px 0 32px hsl(30 15% 15% / 0.12)",
        }}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <span
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-lg font-medium"
          >
            Farmik
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-2 text-foreground/70 hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 py-8 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`py-3 text-base border-b border-border/50 text-foreground/70 hover:text-foreground transition-colors ${
                isActive(link.to) ? "text-foreground font-medium" : ""
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
              onClick={() => setDrawerOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="px-6 py-6 border-t border-border">
          {user ? (
            <div className="flex flex-col gap-3">
              <Link
                to="/profile"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                <User className="h-4 w-4" /> Profile
              </Link>
              <button
                onClick={() => { signOut(); setDrawerOpen(false); }}
                className="text-left text-sm text-foreground/60 hover:text-foreground transition-colors"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              onClick={() => setDrawerOpen(false)}
              className="block text-sm text-foreground/70 hover:text-foreground transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>
    </>
  );
};