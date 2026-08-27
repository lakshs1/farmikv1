import { useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import logoFarmik from "@/assets/logo-farmik.png";

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const TOTAL_FRAMES = 240;
const SCROLL_HEIGHT_VH = 950; // Total scroll container height in vh units

const ALLOWED_ADMINS = [
  "annupusa01@gmail.com",
  "annu_pusa@yahoo.co.in",
  "lakshyaj8779@gmail.com",
];

/* ═══════════════════════════════════════════════════════════════
   PURE HELPERS (no React, no side effects)
   ═══════════════════════════════════════════════════════════════ */

const clamp = (v: number, min: number, max: number) =>
  v < min ? min : v > max ? max : v;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Calculate overlay opacity + translateY for a given scroll‑progress window with a stable reading plateau */
const getBeatStyle = (
  progress: number,
  start: number,
  end: number
): { opacity: number; y: number } => {
  if (progress < start) return { opacity: 0, y: 40 };
  if (progress > end) return { opacity: 0, y: -40 };

  const range = end - start;
  const fadeInEnd = start + range * 0.3; // 30% of range is fade in
  const fadeOutStart = start + range * 0.7; // 40% is plateau, last 30% is fade out

  if (progress < fadeInEnd) {
    const t = (progress - start) / (fadeInEnd - start);
    return { opacity: t, y: 40 * (1 - t) };
  } else if (progress > fadeOutStart) {
    const t = (end - progress) / (end - fadeOutStart);
    return { opacity: t, y: -40 * (1 - t) };
  } else {
    return { opacity: 1, y: 0 };
  }
};

/** Draw an image onto a canvas with "object-fit: cover" behaviour */
const drawCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number
) => {
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const dx = (cw - img.naturalWidth * scale) / 2;
  const dy = (ch - img.naturalHeight * scale) / 2;
  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, img.naturalWidth * scale, img.naturalHeight * scale);
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

const About = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /* ── Refs ─────────────────────────────────────────────────── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  const beat1Ref = useRef<HTMLDivElement>(null);
  const beat2Ref = useRef<HTMLDivElement>(null);
  const beat3Ref = useRef<HTMLDivElement>(null);
  const beat4Ref = useRef<HTMLDivElement>(null);
  const beat5Ref = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const preloaderRef = useRef<HTMLDivElement>(null);
  const preloaderBarRef = useRef<HTMLDivElement>(null);
  const preloaderTextRef = useRef<HTMLParagraphElement>(null);

  // Mutable animation state – never triggers re‑renders
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const targetFrame = useRef(0);
  const currentFrame = useRef(0);
  const lastDrawnFrame = useRef(-1);
  const canvasW = useRef(0);
  const canvasH = useRef(0);
  const isReadyRef = useRef(false);
  const containerHeightRef = useRef(0);

  /* ── Admin shortcut ──────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const adminSession = localStorage.getItem("adminSession");
        const email =
          user?.email?.toLowerCase().trim() ||
          (adminSession
            ? JSON.parse(adminSession).email?.toLowerCase().trim()
            : null);
        navigate(
          email && ALLOWED_ADMINS.includes(email)
            ? "/admin/dashboard"
            : "/admin/login"
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [user, navigate]);

  /* ── Canvas sizing (DPR‑aware) ───────────────────────────── */
  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvasW.current = canvas.width;
    canvasH.current = canvas.height;
    if (!ctxRef.current) {
      ctxRef.current = canvas.getContext("2d", { alpha: false });
    }
    lastDrawnFrame.current = -1;
  }, []);

  useEffect(() => {
    requestAnimationFrame(sizeCanvas);
    window.addEventListener("resize", sizeCanvas);
    return () => window.removeEventListener("resize", sizeCanvas);
  }, [sizeCanvas]);

  /* ── Image preloading (batched, zero React re‑renders) ──── */
  useEffect(() => {
    let cancelled = false;
    const images: HTMLImageElement[] = [];
    let loaded = 0;

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      images.push(new Image());
    }
    imagesRef.current = images;

    const priority: number[] = [];
    for (let i = 0; i < 20; i++) priority.push(i);
    for (let i = 20; i < TOTAL_FRAMES; i += 10) priority.push(i);
    const prioritySet = new Set(priority);

    const onImageReady = () => {
      if (cancelled) return;
      loaded++;

      const pct = Math.round((loaded / TOTAL_FRAMES) * 100);
      if (preloaderBarRef.current) {
        preloaderBarRef.current.style.width = `${pct}%`;
      }
      if (preloaderTextRef.current) {
        preloaderTextRef.current.textContent = `Loading experience... ${pct}%`;
      }

      if (!isReadyRef.current) {
        const allPriorityReady = Array.from(prioritySet).every(
          (idx) => images[idx]?.complete && images[idx]?.naturalWidth > 0
        );
        if (allPriorityReady) {
          isReadyRef.current = true;
          if (preloaderRef.current) {
            preloaderRef.current.style.opacity = "0";
            preloaderRef.current.style.pointerEvents = "none";
          }
          lastDrawnFrame.current = -1;
        }
      }
    };

    const loadFrame = (idx: number) => {
      const img = images[idx];
      img.onload = onImageReady;
      img.onerror = onImageReady;
      img.src = `/frames/ezgif-frame-${String(idx + 1).padStart(3, "0")}.jpg`;
    };

    priority.forEach(loadFrame);

    requestAnimationFrame(() => {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        if (!prioritySet.has(i)) loadFrame(i);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Scroll → target frame (passive, zero re‑renders) ───── */
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        containerHeightRef.current = containerRef.current.scrollHeight;
      }
    };
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const scrollHeight = containerHeightRef.current - window.innerHeight;
      
      const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, scrollTop / scrollHeight)) : 0;
      
      targetFrame.current = progress * (TOTAL_FRAMES - 1);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── rAF animation loop ──────────────────────────────────── */
  useEffect(() => {
    let rafId: number;

    const tick = () => {
      const frameDiff = targetFrame.current - currentFrame.current;
      if (Math.abs(frameDiff) > 0.05) {
        currentFrame.current = lerp(currentFrame.current, targetFrame.current, 0.04);
      } else {
        currentFrame.current = targetFrame.current;
      }

      const frameIdx = clamp(Math.round(currentFrame.current), 0, TOTAL_FRAMES - 1);

      let drawIdx = frameIdx;
      if (
        !imagesRef.current[drawIdx] ||
        !imagesRef.current[drawIdx].complete ||
        imagesRef.current[drawIdx].naturalWidth === 0
      ) {
        for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
          const lo = frameIdx - offset;
          const hi = frameIdx + offset;
          if (
            lo >= 0 &&
            imagesRef.current[lo]?.complete &&
            imagesRef.current[lo].naturalWidth > 0
          ) {
            drawIdx = lo;
            break;
          }
          if (
            hi < TOTAL_FRAMES &&
            imagesRef.current[hi]?.complete &&
            imagesRef.current[hi].naturalWidth > 0
          ) {
            drawIdx = hi;
            break;
          }
        }
      }

      const ctx = ctxRef.current;
      if (
        ctx &&
        drawIdx !== lastDrawnFrame.current &&
        imagesRef.current[drawIdx]?.complete &&
        imagesRef.current[drawIdx].naturalWidth > 0 &&
        canvasW.current > 0
      ) {
        drawCover(ctx, imagesRef.current[drawIdx], canvasW.current, canvasH.current);
        lastDrawnFrame.current = drawIdx;
      }

      const progress = clamp(currentFrame.current / (TOTAL_FRAMES - 1), 0, 1);

      const beats: { ref: React.RefObject<HTMLDivElement | null>; s: number; e: number }[] = [
        { ref: beat1Ref, s: 0, e: 0.15 },
        { ref: beat2Ref, s: 0.15, e: 0.40 },
        { ref: beat3Ref, s: 0.40, e: 0.65 },
        { ref: beat4Ref, s: 0.65, e: 0.85 },
        { ref: beat5Ref, s: 0.85, e: 1.0 },
      ];

      for (const b of beats) {
        const el = b.ref.current;
        if (!el) continue;
        const { opacity, y } = getBeatStyle(progress, b.s, b.e);
        el.style.opacity = String(opacity);
        el.style.transform = `translateY(${y}px)`;
        el.style.pointerEvents = opacity > 0.05 ? "auto" : "none";
      }

      if (indicatorRef.current) {
        const vis = clamp(1 - progress * 10, 0, 1);
        indicatorRef.current.style.opacity = String(vis);
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const scrollToBeat = (pct: number) => {
    const total = containerHeightRef.current - window.innerHeight;
    window.scrollTo({ top: total * pct, behavior: "smooth" });
  };

  return (
    <div
      className="bg-[#0B0A08] text-white overflow-x-hidden min-h-screen relative"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Preloader ─────────────────────────────────────────── */}
      <div
        ref={preloaderRef}
        className="fixed inset-0 z-[60] bg-[#0B0A08] flex flex-col items-center justify-center transition-opacity duration-1000"
      >
        <div className="text-center space-y-4 max-w-xs">
          <img
            src={logoFarmik}
            alt="FARMIK"
            className="h-16 w-auto mx-auto animate-pulse"
          />
          <h2 className="text-sm uppercase tracking-[0.25em] text-white/90">
            FARMIK
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-[#C89B3C] font-semibold">
            Pure Cold-Pressed Journey
          </p>
          <div className="w-48 h-[2px] bg-white/10 mx-auto relative overflow-hidden rounded-full mt-2">
            <div
              ref={preloaderBarRef}
              className="absolute left-0 top-0 h-full bg-[#C89B3C] transition-[width] duration-150"
              style={{ width: "0%" }}
            />
          </div>
          <p
            ref={preloaderTextRef}
            className="text-[9px] text-white/40 font-mono"
          >
            Loading experience... 0%
          </p>
        </div>
      </div>

      {/* ── Fixed Viewport (Canvas & ALL Overlays) ──────────────────── */}
      <div className="fixed inset-0 w-full h-screen overflow-hidden bg-[#0B0A08] z-10 pointer-events-none">
        {/* Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0) 25%, rgba(11,10,8,0.82) 90%)",
          }}
        />

        {/* ── Beat 1: Introduction  0%–15% ───────────────────── */}
        <div
          ref={beat1Ref}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20 pointer-events-none"
          style={{ willChange: "opacity, transform" }}
        >
          <div className="bg-black/40 backdrop-blur-md px-8 py-10 rounded-2xl border border-white/10 shadow-2xl max-w-xl text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C89B3C] font-semibold mb-3">
              Pure Traditional Cold Press
            </p>
            <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-6 uppercase">
              FARMIK
            </h1>
            <p className="text-lg md:text-xl font-light text-white/70 max-w-md italic mb-4">
              Nature, pressed with purpose.
            </p>
            <p className="text-xs md:text-sm text-white/50 leading-relaxed">
              Cold-pressed from carefully selected seeds, filtered with care, and
              bottled at its purest.
            </p>
          </div>
        </div>

        {/* ── Beat 2: Cold Press  15%–40% ────────────────────── */}
        <div
          ref={beat2Ref}
          className="absolute inset-0 flex flex-col justify-center text-left px-8 md:px-24 z-20 pointer-events-none"
          style={{ opacity: 0, willChange: "opacity, transform" }}
        >
          <div className="max-w-xl bg-black/40 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A3E0A3] font-semibold mb-3">
              The Extraction
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 uppercase">
              Pressed, not processed.
            </h2>
            <p className="text-sm md:text-base text-white/65 leading-relaxed mb-4">
              Carefully selected seeds are slowly cold-pressed to release their
              natural oils while preserving their character, enzymes, and
              nutrients.
            </p>
            <p className="text-xs text-[#C89B3C] font-medium uppercase tracking-wider">
              No unnecessary heat. No shortcuts.
            </p>
          </div>
        </div>

        {/* ── Beat 3: Filtration  40%–65% ────────────────────── */}
        <div
          ref={beat3Ref}
          className="absolute inset-0 flex flex-col justify-center items-end text-right px-8 md:px-24 z-20 pointer-events-none"
          style={{ opacity: 0, willChange: "opacity, transform" }}
        >
          <div className="max-w-xl bg-black/40 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl text-right">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C89B3C] font-semibold mb-3">
              Pure Clarification
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 uppercase">
              Filtered with care.
            </h2>
            <p className="text-sm md:text-base text-white/65 leading-relaxed mb-4">
              Careful filtration removes suspended particles while preserving
              the oil's natural character, aroma, sharp taste, and golden color.
            </p>
            <p className="text-xs text-[#A3E0A3] font-medium uppercase tracking-wider">
              Clean process. Honest oil.
            </p>
          </div>
        </div>

        {/* ── Beat 4: Bottling  65%–85% ─────────────────────── */}
        <div
          ref={beat4Ref}
          className="absolute inset-0 flex flex-col justify-center text-left px-8 md:px-24 z-20 pointer-events-none"
          style={{ opacity: 0, willChange: "opacity, transform" }}
        >
          <div className="max-w-xl bg-black/40 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/10 shadow-2xl text-left">
            <p className="text-xs uppercase tracking-[0.25em] text-[#A3E0A3] font-semibold mb-3">
              Precise Packaging
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 uppercase">
              From press to bottle.
            </h2>
            <p className="text-sm md:text-base text-white/65 leading-relaxed mb-4">
              Every bottle is filled, sealed, and prepared in a highly hygienic
              facility with the same attention given to the oil extraction itself.
            </p>
            <p className="text-xs text-[#C89B3C] font-medium uppercase tracking-wider">
              Made carefully. Bottled honestly.
            </p>
          </div>
        </div>

        {/* ── Beat 5: Reveal  85%–100% ──────────────────────── */}
        <div
          ref={beat5Ref}
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-20 pointer-events-none"
          style={{ opacity: 0, willChange: "opacity, transform" }}
        >
          <div className="bg-black/40 backdrop-blur-md px-8 py-12 rounded-3xl border border-white/10 shadow-2xl max-w-xl text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-[#C89B3C] font-semibold mb-3">
              Your Premium Choice
            </p>
            <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-white mb-4 uppercase">
              Purely made.
              <br />
              Naturally yours.
            </h2>
            <p className="text-sm md:text-base text-white/65 mb-8">
              Cold-pressed oils made with care, from seed to bottle. Bring health
              back to your kitchen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pointer-events-auto">
              <Link
                to="/products"
                className="px-8 py-3 bg-[#C89B3C] text-black font-semibold text-xs tracking-widest uppercase hover:bg-[#E6C56A] transition-colors rounded-full shadow-lg"
              >
                Explore Our Oils
              </Link>
              <button
                onClick={() => scrollToBeat(0)}
                className="px-8 py-3 border border-white/20 text-white font-semibold text-xs tracking-widest uppercase hover:bg-white/10 transition-all rounded-full"
              >
                Our Process
              </button>
            </div>
            <p className="text-[10px] text-white/35 mt-8 tracking-wider">
              Know what goes into every drop.
            </p>
          </div>
        </div>

        <div
          ref={indicatorRef}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-30"
          style={{ willChange: "opacity" }}
        >
          <span className="text-[11px] tracking-[0.22em] text-white/60 uppercase font-bold animate-pulse">
            Scroll to discover
          </span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-[#C89B3C] animate-bounce" />
          </div>
        </div>
      </div>

      {/* ── Scrollytelling Scroll Spacer ──────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full pointer-events-none z-20"
        style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
      />
    </div>
  );
};

export default About;