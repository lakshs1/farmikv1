import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Tag } from "lucide-react";
import { SliderItem, fetchActiveSliders, FALLBACK_OFFERS } from "@/integrations/supabase/offers-and-sliders";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import farmikLogo from "@/assets/logo-farmik.png";

export const HeroSlider = () => {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSliders();
  }, []);

  const loadSliders = async () => {
    try {
      const data = await fetchActiveSliders();
      setSliders(data);
    } catch (err) {
      console.error("Error loading sliders:", err);
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    if (sliders.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % sliders.length);
  };

  const prevSlide = () => {
    if (sliders.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + sliders.length) % sliders.length);
  };

  const handleSlideNavigation = async (slide: SliderItem) => {
    if (slide.offer_id) {
      let isOfferActive = true;
      try {
        const { data: offerData, error } = await supabase
          .from("offers")
          .select("id, is_active")
          .eq("id", slide.offer_id)
          .maybeSingle();

        if (!error && offerData) {
          isOfferActive = offerData.is_active;
        } else {
          isOfferActive = false;
        }
      } catch {
        isOfferActive = false;
      }

      if (!isOfferActive) {
        toast({
          title: "Offer Not Available",
          description: "This offer is not available right now, please check out our other offers.",
          variant: "destructive",
        });

        // Find another active offer
        try {
          const { data: otherOffers } = await supabase
            .from("offers")
            .select("id")
            .eq("is_active", true)
            .neq("id", slide.offer_id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (otherOffers && otherOffers.length > 0) {
            navigate(`/offers/${otherOffers[0].id}`);
            return;
          }
        } catch (e) {
          console.warn("Could not find other active offer:", e);
        }

        navigate("/products");
        return;
      }

      navigate(`/offers/${slide.offer_id}`);
      return;
    }

    if (slide.link_url) {
      navigate(slide.link_url);
    } else {
      navigate("/products");
    }
  };

  // If no sliders are present or active, show the clean white background welcome banner with logo
  if (!loading && sliders.length === 0) {
    return (
      <section className="w-full bg-white border-b border-gray-200 py-12 sm:py-16 text-center select-none">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <img
            src={farmikLogo}
            alt="FARMIK"
            className="h-16 sm:h-20 w-auto mx-auto object-contain"
          />
          <h1
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-3xl sm:text-5xl font-bold text-gray-900 tracking-tight"
          >
            Welcome to FARMIK Oils
          </h1>
          <p className="text-gray-600 text-base sm:text-lg font-normal tracking-wide">
            Purity to your kitchen.
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="w-full bg-white border-b border-gray-200 py-12 text-center">
        <div className="w-6 h-6 border-2 border-[#1A3C2A] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const currentSlide = sliders[currentIndex];

  return (
    <section 
      className="relative w-full bg-[#142A1D] text-white border-b border-gray-200 select-none"
      aria-label="Homescreen Slider"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Text Information */}
          <div className="lg:col-span-6 space-y-4">
            {currentSlide.badge_text && (
              <div className="inline-block px-3 py-1 rounded bg-[#2D5A27] text-white text-xs font-semibold tracking-wide uppercase">
                {currentSlide.badge_text}
              </div>
            )}

            <h1
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-3xl sm:text-5xl font-bold text-white leading-tight"
            >
              {currentSlide.title}
            </h1>

            {(currentSlide.subtitle || currentSlide.description) && (
              <p className="text-gray-200 text-sm sm:text-base font-normal leading-relaxed max-w-xl">
                {currentSlide.subtitle || currentSlide.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSlideNavigation(currentSlide)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#2D5A27] hover:bg-[#386F30] text-white text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors"
              >
                <span>{currentSlide.button_text || "Shop Now"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {currentSlide.offer_id && (
                <button
                  type="button"
                  onClick={() => handleSlideNavigation(currentSlide)}
                  className="inline-flex items-center gap-1.5 px-5 py-3 rounded-lg bg-white text-[#1A3C2A] hover:bg-gray-100 text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  <span>View Offer</span>
                </button>
              )}
            </div>

            {sliders.length > 1 && (
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={prevSlide}
                  aria-label="Previous Slide"
                  className="p-2 rounded border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-300 font-mono">
                  {currentIndex + 1} / {sliders.length}
                </span>
                <button
                  type="button"
                  onClick={nextSlide}
                  aria-label="Next Slide"
                  className="p-2 rounded border border-white/30 text-white hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Uploaded Image Display */}
          <div className="lg:col-span-6 flex justify-center">
            <div 
              onClick={() => handleSlideNavigation(currentSlide)}
              className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-black/20 border border-white/10 shadow-md cursor-pointer hover:opacity-95 transition-opacity"
            >
              <img
                src={currentSlide.image_url}
                alt={currentSlide.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
