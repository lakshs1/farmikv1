import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  Tag, 
  Copy, 
  Check, 
  ShoppingCart, 
  Percent, 
  ShieldCheck, 
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Offer, PromoCode, FALLBACK_OFFERS, FALLBACK_PROMO_CODES } from "@/integrations/supabase/offers-and-sliders";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  discount_percentage?: number;
  original_price?: number;
  image_url: string;
  stock_quantity: number;
  category: string;
  is_active: boolean;
}

export const OfferDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [offer, setOffer] = useState<Offer | null>(null);
  const [promo, setPromo] = useState<PromoCode | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchOfferAndProducts();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchOfferAndProducts = async () => {
    setLoading(true);
    try {
      // 1. Fetch Offer from database
      let currentOffer: Offer | null = null;
      if (id) {
        const { data, error } = await supabase
          .from("offers")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (!error && data) {
          currentOffer = data as Offer;
        }
      }

      if (!currentOffer) {
        currentOffer = FALLBACK_OFFERS.find((o) => o.id === id) || null;
      }

      // Check if offer is inactive or doesn't exist
      if (!currentOffer || currentOffer.is_active === false) {
        toast({
          title: "Offer Not Available",
          description: "This offer is not available right now, please check out our other offers.",
          variant: "destructive",
        });

        // Find another active offer to redirect to
        let otherActiveOfferId: string | null = null;
        try {
          const { data: otherOffers } = await supabase
            .from("offers")
            .select("id")
            .eq("is_active", true)
            .neq("id", id || "")
            .order("created_at", { ascending: false })
            .limit(1);

          if (otherOffers && otherOffers.length > 0) {
            otherActiveOfferId = otherOffers[0].id;
          }
        } catch (e) {
          console.warn("Could not query other offers:", e);
        }

        if (!otherActiveOfferId) {
          const fallbackOther = FALLBACK_OFFERS.find(o => o.is_active && o.id !== id);
          if (fallbackOther) otherActiveOfferId = fallbackOther.id;
        }

        if (otherActiveOfferId) {
          navigate(`/offers/${otherActiveOfferId}`, { replace: true });
        } else {
          navigate("/products", { replace: true });
        }
        return;
      }

      setOffer(currentOffer);

      // 2. Fetch associated Promo Code if any
      if (currentOffer?.promo_code) {
        const { data: promoData } = await supabase
          .from("promo_codes")
          .select("*")
          .eq("code", currentOffer.promo_code)
          .maybeSingle();

        if (promoData) {
          setPromo(promoData as PromoCode);
        } else {
          const fallbackPromo = FALLBACK_PROMO_CODES.find(
            (p) => p.code.toUpperCase() === currentOffer?.promo_code?.toUpperCase()
          );
          if (fallbackPromo) setPromo(fallbackPromo);
        }
      }

      // 3. Fetch Active Products
      const { data: prodData } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (prodData && prodData.length > 0) {
        setProducts(prodData as Product[]);
      } else {
        setProducts([
          {
            id: "f1",
            name: "Pure Cold-Pressed Mustard Oil (Kachi Ghani)",
            description: "Extracted using traditional wooden churns at low temperature. Pure, unrefined, and rich in natural pungent aroma.",
            mrp: 420,
            discount_percentage: 20,
            price: 336,
            image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800",
            stock_quantity: 45,
            category: "Mustard Oil",
            is_active: true
          },
          {
            id: "f2",
            name: "Heritage Wood-Pressed Mustard Oil Canister",
            description: "Bulk 5L eco-canister of 100% authentic cold-pressed mustard oil. Zero heat, zero chemicals.",
            mrp: 1899,
            discount_percentage: 16,
            price: 1595,
            image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=800",
            stock_quantity: 20,
            category: "Mustard Oil",
            is_active: true
          },
          {
            id: "f3",
            name: "Organic Yellow Mustard Seed Oil",
            description: "Premium mild-flavored cold-pressed oil made from specially selected yellow mustard seeds.",
            mrp: 520,
            discount_percentage: 15,
            price: 442,
            image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800",
            stock_quantity: 30,
            category: "Specialty Oils",
            is_active: true
          },
          {
            id: "f4",
            name: "Pure Cold-Pressed Black Sesame (Til) Oil",
            description: "Deeply aromatic black sesame oil extracted without heat. Rich in antioxidants.",
            mrp: 599,
            discount_percentage: 18,
            price: 491,
            image_url: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=800",
            stock_quantity: 15,
            category: "Specialty Oils",
            is_active: true
          }
        ]);
      }
    } catch (err) {
      console.error("Error loading offer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!offer?.promo_code) return;
    navigator.clipboard.writeText(offer.promo_code);
    setCopied(true);
    toast({
      title: "Promo Code Copied",
      description: `Code "${offer.promo_code}" copied to clipboard. Apply at checkout for extra discount.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1);
      setAddedIds((prev) => ({ ...prev, [product.id]: true }));
      toast({
        title: "Added to Cart",
        description: `${product.name} added to your cart.`,
      });
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [product.id]: false }));
      }, 2000);
    } catch {
      toast({
        title: "Please Sign In",
        description: "Sign in to add items to your cart.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] pt-24 pb-16 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#1A3C2A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-xs font-medium">Checking Offer Availability...</p>
        </div>
      </div>
    );
  }

  if (!offer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] pt-16 pb-20">
      {/* Top Breadcrumb & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <button
          onClick={() => navigate("/products")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Oils</span>
        </button>
      </div>

      {/* Offer Banner Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="bg-[#142A1D] text-white rounded-2xl border border-gray-200 p-6 sm:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Offer Info */}
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#2D5A27] text-white text-xs font-bold uppercase tracking-wider">
                <span>{offer.badge_text || "Special Offer"}</span>
                {offer.discount_percentage && offer.discount_percentage > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-red-600 text-white text-[10px]">
                    {offer.discount_percentage}% OFF
                  </span>
                )}
              </div>

              <h1
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
                className="text-3xl sm:text-5xl font-bold text-white leading-tight"
              >
                {offer.title}
              </h1>

              {offer.subtitle && (
                <p className="text-emerald-200 text-sm sm:text-base font-medium">
                  {offer.subtitle}
                </p>
              )}

              {offer.description && (
                <p className="text-gray-200 text-xs sm:text-sm leading-relaxed max-w-2xl">
                  {offer.description}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-2 text-xs text-gray-200">
                <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Traditional Wooden Churn</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded">
                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Cart Discount</span>
                </div>
              </div>
            </div>

            {/* Right Column: Promo Code Box */}
            {offer.promo_code && (
              <div className="lg:col-span-4">
                <div className="bg-white text-gray-900 rounded-xl p-5 border border-gray-200 shadow-sm text-center space-y-3">
                  <p className="text-[11px] uppercase tracking-widest text-gray-500 font-bold">
                    Promo Code
                  </p>

                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-3">
                    <span className="font-mono text-xl font-bold text-[#1A3C2A]">
                      {offer.promo_code}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="p-1.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                      title="Copy Code"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="w-full py-2 px-3 rounded-lg bg-[#1A3C2A] hover:bg-[#2D5A27] text-white font-semibold text-xs uppercase tracking-wider transition-colors"
                  >
                    {copied ? "Copied!" : "Copy Code"}
                  </button>

                  {promo && (
                    <p className="text-[10px] text-gray-500">
                      {promo.discount_type === "percentage" 
                        ? `${promo.discount_value}% discount on orders above ₹${promo.min_order_amount}` 
                        : `Flat ₹${promo.discount_value} OFF on orders above ₹${promo.min_order_amount}`}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Eligible Products Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6 pb-3 border-b border-gray-200">
          <div>
            <h2
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-2xl sm:text-3xl font-bold text-[#1A3C2A]"
            >
              Products on Offer
            </h2>
            <p className="text-gray-500 text-xs mt-0.5">
              Add products and apply code <span className="font-mono font-bold text-gray-800">{offer.promo_code || "at checkout"}</span>.
            </p>
          </div>

          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1A3C2A] text-white text-xs font-semibold uppercase hover:bg-[#2D5A27] transition-colors"
          >
            <span>View Cart</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const mrp = product.mrp || product.original_price || Math.round(product.price * 1.25);
            const discountPercent = product.discount_percentage || Math.round(((mrp - product.price) / mrp) * 100);
            const finalPrice = product.price;

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Product Image */}
                <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {discountPercent > 0 && (
                    <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {discountPercent}% OFF
                    </div>
                  )}
                </Link>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <Link to={`/products/${product.id}`} className="block">
                      <h3
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        className="text-lg font-bold text-gray-900 line-clamp-1"
                      >
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Pricing Breakdown: MRP, Discount %, Final Price */}
                  <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-[#1A3C2A]">
                        ₹{finalPrice.toFixed(0)}
                      </span>
                      {mrp > finalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          MRP ₹{mrp.toFixed(0)}
                        </span>
                      )}
                    </div>
                    {discountPercent > 0 && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {discountPercent}% off
                      </span>
                    )}
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={product.stock_quantity === 0}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                      addedIds[product.id]
                        ? "bg-emerald-700 text-white"
                        : product.stock_quantity === 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                        : "bg-[#1A3C2A] hover:bg-[#2D5A27] text-white"
                    }`}
                  >
                    {addedIds[product.id] ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Added</span>
                      </>
                    ) : product.stock_quantity === 0 ? (
                      <span>Out of Stock</span>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default OfferDetail;
