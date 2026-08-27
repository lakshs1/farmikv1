import { useEffect } from "react";
import { ShieldCheck, Lock, Eye, FileText, Bell } from "lucide-react";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F5] pt-28 pb-20">
      {/* Header Banner */}
      <div className="bg-[#1A3C2A] text-white py-16 px-4 sm:px-6 lg:px-8 mb-12 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/60 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Official Policy
          </span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Privacy Policy
          </h1>
          <p className="text-emerald-100/90 text-sm max-w-xl mx-auto font-light">
            At <strong className="font-semibold text-white">FARMIK</strong>, we value your privacy and are committed to protecting your personal information.
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
              <Eye className="w-5 h-5 text-[#2D5A27]" />
              <h2>1. Information We Collect</h2>
            </div>
            <p>
              When you visit or place an order on <strong className="text-gray-900">FARMIK</strong>, we collect personal details necessary to fulfill your orders and provide a seamless shopping experience:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-600">
              <li><strong>Personal Identifiers:</strong> Name, email address, phone number, and delivery address.</li>
              <li><strong>Payment Details:</strong> Transaction records handled securely through encrypted payment gateways (we do not store raw card/banking numbers).</li>
              <li><strong>Device & Usage Data:</strong> IP address, browser type, pages visited, and cookie session tokens.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#1A3C2A] font-bold text-lg">
              <FileText className="w-5 h-5 text-[#2D5A27]" />
              <h2>2. How We Use Your Information</h2>
            </div>
            <p>
              We use your information strictly for legitimate business purposes including:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-gray-600">
              <li>Processing, packing, and dispatching your orders of cold-pressed oils.</li>
              <li>Sending order status updates, delivery tracking SMS/emails, and invoice information.</li>
              <li>Providing customer support and responding to inquiries.</li>
              <li>Improving website speed, user interface design, and catalog offerings.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#1A3C2A] font-bold text-lg">
              <Lock className="w-5 h-5 text-[#2D5A27]" />
              <h2>3. Data Protection & Security</h2>
            </div>
            <p>
              We implement industry-standard physical, electronic, and administrative safeguards. All communications on <strong className="text-gray-900">FARMIK</strong> are encrypted using SSL technology. We never sell, rent, or lease your personal data to third parties.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-[#1A3C2A] font-bold text-lg">
              <Bell className="w-5 h-5 text-[#2D5A27]" />
              <h2>4. Cookies & Analytics</h2>
            </div>
            <p>
              We use essential cookies to keep items in your shopping cart and remember your preferences during sessions. You can disable cookies in your browser settings, though certain website features may be impacted.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 border-t border-gray-100 pt-6">
            <h2 className="text-[#1A3C2A] font-bold text-lg">5. Contact Us Regarding Privacy</h2>
            <p>
              If you have questions, concerns, or requests to update or delete your personal details, please contact our support team at:
            </p>
            <div className="bg-[#FAF9F5] p-4 rounded-xl border border-emerald-900/10 text-xs sm:text-sm">
              <p className="font-semibold text-gray-900">FARMIK Customer Care</p>
              <p>Email: <a href="mailto:care@farmik.com" className="text-[#2D5A27] underline">care@farmik.com</a></p>
              <p>Phone: <a href="tel:08287317599" className="text-[#2D5A27] underline">+91 82873 17599</a></p>
              <p>Address: B-4, Block B, Sector 60, Noida, Uttar Pradesh 201309</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
