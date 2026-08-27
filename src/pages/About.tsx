import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import logoFarmik from "@/assets/logo-farmik.png";

const TOTAL_FRAMES = 240;

const ALLOWED_ADMINS = [
  "annupusa01@gmail.com",
  "annu_pusa@yahoo.co.in",
  "lakshyaj8779@gmail.com",
];

// Linear interpolation utility
const lerp = (start: number, end: number, amt: number) => {
  return (1 - amt) * start + amt * end;
};

// Calculate opacity and Y offset based on percentage range
const getBeatStyle = (progress: number, start: number, end: number) => {
  const range = end - start;
  const mid = start + range / 2;
  let opacity = 0;
  let y = 30; // Slide up amount

  if (progress >= start && progress <= end) {
    if (progress < mid) {
      // Fading in
      const t = (progress - start) / (mid - start);
      opacity = t;
      y = 30 * (1 - t);
    } else {
      // Fading out
      const t = (end - progress) / (end - mid);
      opacity = t;
      y = -30 * (1 - t); // Slide up and out
    }
  } else if (progress > end) {
    opacity = 0;
    y = -30;
  } else {
    opacity = 0;
    y = 30;
  }

  return {
    opacity,
    transform: `translateY(${y}px)`,
  };
};

const About = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // Image refs
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [loadedCount, setLoadedCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // E-commerce states
  const { user } = useAuth();
  const { items } = useCart();
  const cartItemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Story Beat container refs for DOM modification (prevents React render lag)
  const beat1Ref = useRef<HTMLDivElement>(null);
  const beat2Ref = useRef<HTMLDivElement>(null);
  const beat3Ref = useRef<HTMLDivElement>(null);
  const beat4Ref = useRef<HTMLDivElement>(null);
  const beat5Ref = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // Scroll tracking refs
  const scrollProgress = useRef(0);
  const interpolatedProgress = useRef(0);
  const targetFrame = useRef(0);
  const currentFrame = useRef(0);

  // Admin keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut Ctrl + Shift + A or Cmd + Shift + A to access Admin Panel
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        const adminSession = localStorage.getItem("adminSession");
        const sessionEmail = user?.email?.toLowerCase().trim() || 
                             (adminSession ? JSON.parse(adminSession).email?.toLowerCase().trim() : null);

        if (sessionEmail && ALLOWED_ADMINS.includes(sessionEmail)) {
          navigate("/admin/dashboard");
        } else {
          navigate("/admin/login");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [user, navigate]);

  // Image preloading logic
  useEffect(() => {
    let isMounted = true;
    const loadedImages: HTMLImageElement[] = [];
    let count = 0;

    // Create image objects
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(3, "0");
      img.src = `/frames/ezgif-frame-${frameNum}.jpg`;
      loadedImages.push(img);
    }

    imagesRef.current = loadedImages;

    // High priority frames (every 10th frame + first 15 frames)
    const priorityIndices = new Set<number>();
    for (let i = 0; i < 15; i++) priorityIndices.add(i);
    for (let i = 0; i < TOTAL_FRAMES; i += 10) priorityIndices.add(i);

    // Track loading progress
    loadedImages.forEach((img, idx) => {
      img.onload = () => {
        if (!isMounted) return;
        count++;
        setLoadedCount(count);

        // We can show the site as ready once the priority frames are loaded
        const priorityLoadedCount = Array.from(priorityIndices).filter(
          (index) => loadedImages[index]?.complete
        ).length;

        if (priorityLoadedCount === priorityIndices.size && !isReady) {
          setIsReady(true);
        }
      };
      img.onerror = () => {
        if (!isMounted) return;
        count++;
        setLoadedCount(count);
      };
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle canvas sizing and aspect ratio cover logic
  const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    const canvas = ctx.canvas;
    const wr = canvas.width / img.width;
    const hr = canvas.height / img.height;
    const ratio = Math.max(wr, hr);
    
    const x = (canvas.width - img.width * ratio) / 2;
    const y = (canvas.height - img.height * ratio) / 2;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      0, 0, img.width, img.height,
      x, y, img.width * ratio, img.height * ratio
    );
  };

  // Canvas size handler
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
  };

  // Resize listener
  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Track window scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scrollHeight = rect.height - window.innerHeight;
      const scrolledPast = -rect.top;
      
      // Calculate 0 to 1 progress
      const rawProgress = scrolledPast / scrollHeight;
      const progress = Math.min(1, Math.max(0, rawProgress));
      
      scrollProgress.current = progress;
      targetFrame.current = progress * (TOTAL_FRAMES - 1);
      
      // Navbar translucent check
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Animation Loop (LERP Physics + Direct DOM styling)
  useEffect(() => {
    let animationId: number;
    let lastFrameDrawn = -1;

    const update = () => {
      // Lerp frame indices
      const frameDiff = targetFrame.current - currentFrame.current;
      if (Math.abs(frameDiff) > 0.01) {
        currentFrame.current = lerp(currentFrame.current, targetFrame.current, 0.12);
      } else {
        currentFrame.current = targetFrame.current;
      }

      // Convert current frame to integer
      const frameIndex = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.floor(currentFrame.current))
      );

      // Find nearest loaded frame if current frame is still loading
      let drawableFrame = frameIndex;
      if (!imagesRef.current[drawableFrame]?.complete) {
        // Look left and right for nearest loaded frame
        let left = drawableFrame - 1;
        let right = drawableFrame + 1;
        let found = false;
        
        while (left >= 0 || right < TOTAL_FRAMES) {
          if (left >= 0 && imagesRef.current[left]?.complete) {
            drawableFrame = left;
            found = true;
            break;
          }
          if (right < TOTAL_FRAMES && imagesRef.current[right]?.complete) {
            drawableFrame = right;
            found = true;
            break;
          }
          left--;
          right++;
        }
      }

      // Draw onto canvas if frame is drawable and different from last drawn
      const canvas = canvasRef.current;
      if (canvas && imagesRef.current[drawableFrame]?.complete) {
        const ctx = canvas.getContext("2d");
        if (ctx && drawableFrame !== lastFrameDrawn) {
          drawImageCover(ctx, imagesRef.current[drawableFrame]);
          lastFrameDrawn = drawableFrame;
        }
      }

      // Smoothly update interpolated progress for copy fade in/out
      interpolatedProgress.current = currentFrame.current / (TOTAL_FRAMES - 1);
      const prog = interpolatedProgress.current;

      // Update beat opacities & translates directly on DOM (bypassing React render tree)
      const beats = [
        { ref: beat1Ref, start: 0, end: 0.15 },
        { ref: beat2Ref, start: 0.15, end: 0.40 },
        { ref: beat3Ref, start: 0.40, end: 0.65 },
        { ref: beat4Ref, start: 0.65, end: 0.85 },
        { ref: beat5Ref, start: 0.85, end: 1.0 },
      ];

      beats.forEach((beat) => {
        if (!beat.ref.current) return;
        const style = getBeatStyle(prog, beat.start, beat.end);
        beat.ref.current.style.opacity = String(style.opacity);
        beat.ref.current.style.transform = style.transform;
        beat.ref.current.style.pointerEvents = style.opacity > 0.1 ? "auto" : "none";
      });

      // Scroll indicator fade
      if (indicatorRef.current) {
        const indOpacity = Math.max(0, 1 - prog * 8);
        indicatorRef.current.style.opacity = String(indOpacity);
        indicatorRef.current.style.transform = `translate(-50%, ${prog * 50}px)`;
      }

      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Smooth scroll handler for story beat links
  const scrollToBeat = (percentage: number) => {
    const container = containerRef.current;
    if (!container) return;
    const scrollHeight = container.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: scrollHeight * percentage,
      behavior: "smooth",
    });
  };

  return (
    <div className="bg-[#0B0A08] text-white overflow-x-hidden min-h-screen relative font-sans">
      
      {/* ── Translucent Glass Navbar ───────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-4 px-6 md:px-12 flex items-center justify-between border-b ${
          scrolled
            ? "bg-[#0B0A08]/85 backdrop-blur-md border-white/5 shadow-lg shadow-black/40 py-3"
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <Link to="/" className="flex items-center gap-3 group">
          <img
            src={logoFarmik}
            alt="myfarmik logo"
            className="h-9 w-auto brightness-200 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="flex flex-col">
            <span
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
              className="text-xl tracking-tight text-white/95"
            >
              myfarmik
            </span>
            <span className="text-[8px] uppercase tracking-[0.25em] font-semibold text-white/40 -mt-1">
              Purity to your kitchen
            </span>
          </div>
        </Link>

        {/* Center navigation beats */}
        <nav className="hidden lg:flex items-center gap-10">
          <button
            onClick={() => scrollToBeat(0.0)}
            className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors font-medium"
          >
            Story
          </button>
          <button
            onClick={() => scrollToBeat(0.28)}
            className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors font-medium"
          >
            Cold Press
          </button>
          <button
            onClick={() => scrollToBeat(0.53)}
            className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors font-medium"
          >
            Purity
          </button>
          <Link
            to="/products"
            className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors font-medium"
          >
            Products
          </Link>
          <button
            onClick={() => scrollToBeat(0.0)}
            className="text-xs uppercase tracking-widest text-white hover:text-white transition-colors font-medium border-b border-[#C89B3C] pb-0.5"
          >
            About
          </button>
        </nav>

        {/* Right CTA / Cart / Profile */}
        <div className="flex items-center gap-4">
          <Link
            to="/cart"
            className="relative p-2 rounded-full text-white/70 hover:text-white transition-colors"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#C89B3C] text-black text-[9px] font-bold flex items-center justify-center shadow-md">
                {cartItemCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link
              to="/profile"
              className="p-2 rounded-full text-white/70 hover:text-white transition-colors"
            >
              <User className="h-4.5 w-4.5" />
            </Link>
          ) : (
            <Link
              to="/auth"
              className="p-2 rounded-full text-white/70 hover:text-white transition-colors"
            >
              <User className="h-4.5 w-4.5" />
            </Link>
          )}

          <Link
            to="/products"
            className="inline-flex items-center justify-center px-4 py-1.5 border border-[#C89B3C] text-[#C89B3C] hover:bg-[#C89B3C] hover:text-black transition-colors duration-300 rounded-full text-xs font-semibold tracking-wider"
          >
            Shop Oils
          </Link>
        </div>
      </header>

      {/* ── Cinematic Preloader ────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 bg-[#0B0A08] flex flex-col items-center justify-center transition-opacity duration-1000 ${
          isReady ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="text-center space-y-4 max-w-xs">
          <img src={logoFarmik} alt="myfarmik logo" className="h-16 w-auto mx-auto brightness-200 animate-pulse" />
          <h2 className="text-sm uppercase tracking-[0.25em] text-white/90">myfarmik</h2>
          <p className="text-[10px] uppercase tracking-widest text-[#C89B3C] font-semibold">
            Pure Cold-Pressed Journey
          </p>
          <div className="w-48 h-px bg-white/10 mx-auto relative overflow-hidden rounded-full mt-2">
            <div
              className="absolute left-0 top-0 h-full bg-[#C89B3C] transition-all duration-300"
              style={{ width: `${Math.round((loadedCount / TOTAL_FRAMES) * 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-white/40 font-mono">
            Loading elements... {Math.round((loadedCount / TOTAL_FRAMES) * 100)}%
          </p>
        </div>
      </div>

      {/* ── Main Scrollytelling Pinned Canvas Area ──────────────── */}
      <div ref={containerRef} className="relative w-full h-[550vh] z-10 bg-[#0B0A08]">
        
        {/* Pinned Sticky Window */}
        <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex items-center justify-center bg-[#0B0A08]">
          <canvas
            ref={canvasRef}
            className="w-full h-full block object-cover opacity-90 transition-opacity duration-500"
            style={{ filter: "contrast(1.03) brightness(0.96)" }}
          />
          {/* Subtle vignette layer overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_20%,rgba(11,10,8,0.85)_95%)] pointer-events-none" />
        </div>

        {/* ── Story Beat Elements ─────────────────────────────── */}
        
        {/* Beat 1: INTRODUCTION (0% - 15%) */}
        <div
          ref={beat1Ref}
          className="absolute inset-0 h-screen flex flex-col items-center justify-center text-center px-6 z-20 pointer-events-none"
          style={{ top: "0vh", opacity: 1 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] text-[#C89B3C] font-semibold mb-3">
            Pure Traditional cold press
          </p>
          <h1
            className="text-4xl md:text-7xl font-bold tracking-tight text-white mb-6 uppercase"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            myfarmik
          </h1>
          <p className="text-lg md:text-xl font-light text-white/70 max-w-md italic mb-4">
            Nature, pressed with purpose.
          </p>
          <p className="text-xs md:text-sm text-white/55 max-w-lg leading-relaxed">
            Cold-pressed from carefully selected seeds, filtered with care, and bottled at its purest.
          </p>
        </div>

        {/* Beat 2: COLD PRESS EXTRACTION (15% - 40%) */}
        <div
          ref={beat2Ref}
          className="absolute inset-0 h-screen flex flex-col justify-center text-left px-8 md:px-24 max-w-2xl z-20 pointer-events-none"
          style={{ top: "137.5vh", opacity: 0 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] text-[#6F7D45] font-semibold mb-3">
            The extraction
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 uppercase">
            Pressed, not processed.
          </h2>
          <p className="text-sm md:text-base text-white/70 leading-relaxed mb-4">
            Carefully selected seeds are slowly cold-pressed to release their natural oils while preserving their character, enzymes, and nutrients.
          </p>
          <p className="text-xs text-[#C89B3C] font-medium uppercase tracking-wider">
            No unnecessary heat. No shortcuts.
          </p>
        </div>

        {/* Beat 3: FILTRATION (40% - 65%) */}
        <div
          ref={beat3Ref}
          className="absolute inset-0 h-screen flex flex-col justify-center items-end text-right px-8 md:px-24 ml-auto max-w-2xl z-20 pointer-events-none"
          style={{ top: "275vh", opacity: 0 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] text-[#C89B3C] font-semibold mb-3">
            Pure Clarification
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 uppercase">
            Filtered with care.
          </h2>
          <p className="text-sm md:text-base text-white/70 leading-relaxed mb-4">
            Careful filtration removes suspended particles while preserving the oil's natural character, aroma, sharp taste, and golden color.
          </p>
          <p className="text-xs text-[#6F7D45] font-medium uppercase tracking-wider">
            Clean process. Honest oil.
          </p>
        </div>

        {/* Beat 4: BOTTLING (65% - 85%) */}
        <div
          ref={beat4Ref}
          className="absolute inset-0 h-screen flex flex-col justify-center text-left px-8 md:px-24 max-w-2xl z-20 pointer-events-none"
          style={{ top: "412.5vh", opacity: 0 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] text-[#6F7D45] font-semibold mb-3">
            Precise packaging
          </p>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4 uppercase">
            From press to bottle.
          </h2>
          <p className="text-sm md:text-base text-white/70 leading-relaxed mb-4">
            Every bottle is filled, sealed, and prepared in a highly hygienic facility with the same attention given to the oil extraction itself.
          </p>
          <p className="text-xs text-[#C89B3C] font-medium uppercase tracking-wider">
            Made carefully. Bottled honestly.
          </p>
        </div>

        {/* Beat 5: REVEAL / FINAL STATEMENT (85% - 100%) */}
        <div
          ref={beat5Ref}
          className="absolute inset-0 h-screen flex flex-col items-center justify-center text-center px-6 z-20 pointer-events-none"
          style={{ top: "450vh", opacity: 0 }}
        >
          <p className="text-xs uppercase tracking-[0.25em] text-[#C89B3C] font-semibold mb-3">
            Your Premium Choice
          </p>
          <h2 className="text-3xl md:text-6xl font-bold tracking-tight text-white mb-4 uppercase">
            Purely made.<br />Naturally yours.
          </h2>
          <p className="text-sm md:text-base text-white/70 max-w-md mb-8">
            Cold-pressed oils made with care, from seed to bottle. Bring health back to your kitchen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pointer-events-auto">
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
          <p className="text-[10px] text-white/40 mt-8 tracking-wider">
            Know what goes into every drop.
          </p>
        </div>

        {/* Floating Scroll Indicator (bottom center) */}
        <div
          ref={indicatorRef}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-30 transition-opacity duration-300"
        >
          <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-medium">
            Scroll to begin
          </span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/40 to-transparent relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1/2 bg-[#C89B3C] animate-[bounce_2s_infinite]" />
          </div>
        </div>

      </div>

    </div>
  );
};

export default About;