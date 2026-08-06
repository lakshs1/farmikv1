import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, X, Search, Menu, Leaf } from "lucide-react";
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

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" || location.pathname === "/products" || location.pathname === "/shop";
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [searchOpen]);

  useEffect(() => {
    setDrawerOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  // ONLY Shop, About, and Contact in navigation bar as explicitly requested by user
  const navLinks = [
    { label: "Shop", to: "/" },
    { label: "About", to: "/about" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <>
      {/* Top Banner */}
      <div className="bg-[#1A3C2A] text-[#E8F3E8] text-xs font-medium py-2 px-4 text-center tracking-wider flex items-center justify-center gap-2">
        <Leaf className="w-3.5 h-3.5 text-[#A3E0A3] animate-pulse" />
        <span>100% Pure Traditional Cold-Pressed Oils — Free Shipping on Orders Over ₹499</span>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-emerald-950/10 py-3"
            : "bg-[#FAF9F5]/90 backdrop-blur-md border-b border-emerald-950/5 py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo & Brand Name */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-auto flex items-center justify-center">
                <img
                  src={farmikLogo}
                  alt="myfarmik logo"
                  className="h-10 w-auto text-[#2D5A27] transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col">
                <span
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  className="text-2xl font-bold tracking-tight text-[#1A3C2A] group-hover:text-[#2D5A27] transition-colors"
                >
                  myfarmik
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] font-semibold text-[#5A7A5A] -mt-1">
                  Purity to your kitchen
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Menu: Shop, About, Contact only */}
            <nav className="hidden md:flex items-center gap-9">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative py-1 text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? "text-[#2D5A27] font-semibold"
                      : "text-gray-700 hover:text-[#2D5A27]"
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D5A27] rounded-full animate-fadeIn" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center gap-3">
              {/* Search Toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
                className="p-2.5 rounded-full text-gray-700 hover:text-[#2D5A27] hover:bg-emerald-50/60 transition-all"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Cart Button */}
              <Link
                to="/cart"
                className="relative p-2.5 rounded-full text-gray-700 hover:text-[#2D5A27] hover:bg-emerald-50/60 transition-all"
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-[#2D5A27] text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* User Profile / Auth */}
              {user ? (
                <div className="hidden md:flex items-center gap-2 border-l border-emerald-950/10 pl-3 ml-1">
                  <Link
                    to="/profile"
                    className="p-2.5 rounded-full text-gray-700 hover:text-[#2D5A27] hover:bg-emerald-50/60 transition-all flex items-center gap-2"
                    title="Profile"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-xs font-semibold text-gray-600 hover:text-red-700 px-2 py-1 rounded transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="hidden md:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-wider text-[#1A3C2A] border border-[#1A3C2A]/30 rounded-lg hover:bg-[#1A3C2A] hover:text-white transition-all shadow-xs"
                >
                  SIGN IN
                </Link>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                className="md:hidden p-2.5 rounded-lg text-gray-700 hover:bg-emerald-50"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Search Bar */}
        {searchOpen && (
          <div className="border-t border-emerald-950/10 bg-white/95 backdrop-blur-lg px-4 py-3 shadow-md animate-fadeIn">
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex items-center gap-3">
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search pure mustard oil, cold-pressed oils..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 text-sm outline-none py-1"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <img src={farmikLogo} alt="myfarmik" className="h-8 w-auto text-[#2D5A27]" />
                <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-bold text-[#1A3C2A]">
                  myfarmik
                </span>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 text-gray-500 hover:text-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col py-6 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setDrawerOpen(false)}
                  className={`py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                    isActive(link.to)
                      ? "bg-emerald-50 text-[#2D5A27] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-100 flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-700 hover:bg-emerald-50"
                  >
                    <User className="h-5 w-5" />
                    <span>My Account</span>
                  </Link>
                  <button
                    onClick={() => { signOut(); setDrawerOpen(false); }}
                    className="text-left text-sm text-red-600 font-semibold px-4 py-2 hover:bg-red-50 rounded-lg"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setDrawerOpen(false)}
                  className="w-full text-center py-3 bg-[#1A3C2A] text-white font-semibold text-sm rounded-lg shadow-sm"
                >
                  Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};