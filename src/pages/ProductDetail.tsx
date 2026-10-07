import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, ShoppingCart, Heart, Truck, Shield, ArrowLeft, Plus, Minus, Tag, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
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
  images?: string[];
  stock_quantity: number;
  category: string;
  is_active: boolean;
  variants?: ProductVariant[];
}

interface Review {
  id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface StandardSizeConfig {
  sizeKey: string;
  label: string;
  multiplier: number;
  badge: string;
}

const STANDARD_PACK_SIZES: StandardSizeConfig[] = [
  { sizeKey: "100ml", label: "100 ml", multiplier: 0.25, badge: "Trial Pack" },
  { sizeKey: "500ml", label: "500 ml", multiplier: 0.55, badge: "Popular" },
  { sizeKey: "1ltr", label: "1 Ltr", multiplier: 1.0, badge: "Standard" },
  { sizeKey: "5ltr", label: "5 Ltr", multiplier: 4.75, badge: "Best Value (Save More)" },
];

const getNormalizedVariants = (product: {
  price: number;
  mrp?: number;
  original_price?: number;
  discount_percentage?: number;
  variants?: ProductVariant[];
}): ProductVariant[] => {
  const basePrice = Number(product.price) || 350;
  const baseMrp = Number(product.mrp || product.original_price) || Math.round(basePrice * 1.25);
  const baseDiscount = product.discount_percentage !== undefined && product.discount_percentage !== null
    ? Number(product.discount_percentage)
    : Math.round(((baseMrp - basePrice) / baseMrp) * 100);

  const existingVariants = Array.isArray(product.variants) && product.variants.length > 0 ? product.variants : [];

  return STANDARD_PACK_SIZES.map((std) => {
    // Look for matching custom variant if configured in DB
    const match = existingVariants.find((v) => {
      const vNorm = v.size.toLowerCase().replace(/[\s\-_]/g, "");
      const stdNorm = std.sizeKey.toLowerCase().replace(/[\s\-_]/g, "");
      return (
        vNorm === stdNorm ||
        (stdNorm === "1ltr" && (vNorm === "1l" || vNorm === "1litre" || vNorm === "1liter")) ||
        (stdNorm === "5ltr" && (vNorm === "5l" || vNorm === "5litre" || vNorm === "5liter")) ||
        (stdNorm === "100ml" && (vNorm === "100" || vNorm === "100m")) ||
        (stdNorm === "500ml" && (vNorm === "500" || vNorm === "500m"))
      );
    });

    if (match) {
      return {
        ...match,
        size: std.label,
      };
    }

    const calculatedMrp = Math.round(baseMrp * std.multiplier);
    const calculatedPrice = Math.round(basePrice * std.multiplier);
    const calculatedDiscount = calculatedMrp > calculatedPrice
      ? Math.round(((calculatedMrp - calculatedPrice) / calculatedMrp) * 100)
      : baseDiscount;

    return {
      size: std.label,
      mrp: calculatedMrp,
      price: calculatedPrice,
      discount_percentage: calculatedDiscount,
      stock_quantity: 50,
    };
  });
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      const normalizedVariants = getNormalizedVariants(data);
      const productWithVariants = {
        ...data,
        variants: normalizedVariants,
      };

      setProduct(productWithVariants);

      // Default to 1 Ltr pack or first available variant
      const defaultVar =
        normalizedVariants.find(
          (v) =>
            v.size.toLowerCase().includes("1 ltr") ||
            v.size.toLowerCase().includes("1l")
        ) || normalizedVariants[0];

      setSelectedVariant(defaultVar);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    // Mock reviews for now - in real app would fetch from reviews table
    setReviews([
      {
        id: '1',
        user_name: 'Priya S.',
        rating: 5,
        comment: 'Excellent quality mustard oil! Pure and authentic taste.',
        created_at: '2024-01-15'
      },
      {
        id: '2',
        user_name: 'Rajesh K.',
        rating: 4,
        comment: 'Good quality oil, fast delivery. Recommended!',
        created_at: '2024-01-10'
      }
    ]);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      await addToCart(product.id, quantity);
      const packInfo = selectedVariant ? ` (${selectedVariant.size})` : "";
      toast({
        title: "Added to Cart!",
        description: `${quantity}x ${product.name}${packInfo} added to your cart`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 flower-rating ${
          i < rating ? 'fill-primary text-primary' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background pt-24">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Button onClick={() => navigate('/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>
    );
  }

  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const activeMrp = selectedVariant?.mrp 
    ? selectedVariant.mrp 
    : (product.mrp || product.original_price || Math.round(activePrice * 1.25));
  const activeDiscount = selectedVariant?.discount_percentage !== undefined && selectedVariant?.discount_percentage !== null
    ? selectedVariant.discount_percentage
    : (product.discount_percentage !== undefined && product.discount_percentage !== null
      ? product.discount_percentage
      : (activeMrp > activePrice ? Math.round(((activeMrp - activePrice) / activeMrp) * 100) : 0));
  const savings = activeMrp - activePrice;
  const availableVariants = product.variants && product.variants.length > 0
    ? product.variants
    : getNormalizedVariants(product);

  return (
    <div className="min-h-screen bg-[#FAF9F5] pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/products')}
          className="mb-6 text-xs text-[#1A3C2A] hover:bg-gray-100"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to All Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Product Images Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {(() => {
              const galleryImages: string[] = (product.images && Array.isArray(product.images) && product.images.length > 0)
                ? product.images
                : [product.image_url];
              const currentImg = galleryImages[selectedImage] || galleryImages[0] || product.image_url;

              return (
                <>
                  <div className="aspect-square overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm p-4 flex items-center justify-center">
                    <img
                      src={currentImg}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-xl transition-all duration-300 hover:scale-105"
                    />
                  </div>

                  {/* Thumbnail Row */}
                  {galleryImages.length > 1 && (
                    <div className="flex items-center gap-3 overflow-x-auto pb-2">
                      {galleryImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImage(idx)}
                          className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 bg-white transition-all ${
                            selectedImage === idx
                              ? 'border-[#1A3C2A] ring-2 ring-[#1A3C2A]/30 shadow-sm'
                              : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Product Info & Options */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-7 shadow-sm space-y-5">
              <div>
                <Badge className="mb-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold uppercase tracking-wider">
                  {product.category.replace('-', ' ').toUpperCase()}
                </Badge>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl sm:text-3xl font-bold text-[#1A3C2A] leading-tight">
                  {product.name}
                </h1>
                
                <div className="flex items-center space-x-1 pt-2">
                  {renderStars(5)}
                  <span className="text-xs text-gray-500 ml-2">
                    ({reviews.length} verified customer reviews)
                  </span>
                </div>
              </div>

              {/* Price & Savings */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/80">
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="text-3xl sm:text-4xl font-bold text-[#1A3C2A]">
                    ₹{activePrice.toFixed(0)}
                  </span>
                  {activeMrp > activePrice && (
                    <span className="text-base text-gray-400 line-through">
                      MRP ₹{activeMrp.toFixed(0)}
                    </span>
                  )}
                  {activeDiscount > 0 && (
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200 uppercase">
                      {activeDiscount}% OFF
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      You save ₹{savings.toFixed(0)} ({activeDiscount}% off) on {selectedVariant ? `${selectedVariant.size} pack` : "this pack"}
                    </span>
                  </p>
                )}
              </div>

              {/* Quantity / Pack Size Selector: 100 ml, 500 ml, 1ltr, 5ltr */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Choose Pack Size / Quantity:</span>
                  </label>
                  {selectedVariant && (
                    <span className="text-xs text-emerald-800 font-bold bg-emerald-100/70 px-2 py-0.5 rounded">
                      Selected: {selectedVariant.size}
                    </span>
                  )}
                </div>

                {/* 4 Standard Size Cards: 100 ml, 500 ml, 1ltr, 5ltr */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availableVariants.map((v, i) => {
                    const isSelected = selectedVariant?.size === v.size;
                    const presetConfig = STANDARD_PACK_SIZES.find(
                      (p) => p.label.toLowerCase() === v.size.toLowerCase() ||
                             v.size.toLowerCase().includes(p.sizeKey)
                    );
                    const badgeText = presetConfig?.badge;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`relative p-3 rounded-xl text-left transition-all border-2 flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#1A3C2A] text-white border-[#1A3C2A] shadow-md ring-2 ring-[#1A3C2A]/20 scale-[1.02]"
                            : "bg-white text-gray-800 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        {badgeText && (
                          <div
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1.5 w-fit ${
                              isSelected
                                ? "bg-emerald-500/30 text-emerald-200 border border-emerald-400/40"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {badgeText}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-gray-900"}`}>
                              {v.size}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />}
                          </div>

                          <div className="mt-1 flex items-baseline gap-1">
                            <span className={`text-xs font-bold ${isSelected ? "text-emerald-200" : "text-[#1A3C2A]"}`}>
                              ₹{v.price}
                            </span>
                            {v.mrp && v.mrp > v.price && (
                              <span className={`text-[10px] line-through ${isSelected ? "text-gray-300/80" : "text-gray-400"}`}>
                                ₹{v.mrp}
                              </span>
                            )}
                          </div>
                        </div>

                        {v.discount_percentage && v.discount_percentage > 0 && (
                          <span className={`text-[10px] font-semibold mt-1.5 ${isSelected ? "text-emerald-300" : "text-emerald-700"}`}>
                            {v.discount_percentage}% OFF
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2 text-xs pt-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    (selectedVariant?.stock_quantity ?? product.stock_quantity) > 0
                      ? 'bg-emerald-600'
                      : 'bg-red-500'
                  }`}
                />
                <span className="font-medium text-gray-700">
                  {(selectedVariant?.stock_quantity ?? product.stock_quantity) > 0
                    ? `In Stock • ${selectedVariant?.size || 'Standard'} Pack available for fast dispatch`
                    : 'Out of Stock'}
                </span>
              </div>

              <Separator />

              {/* Quantity Count & Add to Cart */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Number of Units:
                  </span>
                  
                  {/* Quantity Counter */}
                  <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded text-gray-700 hover:bg-white"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="px-2 min-w-[2rem] text-center text-xs font-bold text-gray-900">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded text-gray-700 hover:bg-white"
                      onClick={() => setQuantity(Math.min(product.stock_quantity || 99, quantity + 1))}
                      disabled={quantity >= (product.stock_quantity || 99)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Total Preview */}
                <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <span>Selected Total ({quantity} {quantity === 1 ? 'bottle' : 'bottles'} of {selectedVariant?.size || '1 Ltr'}):</span>
                  <span className="font-bold text-[#1A3C2A] text-sm">
                    ₹{(activePrice * quantity).toFixed(0)}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-1">
                  <Button
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0}
                    className="flex-1 bg-[#1A3C2A] hover:bg-[#2D5A27] text-white py-3 h-auto text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add {quantity > 1 ? `${quantity}x ` : ""}{selectedVariant ? `(${selectedVariant.size}) ` : ""}to Cart • ₹{(activePrice * quantity).toFixed(0)}
                  </Button>
                  <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-gray-300 text-gray-600 hover:text-red-500 hover:border-red-200 hover:bg-red-50">
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Assurance Features */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <Truck className="h-4 w-4 text-[#2D5A27] shrink-0" />
                  <span className="text-[11px] font-medium text-gray-700">Free delivery on orders</span>
                </div>
                <div className="flex items-center space-x-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <Shield className="h-4 w-4 text-[#2D5A27] shrink-0" />
                  <span className="text-[11px] font-medium text-gray-700">100% Pure & Cold-Pressed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="benefits">Health Benefits</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Product Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description || "Our premium cold-pressed mustard oil is extracted using traditional methods that preserve all the natural nutrients and authentic flavor. Made from carefully selected mustard seeds, this oil is perfect for cooking, hair care, and massage."}
                  </p>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Key Features:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Cold-pressed extraction</li>
                        <li>• 100% pure and natural</li>
                        <li>• No chemicals or additives</li>
                        <li>• Traditional processing methods</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Usage:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Cooking and frying</li>
                        <li>• Hair care and massage</li>
                        <li>• Pickling and preservation</li>
                        <li>• Ayurvedic applications</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="benefits" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Health Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3 text-primary">Nutritional Benefits</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Rich in Omega-3 and Omega-6 fatty acids</li>
                        <li>• Contains vitamin E and antioxidants</li>
                        <li>• Natural source of monounsaturated fats</li>
                        <li>• Supports heart health</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 text-primary">Therapeutic Properties</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Anti-inflammatory properties</li>
                        <li>• Supports respiratory health</li>
                        <li>• Natural antibacterial effects</li>
                        <li>• Promotes healthy circulation</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {review.user_name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{review.user_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;