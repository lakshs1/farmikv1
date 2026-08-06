import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Award, Heart, CheckCircle2, ArrowRight } from "lucide-react";
import farmikLogo from "@/assets/farmik-oils-logo.png";

const timeline = [
  { n: "01", title: "Direct Seed Sourcing", desc: "Sourcing certified non-GMO mustard and oilseeds directly from organic farmers." },
  { n: "02", title: "Sun Cleaning & Drying", desc: "Seeds are cleaned and sun-dried to optimal moisture without chemical treatment." },
  { n: "03", title: "Wooden Churn Cold Press", desc: "Slow mechanical extraction below 45°C using age-old wooden churners (Kachi Ghani)." },
  { n: "04", title: "Cloth Gravity Filtration", desc: "Natural 48-hour gravity settling through unbleached cotton cloth. No chemical centrifuge." },
  { n: "05", title: "Laboratory Quality Testing", desc: "Purity, acidity, and fatty acid profile tested for every batch before packaging." },
  { n: "06", title: "Eco Glass & Canister Bottling", desc: "Sealed in protective containers to prevent light degradation and retain peak freshness." },
];

const values = [
  { title: "Honest Extraction", desc: "No hexane, no chemical solvents, no bleach, no artificial deodorizers. Pure oil straight from the press." },
  { title: "Farmer Fair Trade", desc: "Direct partnerships with local farming families, eliminating middleman exploitation with fair pricing." },
  { title: "Full Batch Traceability", desc: "Complete transparency for every bottle back to the specific farm region and press date." },
  { title: "Slow & Deliberate", desc: "We press in small batches with patience. Quality over volume, preserving natural health benefits." },
];

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-gray-800 pt-24 pb-20">
      
      {/* ── Hero Section ───────────────────────────────────────── */}
      <section className="relative bg-[#1A3C2A] text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden mb-16">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-6">
            <img src={farmikLogo} alt="myfarmik" className="h-5 w-auto text-emerald-300" />
            <span>The myfarmik Story</span>
          </div>

          <h1
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-tight"
          >
            Preserving Purity & Tradition,<br />
            <span className="italic text-emerald-300 font-normal">From Our Farm to Your Kitchen.</span>
          </h1>

          <p className="text-emerald-100/90 text-base sm:text-lg max-w-3xl mx-auto font-light leading-relaxed mb-8">
            <strong className="font-semibold text-white">myfarmik</strong> was born with a single conviction: that true nutrition comes from unprocessed, honest food. We bring back the authentic cold-pressed mustard oil your ancestors relied on — pressed slowly without shortcuts.
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-[#1A3C2A] font-bold text-xs uppercase tracking-wider hover:bg-emerald-100 transition-all shadow-md"
          >
            <span>Explore Our Oil Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Mission & Vision ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2D5A27]">Our Roots</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl sm:text-4xl font-bold text-[#1A3C2A] leading-snug">
              Reclaiming the True Taste of Traditional Cold-Pressed Oils
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Modern industrial oil refining uses high-heat distillation and chemical solvents like hexane to extract maximum oil volume, destroying natural vitamins and aromatic pungency in the process.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              At <strong className="text-gray-900">myfarmik</strong>, we reject chemical shortcuts. Using traditional wooden churns (Kachi Ghani), our oil is pressed gently at low temperatures. The result is pure, nutrient-rich oil loaded with natural Omega-3 fatty acids, vitamin E, and robust flavor.
            </p>

            <div className="pt-4 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-emerald-950/10 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-[#2D5A27] shrink-0" />
                <span className="text-xs font-semibold text-gray-800">100% Kachi Ghani</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-emerald-950/10 shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-[#2D5A27] shrink-0" />
                <span className="text-xs font-semibold text-gray-800">Zero Heat Extraction</span>
              </div>
            </div>
          </div>

          <div className="relative bg-white p-8 rounded-3xl border border-emerald-950/10 shadow-lg text-center space-y-6">
            <img src={farmikLogo} alt="myfarmik emblem" className="h-20 w-auto mx-auto text-[#2D5A27]" />
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-bold text-gray-900">
              "Purity is not a feature — it's our promise."
            </h3>
            <p className="text-xs text-gray-600 italic">
              "We press in small batches with patience. Every drop delivered to your home represents our dedication to your family's health."
            </p>
            <div className="border-t border-gray-100 pt-4 flex justify-center items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-700" /> Lab Certified</span>
              <span className="flex items-center gap-1"><Award className="w-4 h-4 text-emerald-700" /> 100% Organic</span>
              <span className="flex items-center gap-1"><Heart className="w-4 h-4 text-emerald-700" /> Heart Healthy</span>
            </div>
          </div>

        </div>
      </section>

      {/* ── Process Steps ──────────────────────────────────────── */}
      <section className="bg-white py-20 border-y border-emerald-950/10 my-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2D5A27]">Step by Step</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl sm:text-4xl font-bold text-[#1A3C2A] mt-2">
              The myfarmik Extraction Method
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {timeline.map((item) => (
              <div key={item.n} className="bg-[#FAF9F5] p-6 rounded-2xl border border-emerald-950/5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                <span style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl font-bold text-emerald-800/20 group-hover:text-emerald-800/40 transition-colors">
                  {item.n}
                </span>
                <h3 className="font-bold text-gray-900 text-base mt-2 mb-2">{item.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Values ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#2D5A27]">Our Philosophy</span>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl sm:text-4xl font-bold text-[#1A3C2A] mt-2">
            What We Stand For
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map((v) => (
            <div key={v.title} className="bg-white p-8 rounded-2xl border border-emerald-950/10 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-8 h-1 bg-[#2D5A27] rounded-full mb-4" />
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-xl font-bold text-gray-900 mb-2">
                {v.title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default About;