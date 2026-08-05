import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

const faqs = [
  {
    q: "What makes your mustard oil different?",
    a: "Our oil is cold-pressed using traditional wooden churns at ambient temperature, preserving natural nutrients and authentic taste without any solvents or chemicals.",
  },
  {
    q: "How long does delivery take?",
    a: "We deliver within 3–5 business days across India. Express delivery is available for metro cities within 1–2 days.",
  },
  {
    q: "Is your oil 100% pure?",
    a: "Yes. No additives, no chemicals, no artificial processing. Each batch is tested for purity, acidity, and free fatty acid content.",
  },
  {
    q: "How should I store the oil?",
    a: "Store in a cool, dry place away from direct sunlight. Properly stored oil maintains quality for up to 12 months.",
  },
  {
    q: "Do you offer bulk orders?",
    a: "Yes. We offer wholesale pricing for bulk orders. Contact us directly for custom pricing and delivery options.",
  },
  {
    q: "Are your products safe for cooking at high temperature?",
    a: "Mustard oil has a high smoke point (~480°F / 250°C), making it suitable for sautéing, stir-frying, and most Indian cooking methods.",
  },
];

const FloatInput = ({
  id, label, type = "text", name, value, onChange, required = false,
}: {
  id: string; label: string; type?: string; name: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean;
}) => (
  <div className="float-field">
    <input
      id={id}
      name={name}
      type={type}
      required={required}
      value={value}
      onChange={onChange}
      placeholder=" "
      autoComplete="off"
    />
    <label htmlFor={id}>{label}</label>
  </div>
);

const FloatTextarea = ({
  id, label, name, value, onChange, rows = 5, required = false,
}: {
  id: string; label: string; name: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number; required?: boolean;
}) => (
  <div className="float-field">
    <textarea
      id={id}
      name={name}
      rows={rows}
      required={required}
      value={value}
      onChange={onChange}
      placeholder=" "
      style={{ resize: "none" }}
    />
    <label htmlFor={id}>{label}</label>
  </div>
);

const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span
          className="text-foreground group-hover:text-primary transition-colors pr-8"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.05rem" }}
        >
          {q}
        </span>
        <span
          className="shrink-0 text-muted-foreground transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)", lineHeight: 1, fontSize: "1.2rem" }}
        >
          +
        </span>
      </button>
      <div className={`accordion-content ${open ? "open" : ""}`}>
        <p
          className="pb-5 text-muted-foreground text-sm leading-relaxed"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
        >
          {a}
        </p>
      </div>
    </div>
  );
};

const Contact = () => {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((res) => setTimeout(res, 600));
    setSending(false);
    toast({ title: "Message sent.", description: "We'll get back to you within 24 hours." });
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background page-enter pt-24">

      {/* ── Header ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-10 border-b border-border">
        <p
          className="text-xs uppercase tracking-[0.18em] text-primary mb-3"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Contact
        </p>
        <h1
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
          className="text-foreground"
        >
          Get in touch
        </h1>
        <p
          className="mt-4 text-muted-foreground max-w-lg"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
        >
          Questions about our products, wholesale orders, or anything else — we're happy to help.
        </p>
      </div>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-5 gap-16">

        {/* Contact info */}
        <div className="lg:col-span-2 space-y-10">
          <div>
            <h3
              className="text-xs uppercase tracking-widest text-foreground/40 mb-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Email
            </h3>
            <a
              href="mailto:care@myfarmik.com"
              className="text-foreground hover:text-primary transition-colors"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}
            >
              care@myfarmik.com
            </a>
          </div>
          <div>
            <h3
              className="text-xs uppercase tracking-widest text-foreground/40 mb-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Phone
            </h3>
            <a
              href="tel:+919876543210"
              className="text-foreground hover:text-primary transition-colors"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}
            >
              +91 98765 43210
            </a>
            <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>
              Mon–Sat, 9:00 AM – 7:00 PM
            </p>
          </div>
          <div>
            <h3
              className="text-xs uppercase tracking-widest text-foreground/40 mb-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Address
            </h3>
            <p
              className="text-foreground leading-relaxed"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.05rem" }}
            >
              123 Traditional Oil Mill<br />
              Mustard Fields, Punjab<br />
              India – 140001
            </p>
          </div>
          <div>
            <h3
              className="text-xs uppercase tracking-widest text-foreground/40 mb-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Hours
            </h3>
            <div
              className="space-y-1 text-sm text-muted-foreground"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
            >
              <p>Monday – Friday: 9:00 AM – 7:00 PM</p>
              <p>Saturday: 10:00 AM – 5:00 PM</p>
              <p>Sunday: Closed</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-3">
          <h2
            className="text-foreground mb-10"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.6rem" }}
          >
            Send a message
          </h2>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <FloatInput id="name" label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
              <FloatInput id="email" label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <FloatInput id="phone" label="Phone Number" type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              <FloatInput id="subject" label="Subject" name="subject" value={formData.subject} onChange={handleChange} required />
            </div>
            <FloatTextarea id="message" label="Message" name="message" value={formData.message} onChange={handleChange} rows={5} required />

            <button type="submit" disabled={sending} className="btn-primary disabled:opacity-60">
              {sending ? (
                <span className="inline-block h-4 w-4 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {sending ? "Sending…" : "Send Message"}
            </button>
          </form>
        </div>
      </div>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
          <div className="max-w-xl mb-12">
            <p
              className="text-xs uppercase tracking-[0.18em] text-primary mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              FAQ
            </p>
            <h2
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
              className="text-foreground"
            >
              Common questions
            </h2>
          </div>
          <div className="max-w-3xl border-t border-border">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;