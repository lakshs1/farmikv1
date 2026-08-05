import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, ShoppingCart, Link as LinkIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useSearchParams } from "react-router-dom";
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
}

const SORT_OPTIONS = [
  { label: "Name A–Z", value: "name" },
  { label: "Price: Low", value: "price-low" },
  { label: "Price: High", value: "price-high" },
];

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOpen, setSortOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    const urlSearch = searchParams.get("search");
    if (urlSearch) setSearchQuery(urlSearch);
  }, [searchParams]);

  // Reveal title
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add("is-visible"); obs.unobserve(el); }
    }, { rootMargin: "0px 0px -60px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch {
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  const handleAddToCart = (productId: string) => addToCart(productId, 1);

  return (
    <div className="min-h-screen bg-background page-enter pt-24">

      {/* ── Page header ───────────────────────────────────── */}
      <div ref={titleRef} className="reveal max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-10 border-b border-border">
        <p
          className="text-xs uppercase tracking-[0.18em] text-primary mb-3"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Our Range
        </p>
        <h1
          style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}
          className="text-foreground"
        >
          Cold-Pressed Oils
        </h1>
        <p
          className="mt-4 text-muted-foreground max-w-xl"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
        >
          Pressed at ambient temperature. No heat. No solvents. Just oil as it should be.
        </p>
      </div>

      {/* ── Filters bar ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6 flex flex-wrap items-center gap-4 border-b border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-b border-border pl-6 pr-2 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        <div className="flex items-center gap-4 ml-auto">
          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </button>
            {sortOpen && (
              <div
                className="absolute right-0 top-full mt-2 bg-card border border-border shadow-md z-20 py-1"
                style={{ minWidth: "140px" }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors ${
                      sortBy === opt.value ? "text-primary" : "text-foreground"
                    }`}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Count */}
          <span
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            {sorted.length} {sorted.length === 1 ? "product" : "products"}
          </span>
        </div>
      </div>

      {/* ── Products grid ─────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-24 text-center">
            <p
              className="text-muted-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 300 }}
            >
              No products match your search.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
            {sorted.map((product) => (
              <div
                key={product.id}
                className="product-card bg-background group relative overflow-hidden"
              >
                {/* Image */}
                <div className="aspect-[3/4] overflow-hidden bg-card">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="card-img w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3
                    className="text-foreground mb-1 leading-snug"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontWeight: 400,
                      fontSize: "1.05rem",
                    }}
                  >
                    {product.name}
                  </h3>
                  <p
                    className="text-xs text-muted-foreground line-clamp-2 mb-3"
                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
                  >
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-foreground font-medium text-sm"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      ₹{product.price.toFixed(0)}
                    </span>
                    {product.stock_quantity === 0 && (
                      <span
                        className="text-xs text-muted-foreground"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        Out of stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover-reveal CTA */}
                <div className="cart-action absolute bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex gap-2">
                  <button
                    onClick={() => handleAddToCart(product.id)}
                    disabled={product.stock_quantity === 0}
                    className="flex-1 btn-primary text-xs py-2 justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Add to Cart
                  </button>
                  <Link
                    to={`/products/${product.id}`}
                    className="btn-minimal text-xs py-2 px-3"
                    title="View details"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom note ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-24">
        <div className="border-t border-border pt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: "Traditional Methods", desc: "Cold-pressed using wooden churns to preserve nutrients." },
            { title: "No Additives", desc: "No chemicals, no artificial processing. Pure and unrefined." },
            { title: "Tested Batches", desc: "Every batch checked for purity, acidity, and nutritional content." },
          ].map((item) => (
            <div key={item.title}>
              <h4
                className="text-foreground mb-2"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: "1.1rem" }}
              >
                {item.title}
              </h4>
              <p
                className="text-sm text-muted-foreground"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300 }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Products;