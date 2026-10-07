import { useSearchParams, useNavigate } from "react-router-dom";
import { XCircle, RefreshCw, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const orderId  = searchParams.get("orderId") || "";
  const orderRef = searchParams.get("orderRef") || "";
  const reason   = searchParams.get("reason") || "Payment was not completed";
  const shortRef = orderRef ? `#${orderRef}` : orderId ? `#ORD-${orderId.slice(0, 8).toUpperCase()}` : "";

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi FARMIK Team,\n\nI had a payment failure for order ${shortRef}.\nPlease help me complete my purchase.\n\nThank you!`
    );
    window.open(`https://wa.me/918287317599?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0d0d] via-[#2d1010] to-[#1a0d0d] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center max-w-md w-full">
        {/* Failed Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center animate-ping absolute inset-0" />
            <div className="w-24 h-24 bg-red-500/30 rounded-full flex items-center justify-center relative">
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>
        </div>

        <h1
          className="text-4xl font-bold text-white mb-3"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Payment Failed
        </h1>
        <p className="text-red-300 text-base mb-2">
          Your payment could not be processed.
        </p>

        {/* Details Card */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 mb-8">
          {shortRef && (
            <>
              <p className="text-white/60 text-sm mb-1">Order Reference</p>
              <p className="text-white font-mono font-bold text-xl mb-3">{shortRef}</p>
            </>
          )}
          <p className="text-red-300 text-sm">
            Reason: <span className="font-semibold capitalize">{reason.replace(/_/g, " ")}</span>
          </p>
          <p className="text-white/50 text-xs mt-2">
            ℹ️ No amount was deducted. Your order has been cancelled.
          </p>
        </div>

        {/* Options */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-left space-y-2">
          <p className="text-white/80 text-sm font-semibold mb-2">What you can do:</p>
          {[
            "Try paying again with a different card/UPI",
            "Contact us on WhatsApp for assisted payment",
            "Ensure your bank/UPI app allows the transaction",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-orange-400 text-xs font-bold mt-0.5">→</span>
              <span className="text-white/70 text-xs">{item}</span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/cart")}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 h-auto rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={handleWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 h-auto rounded-xl"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Get Help on WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/products")}
            className="w-full border-white/30 text-white hover:bg-white/10 py-3 h-auto rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
