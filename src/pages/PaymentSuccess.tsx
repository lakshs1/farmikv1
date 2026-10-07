import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, ShoppingBag, ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [countdown, setCountdown] = useState(8);

  const orderId  = searchParams.get("orderId") || "";
  const orderRef = searchParams.get("orderRef") || "";
  const shortRef = orderRef ? `#${orderRef}` : orderId ? `#ORD-${orderId.slice(0, 8).toUpperCase()}` : "";

  useEffect(() => {
    // 1. Immediately clear cart locally & in Supabase
    const cleanupCartAndOrder = async () => {
      try {
        clearCart();
      } catch {}

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("cart").delete().eq("user_id", user.id);
        }

        // Also ensure order is marked paid/success
        if (orderId) {
          await supabase
            .from("orders")
            .update({ status: "paid", payment_status: "success" })
            .or(`id.eq.${orderId},payment_id.eq.${orderId}`);
        }
      } catch (err) {
        console.warn("Success page cleanup warning:", err);
      }
    };

    cleanupCartAndOrder();

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate("/profile");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, orderId, clearCart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d2b1a] via-[#1A3C2A] to-[#0d2b1a] flex items-center justify-center px-4">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-green-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Success Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center animate-ping absolute inset-0" />
            <div className="w-24 h-24 bg-emerald-500/30 rounded-full flex items-center justify-center relative">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Main Message */}
        <h1
          className="text-4xl font-bold text-white mb-3"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Payment Successful!
        </h1>
        <p className="text-emerald-300 text-lg mb-2">
          Your FARMIK order has been confirmed.
        </p>

        {/* Order Details Card */}
        {shortRef && (
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-8">
            <p className="text-white/60 text-sm mb-1">Order Reference</p>
            <p className="text-white font-mono font-bold text-xl">{shortRef}</p>
            <p className="text-emerald-300 text-xs mt-2">
              ✓ Order logged in your profile & admin dashboard
            </p>
            <p className="text-emerald-300 text-xs">
              ✓ You will receive a confirmation shortly
            </p>
          </div>
        )}

        {/* Steps */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left space-y-3">
          <p className="text-white/80 text-sm font-semibold mb-2">What happens next?</p>
          {[
            "Order confirmed & recorded in our system",
            "Our team will verify & start processing",
            "You'll receive a WhatsApp update soon",
            "Estimated delivery: 3–5 business days",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-emerald-400 text-xs font-bold mt-0.5">0{i + 1}</span>
              <span className="text-white/70 text-xs">{step}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/profile")}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 h-auto rounded-xl"
          >
            <ShoppingBag className="w-4 h-4 mr-2" />
            View My Orders
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/products")}
            className="w-full border-white/30 text-white hover:bg-white/10 py-3 h-auto rounded-xl"
          >
            <Home className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>

        <p className="text-white/40 text-xs mt-6">
          Redirecting to your orders in {countdown}s...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
