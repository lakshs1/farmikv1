import { useEffect } from "react";
import { FileCheck, ShieldAlert, Truck, ShoppingBag, Scale } from "lucide-react";

const TermsAndConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F5] pt-28 pb-20">
      {/* Header Banner */}
      <div className="bg-[#1A3C2A] text-white py-16 px-4 sm:px-6 lg:px-8 mb-12 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-4">
            <FileCheck className="w-3.5 h-3.5" /> Legal Agreement
          </span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Terms & Conditions
          </h1>
          <p className="text-emerald-100/90 text-sm max-w-xl mx-auto font-light">
            Welcome to <strong className="font-semibold text-white">myfarmik</strong>. Please read these terms carefully before placing an order.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-emerald-950/5 space-y-8 text-gray-700 text-sm leading-relaxed">
          
          <p className="text-base text-gray-600 border-b border-gray-100 pb-6">
            Effective Date: <strong>August 6, 2026</strong> | Last Updated: <strong>August 6, 2026</strong>
          </p>

          {/* Section 1 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#1A3C2A] font-bold text-lg">
              <Scale className="w-5 h-5 text-[#2D5A27]" />
              <h2>1. General Acceptance</h2>
            </div>
            <p>
              By accessing, browsing, or purchasing products on <strong className="text-gray-900">myfarmik</strong>, you agree to be bound by these Terms and Conditions, as well as our Privacy Policy.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#1A3C2A] font-bold text-lg">
              <ShoppingBag className="w-5 h-5 text-[#2D5A27]" />
              <h2>2. Product Quality & Natural Variations</h2>
            </div>
            <p>
              Our mustard oil and organic cold-pressed products are 100% natural and extracted using traditional wooden churn methods without chemical refining or bleaching.
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-600">
              <li>Natural variations in oil viscosity, pungent aroma, and sediment settling may occur between harvest batches.</li>
              <li>Product prices and availability are subject to change without prior notice.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#1A3C2A] font-bold text-lg">
              <Truck className="w-5 h-5 text-[#2D5A27]" />
              <h2>3. Shipping, Delivery & Taxes</h2>
            </div>
            <p>
              Orders are dispatched within 24–48 hours from our production facility. Estimated shipping timelines depend on regional carrier routes (typically 2–5 business days across India). All applicable GST taxes are itemized during checkout.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#1A3C2A] font-bold text-lg">
              <ShieldAlert className="w-5 h-5 text-[#2D5A27]" />
              <h2>4. Returns & Replacement Policy</h2>
            </div>
            <p>
              Due to food safety standards, edible oil products are non-returnable once opened. However, if your package arrives damaged, leaked, or incorrect, notify us within 48 hours of delivery with photo proof for an immediate free replacement.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-[#1A3C2A] font-bold text-lg">5. Governing Law</h2>
            <p>
              These terms are governed by the laws of India. Any disputes arising in connection with orders placed on <strong className="text-gray-900">myfarmik</strong> shall be subject to the exclusive jurisdiction of the courts in Gautam Buddha Nagar / Noida, UP.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
