import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShoppingCart, User, X, Search, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import farmikLogo from "@/assets/logo-farmik.png";

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

  const isHome = location.pathname === "/" || location.pathname === "/about";

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/" || location.pathname === "/about";
    if (path === "/products") return location.pathname === "/products" || location.pathname === "/shop";
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
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { label: "Shop", to: "/products" },
    { label: "About", to: "/" },
    { label: "Contact", to: "/contact" },
  ];

  return (
    <>
      <header
        className={`${isHome ? "fixed" : "sticky"} top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isHome
            ? scrolled
              ? "bg-[#0B0A08]/85 backdrop-blur-md border-b border-white/5 py-3 shadow-lg shadow-black/40"
              : "bg-transparent border-b border-transparent py-4"
            : scrolled
              ? "bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#1A3C2A]/10 py-3 shadow-xs"
              : "bg-[#FAF9F5]/40 backdrop-blur-xs border-b border-[#1A3C2A]/5 py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo & Brand Name */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="h-10 w-auto flex items-center justify-center">
                <img
                  src={farmikLogo}
                  alt="FARMIK logo"
                  className="h-10 w-auto transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col">
                <span
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  className={`text-2xl font-bold tracking-tight transition-colors ${
                    isHome ? "text-white/95" : "text-[#1A3C2A] group-hover:text-[#2D5A27]"
                  }`}
                >
                  FARMIK
                </span>
                <span className={`text-[9px] uppercase tracking-[0.2em] font-semibold -mt-1 ${
                  isHome ? "text-white/40" : "text-[#1A3C2A]/50"
                }`}>
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
                    isHome
                      ? isActive(link.to)
                        ? "text-white font-semibold"
                        : "text-white/70 hover:text-white"
                      : isActive(link.to)
                        ? "text-[#1A3C2A] font-semibold"
                        : "text-[#1A3C2A]/70 hover:text-[#1A3C2A]"
                  }`}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {link.label}
                  {isActive(link.to) && (
                    <span className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full animate-fadeIn ${
                      isHome ? "bg-[#C89B3C]" : "bg-[#1A3C2A]"
                    }`} />
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
                className={`p-2.5 rounded-full transition-all ${
                  isHome
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-[#1A3C2A]/70 hover:text-[#1A3C2A] hover:bg-[#1A3C2A]/5"
                }`}
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Cart Button */}
              <Link
                to="/cart"
                className={`relative p-2.5 rounded-full transition-all ${
                  isHome
                    ? "text-white/70 hover:text-white hover:bg-white/10"
                    : "text-[#1A3C2A]/70 hover:text-[#1A3C2A] hover:bg-[#1A3C2A]/5"
                }`}
                aria-label="Shopping Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full text-xs font-bold flex items-center justify-center shadow-sm ${
                    isHome ? "bg-[#C89B3C] text-black" : "bg-[#1A3C2A] text-white"
                  }`}>
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* User Profile / Auth */}
              {user ? (
                <div className={`hidden md:flex items-center gap-2 border-l pl-3 ml-1 ${
                  isHome ? "border-white/10" : "border-[#1A3C2A]/10"
                }`}>
                  <Link
                    to="/profile"
                    className={`p-2.5 rounded-full transition-all flex items-center gap-2 ${
                      isHome
                        ? "text-white/70 hover:text-white hover:bg-white/10"
                        : "text-[#1A3C2A]/70 hover:text-[#1A3C2A] hover:bg-[#1A3C2A]/5"
                    }`}
                    title="Profile"
                  >
                    <User className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={signOut}
                    className={`text-xs font-semibold px-2 py-1 rounded transition-colors ${
                      isHome ? "text-white/60 hover:text-[#C89B3C]" : "text-[#1A3C2A]/60 hover:text-red-700"
                    }`}
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className={`hidden md:inline-flex items-center justify-center px-4 py-2 text-xs font-semibold tracking-wider rounded-lg transition-all shadow-xs ${
                    isHome
                      ? "text-[#C89B3C] border border-[#C89B3C]/40 hover:bg-[#C89B3C] hover:text-black"
                      : "text-[#1A3C2A] border border-[#1A3C2A]/30 hover:bg-[#1A3C2A] hover:text-white"
                  }`}
                >
                  SIGN IN
                </Link>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                className={`md:hidden p-2.5 rounded-lg ${
                  isHome ? "text-white/80 hover:bg-white/10" : "text-[#1A3C2A]/80 hover:bg-[#1A3C2A]/5"
                }`}
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
          <div className={`border-t px-4 py-3 shadow-md animate-fadeIn ${
            isHome
              ? "border-white/10 bg-[#0B0A08]/95 backdrop-blur-lg"
              : "border-[#1A3C2A]/10 bg-[#FAF9F5]/95 backdrop-blur-lg"
          }`}>
            <form onSubmit={handleSearch} className="max-w-3xl mx-auto flex items-center gap-3">
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="search"
                placeholder="Search pure mustard oil, cold-pressed oils..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`flex-1 bg-transparent text-sm outline-none py-1 ${
                  isHome ? "text-white placeholder:text-white/30" : "text-[#1A3C2A] placeholder:text-[#1A3C2A]/30"
                }`}
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
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />
          <div className={`relative w-4/5 max-w-xs h-full shadow-2xl z-10 flex flex-col p-6 overflow-y-auto ${
            isHome ? "bg-[#0B0A08] text-white border-l border-white/5" : "bg-[#FAF9F5] text-[#1A3C2A] border-l border-[#1A3C2A]/5"
          }`}>
            <div className={`flex items-center justify-between pb-6 border-b ${
              isHome ? "border-white/5" : "border-[#1A3C2A]/5"
            }`}>
              <div className="flex items-center gap-2">
                <img
                  src={farmikLogo}
                  alt="FARMIK"
                  className="h-8 w-auto"
                />
                <span
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  className={`text-2xl font-bold ${isHome ? "text-white/95" : "text-[#1A3C2A]"}`}
                >
                  FARMIK
                </span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className={`p-2 transition-colors ${
                  isHome ? "text-white/55 hover:text-white" : "text-[#1A3C2A]/55 hover:text-[#1A3C2A]"
                }`}
              >
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
                      ? isHome
                        ? "bg-white/10 text-white font-semibold"
                        : "bg-[#1A3C2A]/10 text-[#1A3C2A] font-semibold"
                      : isHome
                        ? "text-white/70 hover:bg-white/5"
                        : "text-[#1A3C2A]/70 hover:bg-[#1A3C2A]/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className={`mt-auto pt-6 border-t flex flex-col gap-3 ${
              isHome ? "border-white/5" : "border-[#1A3C2A]/5"
            }`}>
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 py-2.5 px-4 rounded-lg ${
                      isHome ? "text-white/70 hover:bg-white/5" : "text-[#1A3C2A]/70 hover:bg-[#1A3C2A]/5"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>My Account</span>
                  </Link>
                  <button
                    onClick={() => { signOut(); setDrawerOpen(false); }}
                    className={`text-left text-sm font-semibold px-4 py-2 rounded-lg ${
                      isHome ? "text-red-400 hover:bg-red-950/20" : "text-red-600 hover:bg-red-50"
                    }`}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setDrawerOpen(false)}
                  className={`w-full text-center py-3 font-semibold text-sm rounded-lg shadow-sm ${
                    isHome ? "bg-[#C89B3C] text-black" : "bg-[#1A3C2A] text-white"
                  }`}
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