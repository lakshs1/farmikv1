import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const LayoutContainer = () => {
  const location = useLocation();
  const isHome = location.pathname === "/" || location.pathname === "/about";

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isHome ? "bg-[#0B0A08]" : "bg-[#FAF9F5]"}`}>
      <Header />
      <main className="flex-1">
        <Routes>
          {/* Default landing page is the premium cold-pressed oil scrollytelling */}
          <Route path="/" element={<About />} />
          <Route path="/about" element={<About />} />
          
          {/* Shop / Product catalog routes */}
          <Route path="/shop" element={<Products />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          
          {/* Other Navigation Pages */}
          <Route path="/contact" element={<Contact />} />
          
          {/* Legal Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          
          {/* User Account & Cart */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Admin Portal */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <div className={isHome ? "relative z-30" : ""}>
        <Footer />
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <LayoutContainer />
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;