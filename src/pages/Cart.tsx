import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PaymentGateway from "@/components/PaymentGateway";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

interface CartItemWithProduct {
  id: string;
  quantity: number;
  product: Product;
}

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const { user } = useAuth();
  const { items: cartItemsFromHook, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCartItems();
  }, [user, navigate]);

  const fetchCartItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cart')
        .select(`
          id,
          quantity,
          product_id,
          products (
            id,
            name,
            price,
            image_url
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const formattedItems = data?.map(item => ({
        id: item.id,
        quantity: item.quantity,
        product: {
          id: item.products.id,
          name: item.products.name,
          price: (item.products.price), // Apply 20% discount
          image_url: item.products.image_url,
        }
      })) || [];

      setCartItems(formattedItems);
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast({
        title: "Error",
        description: "Failed to load cart items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId);

      if (error) throw error;

      setCartItems(items =>
        items.map(item =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
      fetchCartItems();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);

      if (error) throw error;

      setCartItems(items => items.filter(item => item.id !== cartItemId));
      fetchCartItems();
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity*0.8), 0);
  };

  const handleCheckout = async () => {
    if (!user || cartItems.length === 0) return;
    if (!shippingAddress || shippingAddress.trim().length === 0) {
  toast({
    title: "Error",
    description: "Please provide a shipping address",
    variant: "destructive",
  });
  return;
}


    setCheckoutLoading(true);

    try {
      const totalAmount = calculateTotal();

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          shipping_address: shippingAddress,
          status: 'pending',
          product_details: cartItems.map(item => ({
            product_id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity
          })),
          customer_name: user.user_metadata.full_name || "Customer",
          customer_email: user.email,
          customer_phone: user.user_metadata.phone || "",
          quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
          payment_mode: showPayment ? 'cash_on_delivery' : 'online_payment' // assuming payment is done if we reach here
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.price

      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      const { error: clearError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (clearError) throw clearError;

      toast({
        title: "Order placed successfully!",
        description: `Order #${order.id.slice(0, 8)} has been created`,
      });

      setCartItems([]);
      await clearCart();
      navigate("/");
    } catch (error) {
      console.error('Error during checkout:', error);
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect to auth
  }
const handlePaymentSuccess = async () => {
  setShowPayment(false);
  await handleCheckout(); // proceed to place order
};

const handlePaymentFailure = () => {
  setShowPayment(false);
  toast({
    title: "Payment Failed",
    description: "Your payment could not be processed.",
    variant: "destructive",
  });
};

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-accent/10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center">
              <ShoppingBag className="mr-3 h-10 w-10" />
              Shopping Cart
            </h1>
            <p className="text-lg text-muted-foreground">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {cartItems.length === 0 ? (
          <div className="text-center">
            <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to get started</p>
            <Button onClick={() => navigate("/products")}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{item.product.name}</h3>
                        <p className="text-lg font-bold text-primary">₹{(item.product.price*0.8).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product.name} × {item.quantity}</span>
                        <span>₹{(item.product.price * item.quantity *0.8).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shipping">Shipping Address</Label>
                    <Textarea
                      id="shipping"
                      placeholder="Enter your complete shipping address..."
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
  className="w-full"
  onClick={() => setShowPayment(true)} // open payment modal first
  disabled={checkoutLoading || cartItems.length === 0}
>
  {checkoutLoading ? "Processing..." : "Place Order"}
</Button>

                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
      {showPayment && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
      <PaymentGateway
        totalAmount={calculateTotal()}
        onPaymentSuccess={handlePaymentSuccess}
        onCancel={handlePaymentFailure}
      />
      <button
        onClick={() => setShowPayment(false)}
        className="mt-4 text-sm text-gray-500"
      >
        Cancel
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default Cart;
