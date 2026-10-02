import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, ShoppingCart, Eye, Star, Heart, Check } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";
import { HeroSlider } from "@/components/home/HeroSlider";

import { ProductVariant } from "@/integrations/supabase/offers-and-sliders";

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
  rating?: number;
  weight?: string;
  badge?: string;
  variants?: ProductVariant[];
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "f1",
    name: "Pure Cold-Pressed Mustard Oil (Kachi Ghani)",
    description: "Extracted using traditional wooden churns at low temperature. Pure, unrefined, and rich in natural pungent aroma and Omega-3.",
    mrp: 420,
    discount_percentage: 20,
    price: 336,
    original_price: 420,
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 45,
    category: "Mustard Oil",
    is_active: true,
    rating: 4.9,
    weight: "1 Litre Glass Bottle",
    badge: "Best Seller"
  },
  {
    id: "f2",
    name: "Heritage Wood-Pressed Mustard Oil Canister",
    description: "Bulk 5L eco-canister of 100% authentic cold-pressed mustard oil. Zero heat, zero chemicals, ideal for whole-family daily cooking.",
    mrp: 1899,
    discount_percentage: 16,
    price: 1595,
    original_price: 1899,
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 20,
    category: "Mustard Oil",
    is_active: true,
    rating: 4.95,
    weight: "5 Litre Canister",
    badge: "Value Pack"
  },
  {
    id: "f3",
    name: "Organic Yellow Mustard Seed Oil",
    description: "Premium mild-flavored cold-pressed oil made from specially selected yellow mustard seeds. Smooth finish for gourmet dressings.",
    mrp: 520,
    discount_percentage: 15,
    price: 442,
    original_price: 520,
    image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 30,
    category: "Specialty Oils",
    is_active: true,
    rating: 4.8,
    weight: "1 Litre Glass Bottle",
    badge: "Gourmet Choice"
  },
  {
    id: "f4",
    name: "Pure Cold-Pressed Black Sesame (Til) Oil",
    description: "Deeply aromatic black sesame oil extracted without heat. Rich in antioxidants, ideal for cooking and holistic wellness.",
    mrp: 599,
    discount_percentage: 18,
    price: 491,
    original_price: 599,
    image_url: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 15,
    category: "Specialty Oils",
    is_active: true,
    rating: 4.9,
    weight: "500 ml Glass Bottle",
    badge: "Antioxidant Rich"
  },
  {
    id: "f5",
    name: "Traditional Wood-Pressed Groundnut (Peanut) Oil",
    description: "Cold-pressed from fresh organic peanuts. High smoke point with a nutty flavor perfect for frying and sautéing.",
    mrp: 450,
    discount_percentage: 14,
    price: 387,
    original_price: 450,
    image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 25,
    category: "Groundnut Oil",
    is_active: true,
    rating: 4.85,
    weight: "1 Litre Glass Bottle",
    badge: "Popular"
  },
  {
    id: "f6",
    name: "FARMIK Trio Purity Gift Box",
    description: "A signature curated set featuring 1L Cold-Pressed Mustard Oil, 500ml Sesame Oil, and 1L Groundnut Oil in gift packaging.",
    mrp: 1469,
    discount_percentage: 18,
    price: 1204,
    original_price: 1469,
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
    stock_quantity: 10,
    category: "Gift Sets",
    is_active: true,
    rating: 5.0,
    weight: "3 Bottle Bundle",
    badge: "Signature Set"
  }
];

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Discount: High to Low", value: "discount-high" },
  { label: "Name A–Z", value: "name" },
];

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProducts();
    const urlSearch = searchParams.get("search");
    if (urlSearch) setSearchQuery(urlSearch);
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      
      if (error || !data || data.length === 0) {
        setProducts(FALLBACK_PRODUCTS);
      } else {
        const enhanced = (data as any[]).map((p, idx) => {
          const mrp = Number(p.mrp || p.original_price || (p.discount_percentage ? Math.round(p.price / (1 - p.discount_percentage / 100)) : Math.round(p.price * 1.25)));
          const discountPercent = p.discount_percentage !== undefined && p.discount_percentage !== null 
            ? Number(p.discount_percentage) 
            : Math.round(((mrp - p.price) / mrp) * 100);

          return {
            ...p,
            mrp,
            discount_percentage: discountPercent,
            rating: Number((4.8 + (idx % 3) * 0.1).toFixed(2)),
            weight: p.description?.includes("5L") ? "5 Litre Canister" : "1 Litre Bottle",
            badge: idx === 0 ? "Best Seller" : idx === 1 ? "100% Pure" : undefined
          };
        });
        setProducts(enhanced);
      }
    } catch {
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "discount-high") return (b.discount_percentage || 0) - (a.discount_percentage || 0);
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const handleAddToCart = (product: Product) => {
    addToCart(product.id, 1);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    toast({
      title: "Added to Cart! 🛒",
      description: `${product.name} has been added to your cart.`,
    });
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-gray-800">
      
      {/* ── Dynamic Hero Slider (Replaces static green block) ── */}
      <HeroSlider />

      {/* ── Catalog Filter & Search Section ────────────────────────── */}
      <section className="sticky top-[64px] z-40 bg-white/95 backdrop-blur-md border-b border-emerald-950/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-bold text-[#1A3C2A] hidden sm:block">
                Authentic Cold-Pressed Range
              </h2>
              <p className="text-[11px] text-gray-500 hidden sm:block">Freshly pressed • Zero heat & chemicals</p>
            </div>

            {/* Search & Sort Actions */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Search input */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search pure oils..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#2D5A27] focus:bg-white transition-all"
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-gray-500" />
                  <span className="hidden sm:inline">Sort:</span>
                  <span>{SORT_OPTIONS.find((o) => o.value === sortBy)?.label}</span>
                </button>

                {sortOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-gray-100 shadow-xl z-50 py-1 overflow-hidden">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setSortBy(opt.value);
                          setSortOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs transition-colors ${
                          sortBy === opt.value
                            ? "bg-emerald-50 text-[#2D5A27] font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Product Catalog Grid ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl font-bold text-[#1A3C2A]">
              Farm-Fresh Collection
            </h2>
            <p className="text-xs text-gray-500 mt-1">Showing {sorted.length} organic & cold-pressed oils</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 h-96 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 p-8">
            <p style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl text-gray-500">
              No products found matching your search.
            </p>
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 px-4 py-2 bg-[#1A3C2A] text-white text-xs font-semibold rounded-lg"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sorted.map((product) => {
              const mrp = product.mrp || product.original_price || Math.round(product.price * 1.25);
              const discountPercent = product.discount_percentage !== undefined && product.discount_percentage !== null
                ? product.discount_percentage
                : Math.round(((mrp - product.price) / mrp) * 100);
              const finalPrice = product.price;

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="group bg-white rounded-2xl border border-gray-200/80 hover:border-emerald-700/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer no-underline text-inherit"
                >
                  {/* Product Image Container */}
                  <div className="relative aspect-[4/3] bg-emerald-50/40 overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    
                    {/* Badge Overlay */}
                    {product.badge && (
                      <span className="absolute top-3 left-3 bg-[#1A3C2A] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        {product.badge}
                      </span>
                    )}

                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                      <span className="absolute top-3 right-3 bg-red-600 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                        {discountPercent}% OFF
                      </span>
                    )}
   
                    {/* Rating Badge */}
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-gray-800 flex items-center gap-1 shadow-xs border border-gray-100">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{Number(product.rating || 4.9).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                        {product.category || "Mustard Oil"} • {product.weight || "1L Glass Bottle"}
                      </div>

                      <h3
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        className="text-xl font-bold text-gray-900 group-hover:text-[#2D5A27] transition-colors leading-snug mb-2"
                      >
                        {product.name}
                      </h3>

                      {/* Available pack size badges */}
                      {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="text-[10px] uppercase font-semibold text-gray-400">Packs:</span>
                          {product.variants.map((v, vi) => (
                            <span
                              key={vi}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-200"
                            >
                              {v.size}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Pricing Block under Product Name */}
                      <div className="my-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-baseline justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-[#1A3C2A]">
                            ₹{finalPrice.toFixed(0)}
                          </span>
                          {mrp > finalPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              MRP ₹{mrp.toFixed(0)}
                            </span>
                          )}
                        </div>
                        {discountPercent > 0 && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                            {discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                        {product.description}
                      </p>
                    </div>

                    <div>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddToCart(product); }}
                          disabled={product.stock_quantity === 0}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                            addedIds[product.id]
                              ? "bg-emerald-700 text-white"
                              : "bg-[#1A3C2A] text-white hover:bg-[#2D5A27] shadow-sm hover:shadow-md"
                          } disabled:opacity-50`}
                        >
                          {addedIds[product.id] ? (
                            <>
                              <Check className="w-4 h-4" /> Added
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" /> Add to Cart
                            </>
                          )}
                        </button>

                        <span
                          className="p-3 rounded-xl border border-gray-200 text-gray-600 hover:text-[#1A3C2A] hover:bg-emerald-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </span>
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Why FARMIK Section ───────────────────────────────────── */}
      <section className="bg-white py-16 border-t border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2D5A27]">Uncompromising Quality</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl sm:text-4xl font-bold text-[#1A3C2A] mt-2">
              Why Chefs & Families Choose FARMIK
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#FAF9F5] p-8 rounded-2xl border border-emerald-950/5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#2D5A27] flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                1
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Wood-Pressed (Kachi Ghani)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Extracted using slow-revolving wooden churners maintaining temperature below 45°C to preserve vital omega-3 fatty acids and natural vitamins.
              </p>
            </div>

            <div className="bg-[#FAF9F5] p-8 rounded-2xl border border-emerald-950/5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#2D5A27] flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                2
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Zero Chemical Refining</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                No hexane, no bleaching, no artificial deodorizers. You get 100% pure oil with its authentic rich aroma and natural golden color.
              </p>
            </div>

            <div className="bg-[#FAF9F5] p-8 rounded-2xl border border-emerald-950/5 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#2D5A27] flex items-center justify-center mx-auto mb-4 font-bold text-xl">
                3
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Direct Farm Sourced Seeds</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                We partner directly with organic mustard farmers, selecting only clean, non-GMO seed batches checked for moisture and purity.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Products;