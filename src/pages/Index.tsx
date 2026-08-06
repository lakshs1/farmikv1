import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import farmikProducts from "@/assets/farmik-products.jpg";

/* ─── Scroll reveal hook ─────────────────────────────────────── */
function useScrollReveal(rootMargin = "0px 0px -80px 0px") {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          obs.unobserve(el);
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return ref;
}

/* ─── Process step ───────────────────────────────────────────── */
const steps = [
  { n: "01", title: "Seed Selection", desc: "Hand-picked premium mustard seeds from organic farms across Punjab." },
  { n: "02", title: "Cold Pressing", desc: "Traditional wooden gharats crush seeds slowly at ambient temperature." },
  { n: "03", title: "Natural Filtration", desc: "Gravity filtration only — no bleaching, no deodorising agents." },
  { n: "04", title: "Batch Testing", desc: "Every batch checked for purity, acidity, and nutritional integrity." },
];

const benefits = [
  { title: "Rich in Omega-3 & Omega-6", desc: "A balanced fatty acid profile that supports cardiovascular health." },
  { title: "Natural Antibacterial", desc: "Allyl isothiocyanate — mustard's natural compound — inhibits microbial growth." },
  { title: "Vitamin E & Antioxidants", desc: "Preserves cells, supports skin, and slows oxidation in cooking." },
  { title: "No Chemicals, Ever", desc: "Zero hexane, zero bleach, zero deodoriser. Just pressed seed and gravity." },
];

const testimonials = [
  { name: "Priya Sharma", location: "Delhi", text: "The taste is exactly how I remember my grandmother's kitchen. Honest, sharp, real." },
  { name: "Rajesh Kumar", location: "Mumbai", text: "You can tell the difference the moment you open the bottle. This is proper kachi ghani." },
  { name: "Anita Singh", location: "Pune", text: "Switched from a supermarket brand two years ago. Haven't looked back since." },
];

/* ─── Index component ────────────────────────────────────────── */
const Index = () => {
  const heroRef = useRef<HTMLImageElement>(null);
  const stepsRef = useScrollReveal();
  const benefitsRef = useScrollReveal();
  const testimonialsRef = useScrollReveal();
  const ctaRef = useScrollReveal();

  // Parallax on hero image
  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        heroRef.current.style.transform = `translateY(${window.scrollY * 0.18}px)`;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen page-enter">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image with parallax */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            ref={heroRef}
            src={farmikProducts}
            alt="Farmik Oils — traditional cold press"
            className="absolute inset-0 w-full h-[120%] object-cover"
            style={{ top: "-10%", willChange: "transform" }}
          />
          {/* Warm overlay */}
          <div className="absolute inset-0 bg-background/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-24 pb-16">
          <div className="max-w-2xl">
            <p
              className="text-xs uppercase tracking-[0.18em] text-primary mb-6"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Cold-Pressed · Traditional · Pure
            </p>
            <h1
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
              className="text-foreground mb-8"
            >
              Mustard Oil,<br />
              <em>the way it's meant to be.</em>
            </h1>
            <p
              className="text-muted-foreground text-lg leading-relaxed max-w-lg mb-10"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
            >
              Extracted without heat or chemicals using century-old wooden press methods.
              The nutrients stay. The flavour stays. Nothing is lost.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/products">
                <button className="btn-primary">
                  Shop Now
                </button>
              </Link>
              <Link to="/about">
                <button className="btn-minimal">
                  Our Story
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          <span
            className="text-xs tracking-widest text-muted-foreground uppercase"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Scroll
          </span>
          <div className="w-px h-10 bg-border animate-pulse" />
        </div>
      </section>

      {/* ── Process strip ─────────────────────────────────────── */}
      <section className="py-24 border-y border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.18em] text-primary mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              The Process
            </p>
            <h2
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
              className="text-foreground"
            >
              From field to bottle
            </h2>
          </div>

          <div ref={stepsRef} className="reveal-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.n} className="group">
                <p
                  className="text-4xl text-primary/20 mb-4 transition-colors duration-300 group-hover:text-primary/50"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
                >
                  {step.n}
                </p>
                <div className="w-8 h-px bg-border mb-4 transition-all duration-300 group-hover:w-16 group-hover:bg-primary" />
                <h3
                  className="mb-2 text-foreground"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "1.1rem" }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Farmik ────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p
                className="text-xs uppercase tracking-[0.18em] text-primary mb-4"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Why It Matters
              </p>
              <h2
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
                className="text-foreground mb-6"
              >
                What stays in the oil<br />
                <em>depends on how you press it.</em>
              </h2>
              <p
                className="text-muted-foreground leading-relaxed mb-8"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
              >
                Industrial refining uses hexane solvents and high heat — stripping out colour, smell,
                and most of the beneficial compounds. Our cold-press method uses slow mechanical pressure
                at ambient temperatures. Nothing is removed except the husk.
              </p>
              <Link to="/about">
                <button className="btn-minimal text-xs">
                  Read the Full Story
                </button>
              </Link>
            </div>

            <div ref={benefitsRef} className="reveal-children grid grid-cols-1 sm:grid-cols-2 gap-px bg-border">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className="bg-background p-6 group hover:bg-card transition-colors duration-300"
                >
                  <h3
                    className="text-foreground mb-2"
                    style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: "1.05rem" }}
                  >
                    {b.title}
                  </h3>
                  <p
                    className="text-xs text-muted-foreground leading-relaxed"
                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                  >
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Product image break ────────────────────────────────── */}
      <section className="py-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative aspect-[16/6] overflow-hidden">
            <img
              src={farmikProducts}
              alt="Farmik cold-pressed mustard oil"
              className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-foreground/10" />
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p
              className="text-xs uppercase tracking-[0.18em] text-primary mb-3"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Reviews
            </p>
            <h2
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
              className="text-foreground"
            >
              What customers say
            </h2>
          </div>

          <div ref={testimonialsRef} className="reveal-children grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-card p-8 hover:bg-background transition-colors duration-300">
                <p
                  className="text-foreground leading-relaxed mb-8 italic"
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: "1.1rem" }}
                >
                  "{t.text}"
                </p>
                <div>
                  <p
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {t.name}
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-1"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {t.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA band ─────────────────────────────────────────── */}
      <section ref={ctaRef} className="reveal py-32 text-center">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <p
            className="text-xs uppercase tracking-[0.18em] text-primary mb-4"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Pure. Traditional. Farmik.
          </p>
          <h2
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
            className="text-foreground mb-8"
          >
            Bring honest oil<br />
            <em>back to your kitchen.</em>
          </h2>
          <Link to="/products">
            <button className="btn-primary">
              Explore Products
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
