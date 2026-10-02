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
      setProduct(data);
      if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
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
        title: "Added to cart!",
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

  return (
    <div className="min-h-screen bg-background pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          className="mb-6 farm-hover"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images Gallery */}
          <div className="space-y-4">
            {(() => {
              const galleryImages: string[] = (product.images && Array.isArray(product.images) && product.images.length > 0)
                ? product.images
                : [product.image_url];
              const currentImg = galleryImages[selectedImage] || galleryImages[0] || product.image_url;

              return (
                <>
                  <div className="aspect-square overflow-hidden rounded-2xl bg-muted border border-gray-100 shadow-xs">
                    <img
                      src={currentImg}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-200"
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
                          className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                            selectedImage === idx
                              ? 'border-[#1A3C2A] ring-2 ring-[#1A3C2A]/30 shadow-xs'
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

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2 bg-primary/10 text-primary">
                {product.category.replace('-', ' ').toUpperCase()}
              </Badge>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {product.name}
              </h1>
              {(() => {
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

                return (
                  <div className="space-y-4 mb-6">
                    {/* Price & Savings */}
                    <div>
                      <div className="flex flex-wrap items-baseline gap-3">
                        <span className="text-4xl font-bold text-[#1A3C2A]">
                          ₹{activePrice.toFixed(0)}
                        </span>
                        {activeMrp > activePrice && (
                          <span className="text-base text-gray-400 line-through">
                            MRP ₹{activeMrp.toFixed(0)}
                          </span>
                        )}
                        {activeDiscount > 0 && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 uppercase tracking-wider">
                            {activeDiscount}% OFF
                          </span>
                        )}
                      </div>
                      {savings > 0 && (
                        <p className="text-xs font-semibold text-emerald-700 mt-1">
                          You save ₹{savings.toFixed(0)} ({activeDiscount}% discount) {selectedVariant ? `on ${selectedVariant.size} pack` : "on this pack"}
                        </p>
                      )}
                    </div>

                    {/* Pack Size / Variant Selector (e.g. 500ml, 1L, 5L) */}
                    {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                      <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                            Select Available Size / Pack:
                          </span>
                          {selectedVariant && (
                            <span className="text-xs text-emerald-700 font-semibold">
                              Selected: {selectedVariant.size}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {product.variants.map((v, i) => {
                            const isSelected = (selectedVariant?.size || product.variants![0].size) === v.size;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setSelectedVariant(v)}
                                className={`px-4 py-2 rounded-lg text-left transition-all ${
                                  isSelected
                                    ? "bg-[#1A3C2A] text-white shadow-sm ring-2 ring-[#1A3C2A]/20"
                                    : "bg-white text-gray-800 border border-gray-300 hover:border-gray-400 hover:bg-gray-100/60"
                                }`}
                              >
                                <div className="text-xs font-bold">{v.size}</div>
                                <div className={`text-[11px] ${isSelected ? "text-emerald-200" : "text-gray-500"}`}>
                                  ₹{v.price} {v.mrp && v.mrp > v.price ? `(₹${v.mrp})` : ""}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-1 pt-1">
                      {renderStars(5)}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({reviews.length} verified customer reviews)
                      </span>
                    </div>
                  </div>
                );
              })()}
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                (selectedVariant?.stock_quantity ?? product.stock_quantity) > 0 ? 'bg-success' : 'bg-destructive'
              }`}></div>
              <span className="text-sm">
                {(selectedVariant?.stock_quantity ?? product.stock_quantity) > 0 
                  ? `${selectedVariant?.stock_quantity ?? product.stock_quantity} in stock` 
                  : 'Out of stock'
                }
              </span>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="px-4 py-2 min-w-[3rem] text-center">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
                className="flex-1 bg-primary hover:bg-primary/90 farm-hover"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              <Button variant="outline" size="lg" className="farm-hover">
                <Heart className="h-5 w-5" />
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Truck className="h-5 w-5 text-primary" />
                <span className="text-sm">Free delivery above ₹500</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-sm">100% Pure & Natural</span>
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