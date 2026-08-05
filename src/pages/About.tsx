import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import farmikLogo from "@/assets/farmik-oils-logo.png";
import mustardOilProduct from "@/assets/mustard-oil-product.jpg";
import farmikProducts from "@/assets/farmik-products.jpg";

function useReveal(rootMargin = "0px 0px -80px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("is-visible"); obs.unobserve(el); } },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const timeline = [
  { n: "01", title: "Seed Selection", desc: "Sourcing from trusted farmers who grow without pesticides across Punjab and Rajasthan." },
  { n: "02", title: "Washing & Drying", desc: "Seeds are cleaned and sun-dried before pressing. No artificial drying or pre-treatment." },
  { n: "03", title: "Cold Pressing", desc: "Slow mechanical pressing at ambient temperature. No external heat. No hexane." },
  { n: "04", title: "Gravity Filtration", desc: "Oil is filtered by gravity over 24–48 hours through natural cloth. No centrifuge." },
  { n: "05", title: "Batch Testing", desc: "Purity, acidity, and free fatty acid content tested in every batch before dispatch." },
  { n: "06", title: "Bottling", desc: "Filled into dark glass or food-grade HDPE bottles to protect from light degradation." },
];

const values = [
  { title: "Honest Extraction", desc: "No hexane. No bleach. No deodoriser. What comes out of the press is what goes into the bottle." },
  { title: "Farmer Partnerships", desc: "We work directly with small farmers. No middlemen, fair prices, long-term relationships." },
  { title: "Traceability", desc: "We know which farm every batch came from. You can ask — we'll tell you." },
  { title: "Slow & Deliberate", desc: "We press in small batches. We don't rush. Quality over volume, every time." },
];

const About = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const valuesRef = useReveal();
  const timelineRef = useReveal();
  const storyRef = useReveal();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const allowedEmails = ["annupusa01@gmail.com", "annu_pusa@yahoo.co.in", "lakshyaj8779@gmail.com"];
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        if (user?.email && allowedEmails.includes(user.email.toLowerCase().trim())) {
          navigate("/admin/login");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background page-enter pt-24">

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <p
              className="text-xs uppercase tracking-[0.18em] text-primary mb-4"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              About Farmik
            </p>
            <h1
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
              className="text-foreground mb-8"
            >
              Preserving tradition,<br />
              <em>one press at a time.</em>
            </h1>
            <p
              className="text-muted-foreground leading-relaxed text-lg"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
            >
              Farmik began with a simple conviction: that the best mustard oil is the least processed mustard oil.
              We set out to bring back the kind of oil your grandparents knew — pressed slowly, without shortcuts.
            </p>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden">
            <img
              src={farmikProducts}
              alt="Farmik Oils production"
              className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-700"
            />
          </div>
        </div>
      </section>

      {/* ── Story ─────────────────────────────────────────── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div ref={storyRef} className="reveal grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-[4/5] overflow-hidden lg:order-1 order-2">
              <img
                src={mustardOilProduct}
                alt="Traditional cold-press process"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:order-2 order-1">
              <p
                className="text-xs uppercase tracking-[0.18em] text-primary mb-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Our Story
              </p>
              <h2
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
                className="text-foreground mb-8"
              >
                Started in Punjab.<br />
                <em>Grown from conviction.</em>
              </h2>
              <div
                className="space-y-4 text-muted-foreground leading-relaxed"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
              >
                <p>
                  Founded with a vision to preserve traditional oil extraction methods, Farmik began as a small
                  family operation in the heart of Punjab's mustard fields. Our founders saw that modern processing
                  was stripping away the very things that made mustard oil worth using.
                </p>
                <p>
                  Today, we continue this legacy using time-honored cold-press techniques passed down through
                  generations. Our wooden churns and traditional stone mills ensure every drop of oil retains
                  its natural nutrients, authentic flavour, and health benefits.
                </p>
                <p>
                  We believe the best products come from respecting both nature and tradition. We source only
                  the finest mustard seeds and extract oil at temperatures that preserve its natural properties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process timeline ──────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p
              className="text-xs uppercase tracking-[0.18em] text-primary mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              The Method
            </p>
            <h2
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
              className="text-foreground"
            >
              Cold-press, step by step
            </h2>
          </div>

          <div ref={timelineRef} className="reveal-children space-y-0 divide-y divide-border">
            {timeline.map((step) => (
              <div
                key={step.n}
                className="grid grid-cols-[60px_1fr] md:grid-cols-[80px_200px_1fr] items-start gap-6 py-8 group cursor-default"
              >
                <span
                  className="text-primary/30 group-hover:text-primary transition-colors duration-300"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1.8rem" }}
                >
                  {step.n}
                </span>
                <h3
                  className="text-foreground"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.1rem" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-muted-foreground text-sm leading-relaxed md:col-start-3"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-16">
            <p
              className="text-xs uppercase tracking-[0.18em] text-primary mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              What We Stand For
            </p>
            <h2
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
              className="text-foreground"
            >
              Our commitments
            </h2>
          </div>

          <div ref={valuesRef} className="reveal-children grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {values.map((v) => (
              <div key={v.title} className="bg-card p-8 hover:bg-background transition-colors duration-300">
                <div className="w-8 h-px bg-primary mb-6" />
                <h3
                  className="text-foreground mb-3"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.1rem" }}
                >
                  {v.title}
                </h3>
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                >
                  {v.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quality promise ───────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <div className="w-8 h-px bg-primary mx-auto mb-8" />
          <h2
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
            className="text-foreground mb-8"
          >
            <em>"We don't rush the press.<br />The oil takes the time it needs."</em>
          </h2>
          <p
            className="text-muted-foreground leading-relaxed"
            style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
          >
            Every bottle of Farmik Oils undergoes purity testing before it leaves our facility.
            We stand behind each batch with full traceability — from the farm where the seeds
            were grown to the bottle in your kitchen.
          </p>
        </div>
      </section>
    </div>
  );
};

export default About;