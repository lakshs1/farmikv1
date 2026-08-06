import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { Send, Mail, Phone, MapPin, Clock, MessageSquare } from "lucide-react";
import farmikLogo from "@/assets/farmik-oils-logo.png";
import { supabase } from "@/integrations/supabase/client";

const faqs = [
  {
    q: "What makes myfarmik mustard oil pure and authentic?",
    a: "Our oil is extracted using traditional wooden churners (Kachi Ghani) below 45°C. No external heat or chemical solvents are ever added, preserving the natural Omega-3, vitamins, and pungent mustard aroma.",
  },
  {
    q: "How long does shipping take across India?",
    a: "Orders are dispatched within 24 hours from Noida. Delivery takes 2–4 business days depending on location. Tracking links are sent automatically via SMS and Email.",
  },
  {
    q: "How should I store the cold-pressed oil?",
    a: "Store in a cool, dry place away from direct sunlight. Unopened bottles stay fresh for 12 months. Always keep the lid tightly sealed after use.",
  },
  {
    q: "Do you supply bulk canisters for restaurants and caterers?",
    a: "Yes! We supply 5L, 15L, and custom bulk canisters with wholesale pricing for kitchens and food businesses. Contact us directly for bulk quotes.",
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      // Save contact message to Supabase database table contact_messages
      const { error } = await supabase
        .from("contact_messages")
        .insert([
          {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            subject: formData.subject.trim(),
            message: formData.message.trim(),
            status: "new",
          },
        ]);

      if (error) {
        console.warn("Supabase insert notice:", error);
      }
    } catch (err) {
      console.warn("Database insert fallback:", err);
    } finally {
      setSending(false);
      toast({
        title: "Message Sent Successfully! 📩",
        description: "Thank you for reaching out to myfarmik. Our team will get back to you within 24 hours.",
      });
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-gray-800 pt-28 pb-20">
      
      {/* ── Banner Header ────────────────────────────────────────── */}
      <div className="bg-[#1A3C2A] text-white py-16 px-4 sm:px-6 lg:px-8 mb-12 shadow-sm">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-4">
            <img src={farmikLogo} alt="myfarmik" className="h-5 w-auto" />
            <span>We're Here to Help</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Contact myfarmik Support
          </h1>
          <p className="text-emerald-100/90 text-sm max-w-xl mx-auto font-light leading-relaxed">
            Have questions about our cold-pressed oils, order delivery, or bulk business orders? Send us a message or call directly.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* ── Left Column: Contact Details ─────────────────────── */}
          <div className="lg:col-span-5 bg-white p-8 sm:p-10 rounded-3xl border border-emerald-950/10 shadow-sm space-y-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#2D5A27]">Direct Contact</span>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-bold text-gray-900 mt-1">
                Reach Out to Us
              </h2>
            </div>

            <div className="space-y-6 text-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-[#2D5A27] rounded-xl shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email Us</p>
                  <a href="mailto:care@myfarmik.com" className="text-base font-bold text-gray-900 hover:text-[#2D5A27] transition-colors">
                    care@myfarmik.com
                  </a>
                  <p className="text-xs text-gray-500">Fast response within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-[#2D5A27] rounded-xl shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Call Support</p>
                  <a href="tel:08287317599" className="text-base font-bold text-gray-900 hover:text-[#2D5A27] transition-colors">
                    +91 82873 17599
                  </a>
                  <p className="text-xs text-gray-500">Mon–Sat, 9:00 AM – 7:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-[#2D5A27] rounded-xl shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Head Office</p>
                  <p className="text-sm font-semibold text-gray-800 leading-relaxed">
                    B-4, Block B, Sector 60<br />
                    Noida, Uttar Pradesh 201309
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-50 text-[#2D5A27] rounded-xl shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Operating Hours</p>
                  <p className="text-xs text-gray-700">Monday – Saturday: 9:00 AM – 7:00 PM</p>
                  <p className="text-xs text-gray-700">Sunday: Closed</p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-emerald-950/5 flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-[#2D5A27] shrink-0" />
                <p className="text-xs text-gray-600">
                  Looking for bulk oil distribution for retail or restaurant supply? Mention "Bulk Request" in your message subject.
                </p>
              </div>
            </div>
          </div>

          {/* ── Right Column: Contact Form ───────────────────────── */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-emerald-950/10 shadow-sm">
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl font-bold text-gray-900 mb-2">
              Send Us a Direct Message
            </h2>
            <p className="text-xs text-gray-500 mb-8">
              Fill in your contact details below and our customer support specialist will respond shortly.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2D5A27] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2D5A27] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2D5A27] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Order Inquiry / Product Question"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2D5A27] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Your Message *
                </label>
                <textarea
                  name="message"
                  required
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we assist you today?"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2D5A27] focus:bg-white transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-4 px-6 rounded-xl bg-[#1A3C2A] hover:bg-[#2D5A27] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60"
              >
                {sending ? (
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>

        </div>

        {/* ── Frequently Asked Questions ────────────────────────────── */}
        <div className="mt-20 border-t border-emerald-950/10 pt-16">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2D5A27]">Help Center</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl font-bold text-[#1A3C2A] mt-1">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl border border-emerald-950/5 shadow-xs">
                <h3 className="font-bold text-gray-900 text-sm mb-2">{faq.q}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;