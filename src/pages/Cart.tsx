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
// import PaymentGateway from "@/components/PaymentGateway";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MessageCircle, Phone, MapPin, User as UserIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";

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
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  // const [checkoutLoading, setCheckoutLoading] = useState(false);
  // const [showPayment, setShowPayment] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { items: cartItemsFromHook, clearCart } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const status = params.get("status");

  /* =========================================================================
   * [COMMENTED OUT] ORIGINAL PAYMENT GATEWAY & SUPABASE CHECKOUT WORKFLOW
   * =========================================================================
  const createOrderHistory = async() => {
    const txnid = params.get("txnid");
    const amount = params.get("totalAmount");
    const response = await fetch(
          "https://liolbsrurnunulzlpprk.supabase.co/functions/v1/payuSuccess",
          {
            method: "POST",
            headers: { "Content-Type": "application/json",
              "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpb2xic3J1cm51bnVsemxwcHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODg0MTAsImV4cCI6MjA3MjA2NDQxMH0.pfNSqW5-ieGxlWc4MqkY7qZRXh2T7-O2vVXl-oLLdKU",
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxpb2xic3J1cm51bnVsemxwcHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODg0MTAsImV4cCI6MjA3MjA2NDQxMH0.pfNSqW5-ieGxlWc4MqkY7qZRXh2T7-O2vVXl-oLLdKU"
            },
            body: JSON.stringify({
              amount: amount,
              productinfo: "Order",
              firstname: "customer",
              email: "customer@mail.com",
              phone: "9876543210",
              txnid: txnid
            }),
    });

    if (response.status === 200) {
      toast({
        title: "Payment successful!",
        description: "Your order has been placed successfully.",
      });
    }
  }

  useEffect(() => {
    if (status === "success") {
      createOrderHistory();
    }
  }, [status]);

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
          payment_mode: showPayment ? 'cash_on_delivery' : 'online_payment'
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

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    await handleCheckout();
  };

  const handlePaymentFailure = () => {
    setShowPayment(false);
    toast({
      title: "Payment Failed",
      description: "Your payment could not be processed.",
      variant: "destructive",
    });
  };
  ========================================================================= */

  useEffect(() => {
    if (!authLoading && user) {
      fetchCartItems();
      fetchUserProfile();
    }
  }, [authLoading, user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      setCustomerName(user.user_metadata?.full_name || "");
      setCustomerPhone(user.user_metadata?.phone || "");

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, address")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        if (data.full_name) setCustomerName(data.full_name);
        if (data.phone) setCustomerPhone(data.phone);
        if (data.address) setShippingAddress(data.address);
      }
    } catch (err) {
      console.warn("Could not prefill user profile:", err);
    }
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

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
          price: (item.products.price),
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
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity * 0.8), 0);
  };

  // WhatsApp Checkout Workflow
  const handleWhatsAppCheckout = () => {
    if (!user || cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty. Please add items before checking out.",
        variant: "destructive",
      });
      return;
    }

    if (!shippingAddress || shippingAddress.trim().length === 0) {
      toast({
        title: "Address Required",
        description: "Please provide your complete delivery address before proceeding.",
        variant: "destructive",
      });
      return;
    }

    const itemsSummary = cartItems
      .map(
        (item, idx) =>
          `${idx + 1}. *${item.product.name}*\n   • Qty: ${item.quantity}\n   • Price: ₹${(item.product.price * 0.8 * item.quantity).toFixed(2)} (₹${(item.product.price * 0.8).toFixed(2)} each)`
      )
      .join("\n\n");

    const totalAmount = calculateTotal().toFixed(2);
    const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const finalName = customerName.trim() || user?.user_metadata?.full_name || "Customer";
    const finalPhone = customerPhone.trim() || user?.user_metadata?.phone || "Not provided";
    const finalEmail = user?.email || "Not provided";

    const whatsappMessage = 
`*FARMIK ORDER REQUEST*

*Customer Details:*
• *Name:* ${finalName}
• *Phone:* ${finalPhone}
• *Email:* ${finalEmail}
• *Delivery Address:* 
${shippingAddress.trim()}

*Order Items (${totalQty} ${totalQty === 1 ? 'item' : 'items'}):*
${itemsSummary}

━━━━━━━━━━━━━━━━━━━
*Total Amount:* ₹${totalAmount}
━━━━━━━━━━━━━━━━━━━

*Payment:*
I would like to place this order and pay directly here on WhatsApp. Please share your UPI ID / Payment QR code to confirm my order. Thank you!`;

    const whatsappNumber = "918287317599";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

    // Open WhatsApp chat in new tab
    window.open(whatsappUrl, "_blank");

    toast({
      title: "Opening WhatsApp! 💬",
      description: "Redirecting to WhatsApp with your cart & address details to complete payment.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24">
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
    <div className="min-h-screen bg-background pt-24">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-24 w-24 text-muted-foreground mb-4 opacity-50" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some authentic cold-pressed oils to get started</p>
            <Button onClick={() => navigate("/products")} className="bg-[#1A3C2A] hover:bg-[#2D5A27] text-white">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-2">Your Items</h2>
              {cartItems.map((item) => (
                <Card key={item.id} className="border border-gray-100 shadow-xs">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-xl border border-gray-100 bg-emerald-50/30 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{item.product.name}</h3>
                        <p className="text-base font-bold text-primary mt-1">₹{(item.product.price * 0.8).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 ml-1"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary & Customer Details Sidebar */}
            <div className="lg:col-span-5">
              <Card className="border border-emerald-950/10 shadow-sm sticky top-28">
                <CardHeader className="bg-emerald-50/50 pb-4 border-b border-emerald-950/5">
                  <CardTitle className="text-lg font-bold text-[#1A3C2A] flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#2D5A27]" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  {/* Items summary breakdown */}
                  <div className="space-y-2 text-sm">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-gray-600">
                        <span className="truncate max-w-[180px]">{item.product.name} × {item.quantity}</span>
                        <span className="font-medium text-gray-900">₹{(item.product.price * item.quantity * 0.8).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center font-bold text-lg text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-xl text-[#2D5A27]">₹{calculateTotal().toFixed(2)}</span>
                  </div>

                  <Separator />

                  {/* Customer Information & Address Inputs */}
                  <div className="space-y-3.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#2D5A27]" />
                      Delivery Information
                    </h3>

                    <div>
                      <Label htmlFor="customerName" className="text-xs text-gray-600">Your Full Name</Label>
                      <div className="relative mt-1">
                        <Input
                          id="customerName"
                          placeholder="e.g. Rahul Sharma"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="customerPhone" className="text-xs text-gray-600">Phone Number *</Label>
                      <div className="relative mt-1">
                        <Input
                          id="customerPhone"
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="shipping" className="text-xs text-gray-600">Delivery Address *</Label>
                      <Textarea
                        id="shipping"
                        placeholder="House / Flat No, Street, Landmark, City, State, Pincode"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        rows={3}
                        className="mt-1 text-xs resize-none"
                      />
                    </div>
                  </div>

                  {/* Informational WhatsApp Banner */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 text-xs text-emerald-900 leading-relaxed flex items-start gap-2.5">
                    <MessageCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <span>
                      Order directly on WhatsApp with our team. You can confirm delivery details and pay securely via UPI / QR code.
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-6 text-sm flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all"
                    onClick={handleWhatsAppCheckout}
                    disabled={cartItems.length === 0}
                  >
                    <MessageCircle className="w-5 h-5 fill-white" />
                    Order & Pay via WhatsApp
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
       * [COMMENTED OUT] PAYMENT GATEWAY MODAL
       * =========================================================================
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
      ========================================================================= */}
    </div>
  );
};

export default Cart;

