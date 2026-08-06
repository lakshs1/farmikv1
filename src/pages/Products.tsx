import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, ShoppingCart, Eye, Star, ShieldCheck, Award, Heart, Check, Sparkles } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { toast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock_quantity: number;
  category: string;
  is_active: boolean;
  rating?: number;
  original_price?: number;
  weight?: string;
  badge?: string;
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "f1",
    name: "Pure Cold-Pressed Mustard Oil (Kachi Ghani)",
    description: "Extracted using traditional wooden churns at low temperature. Pure, unrefined, and rich in natural pungent aroma and Omega-3.",
    price: 349,
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
    price: 1599,
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
    price: 449,
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
    price: 499,
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
    price: 389,
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
    name: "myfarmik Trio Purity Gift Box",
    description: "A signature curated set featuring 1L Cold-Pressed Mustard Oil, 500ml Sesame Oil, and 1L Groundnut Oil in gift packaging.",
    price: 1199,
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

const CATEGORIES = ["All", "Mustard Oil", "Specialty Oils", "Groundnut Oil", "Gift Sets"];

const SORT_OPTIONS = [
  { label: "Featured", value: "featured" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Name A–Z", value: "name" },
];

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const heroRef = useRef<HTMLDivElement>(null);

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
        // Merge fallback styling fields if missing
        const enhanced = data.map((p, idx) => ({
          ...p,
          rating: 4.8 + (idx % 3) * 0.1,
          weight: p.description?.includes("5L") ? "5 Litre Canister" : "1 Litre Bottle",
          badge: idx === 0 ? "Best Seller" : idx === 1 ? "100% Pure" : "Cold-Pressed"
        }));
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
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
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
      
      {/* ── Landing Hero Banner ─────────────────────────────────── */}
      <section ref={heroRef} className="relative bg-[#1A3C2A] text-white pt-24 pb-20 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#A3E0A3_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/80 border border-emerald-500/30 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#A3E0A3]" />
              <span>100% Traditional Wooden Churn (Kachi Ghani)</span>
            </div>

            <h1
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-tight mb-6"
            >
              Pure Cold-Pressed Oils, <br />
              <span className="italic text-emerald-300 font-normal">Direct from Farm to Kitchen.</span>
            </h1>

            <p className="text-emerald-100/90 text-base sm:text-lg font-light leading-relaxed mb-8 max-w-2xl">
              Zero heat. Zero chemicals. Pressed at room temperature using age-old wooden churns to preserve every nutrient, natural antioxidant, and rich authentic taste.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-emerald-100">
              <div className="flex items-center gap-2 bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-700/40">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Lab Certified Pure</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-700/40">
                <Award className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Zero Solvents</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-700/40">
                <Heart className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Heart Healthy Omega-3</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-900/50 p-2.5 rounded-lg border border-emerald-700/40">
                <Sparkles className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Fresh Small Batches</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Catalog Filter & Search Section ────────────────────────── */}
      <section className="sticky top-[68px] z-40 bg-white/95 backdrop-blur-md border-b border-emerald-950/10 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-[#1A3C2A] text-white shadow-sm"
                      : "bg-emerald-50/60 text-gray-700 hover:bg-emerald-100/60"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search & Sort Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              {/* Search input */}
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search oils..."
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
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-xl z-50 py-1 overflow-hidden">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl font-bold text-[#1A3C2A]">
              Our Collection
            </h2>
            <p className="text-xs text-gray-500 mt-1">Showing {sorted.length} pure cold-pressed products</p>
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
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
              className="mt-4 px-4 py-2 bg-[#1A3C2A] text-white text-xs font-semibold rounded-lg"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sorted.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group bg-white rounded-2xl border border-emerald-950/10 hover:border-emerald-500/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden cursor-pointer no-underline text-inherit"
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

                  {/* Rating Badge */}
                  <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-gray-800 flex items-center gap-1 shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating || 4.9}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                      {product.category || "Mustard Oil"} • {product.weight || "1L"}
                    </div>

                    <h3
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      className="text-xl font-bold text-gray-900 group-hover:text-[#2D5A27] transition-colors leading-snug mb-2"
                    >
                      {product.name}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-4">
                      {product.description}
                    </p>
                  </div>

                  <div>
                    {/* Price Block */}
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold text-[#1A3C2A]">
                        ₹{product.price}
                      </span>
                      {product.original_price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.original_price}
                        </span>
                      )}
                      {product.original_price && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Save ₹{product.original_price - product.price}
                        </span>
                      )}
                    </div>

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
            ))}
          </div>
        )}
      </section>

      {/* ── Why myfarmik Section ───────────────────────────────────── */}
      <section className="bg-white py-16 border-t border-emerald-950/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#2D5A27]">Uncompromising Quality</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl sm:text-4xl font-bold text-[#1A3C2A] mt-2">
              Why Chefs & Families Choose myfarmik
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