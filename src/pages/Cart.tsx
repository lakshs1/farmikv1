import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, MessageCircle, MapPin, Tag, X, CreditCard, Loader2 } from "lucide-react";
import { PromoCode, validatePromoCode } from "@/integrations/supabase/offers-and-sliders";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  mrp?: number;
  discount_percentage?: number;
}

interface CartItemWithProduct {
  id: string;
  product_id?: string;
  quantity: number;
  product: Product;
}

const FALLBACK_PRODUCT_MAP: Record<string, Product> = {
  f1: {
    id: "f1",
    name: "Pure Cold-Pressed Mustard Oil (Kachi Ghani)",
    mrp: 420,
    discount_percentage: 20,
    price: 336,
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800",
  },
  f2: {
    id: "f2",
    name: "Heritage Wood-Pressed Mustard Oil Canister",
    mrp: 1899,
    discount_percentage: 16,
    price: 1595,
    image_url: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?auto=format&fit=crop&q=80&w=800",
  },
  f3: {
    id: "f3",
    name: "Organic Yellow Mustard Seed Oil",
    mrp: 520,
    discount_percentage: 15,
    price: 442,
    image_url: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800",
  },
  f4: {
    id: "f4",
    name: "Pure Cold-Pressed Black Sesame (Til) Oil",
    mrp: 599,
    discount_percentage: 18,
    price: 491,
    image_url: "https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&q=80&w=800",
  },
  f5: {
    id: "f5",
    name: "Traditional Wood-Pressed Groundnut (Peanut) Oil",
    mrp: 450,
    discount_percentage: 14,
    price: 387,
    image_url: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&q=80&w=800",
  },
  f6: {
    id: "f6",
    name: "FARMIK Trio Purity Gift Box",
    mrp: 1469,
    discount_percentage: 18,
    price: 1204,
    image_url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800",
  }
};

const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  
  // Promo code states
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplying, setPromoApplying] = useState(false);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isPhonePePaying, setIsPhonePePaying] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { items: hookItems, clearCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      fetchCartItems();
      fetchUserProfile();
    } else if (!authLoading && !user) {
      setLoading(false);
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
        .maybeSingle();

      if (data && !error) {
        if (data.full_name) setCustomerName(data.full_name);
        if (data.phone) setCustomerPhone(data.phone);
        if (data.address) setShippingAddress(data.address);
      }
    } catch (err) {
      console.warn("Could not prefill user profile:", err);
    }
  };

  const fetchCartItems = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch raw cart entries
      const { data: cartData, error: cartError } = await supabase
        .from('cart')
        .select('id, product_id, quantity')
        .eq('user_id', user.id);

      if (cartError) {
        console.warn("Direct cart query warning:", cartError);
      }

      const rows = cartData && cartData.length > 0 
        ? cartData 
        : hookItems.map(it => ({ id: it.id, product_id: it.product_id, quantity: it.quantity }));

      if (rows.length === 0) {
        setCartItems([]);
        setLoading(false);
        return;
      }

      // 2. Fetch corresponding product rows
      const productIds = rows.map(r => r.product_id).filter(Boolean);
      let productsMap: Record<string, any> = { ...FALLBACK_PRODUCT_MAP };

      if (productIds.length > 0) {
        try {
          const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);

          if (productsData) {
            productsData.forEach(p => {
              productsMap[p.id] = p;
            });
          }
        } catch (pErr) {
          console.warn("Could not batch load products:", pErr);
        }
      }

      // 3. Format items
      const formattedItems: CartItemWithProduct[] = rows.map(item => {
        const prod = productsMap[item.product_id] || FALLBACK_PRODUCT_MAP[item.product_id] || {
          id: item.product_id,
          name: "Pure Cold-Pressed Oil",
          price: 349,
          image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800"
        };

        const mrp = prod.mrp || prod.original_price || Math.round(Number(prod.price) * 1.25);
        const disc = prod.discount_percentage !== undefined && prod.discount_percentage !== null
          ? Number(prod.discount_percentage)
          : Math.round(((mrp - Number(prod.price)) / mrp) * 100);

        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity || 1,
          product: {
            id: prod.id,
            name: prod.name,
            price: Number(prod.price),
            image_url: prod.image_url,
            mrp,
            discount_percentage: disc,
          }
        };
      });

      setCartItems(formattedItems);

      // Re-evaluate applied promo code if items changed
      if (appliedPromo) {
        const subtotal = formattedItems.reduce((sum, it) => sum + it.product.price * it.quantity, 0);
        const res = await validatePromoCode(appliedPromo.code, subtotal);
        if (res.valid) {
          setDiscountAmount(res.discountAmount);
        } else {
          setAppliedPromo(null);
          setDiscountAmount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      // Fallback to hook items if present
      if (hookItems.length > 0) {
        setCartItems(hookItems.map(it => ({
          id: it.id,
          product_id: it.product_id,
          quantity: it.quantity,
          product: {
            id: it.product.id,
            name: it.product.name,
            price: Number(it.product.price),
            image_url: it.product.image_url,
            mrp: Math.round(Number(it.product.price) * 1.25),
            discount_percentage: 20
          }
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', cartItemId);

      setCartItems(items =>
        items.map(item =>
          item.id === cartItemId ? { ...item, quantity: newQuantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (cartItemId: string) => {
    try {
      await supabase
        .from('cart')
        .delete()
        .eq('id', cartItemId);

      setCartItems(items => items.filter(item => item.id !== cartItemId));
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Subtotal calculated from actual selling prices
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };

  // Final total after promo discount
  const calculateFinalTotal = () => {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - discountAmount);
  };

  // Handle Promo Code Application
  const handleApplyPromo = async (codeToApply?: string) => {
    const code = (codeToApply || promoInput).trim().toUpperCase();
    if (!code) {
      toast({
        title: "Enter Promo Code",
        description: "Please enter a promo code to apply.",
        variant: "destructive",
      });
      return;
    }

    setPromoApplying(true);
    try {
      const subtotal = calculateSubtotal();
      const res = await validatePromoCode(code, subtotal);

      if (res.valid && res.promo) {
        setAppliedPromo(res.promo);
        setDiscountAmount(res.discountAmount);
        setPromoInput("");
        toast({
          title: "Promo Code Applied",
          description: res.message,
        });
      } else {
        toast({
          title: "Invalid Promo Code",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error applying code",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPromoApplying(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    toast({
      title: "Promo Code Removed",
      description: "Standard pricing restored.",
    });
  };

  // WhatsApp Checkout Workflow: Saves order in database first, then opens WhatsApp
  const handleWhatsAppCheckout = async () => {
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
        description: "Please provide your delivery address before proceeding.",
        variant: "destructive",
      });
      return;
    }

    if (!customerPhone || customerPhone.trim().length === 0) {
      toast({
        title: "Phone Number Required",
        description: "Please provide your phone number for delivery coordination.",
        variant: "destructive",
      });
      return;
    }

    setIsPlacingOrder(true);

    try {
      const subtotal = calculateSubtotal().toFixed(2);
      const finalAmount = calculateFinalTotal().toFixed(2);
      const totalQty = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const finalName = customerName.trim() || user?.user_metadata?.full_name || "Customer";
      const finalPhone = customerPhone.trim() || user?.user_metadata?.phone || "Not provided";
      const finalEmail = user?.email || "Not provided";

      const orderRefFallback = `ORD-${Date.now().toString(36).toUpperCase()}`;
      let displayOrderRef = orderRefFallback;
      let createdDbOrderId: string | null = null;

      // 1. Insert order into Supabase `orders` table
      try {
        const fullShippingAddress = `${finalName} | Phone: ${finalPhone} | Address: ${shippingAddress.trim()}`;
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            total_amount: Number(finalAmount),
            shipping_address: fullShippingAddress,
            status: 'pending',
            payment_id: `wa_upi_${Date.now()}`
          })
          .select('id, created_at')
          .single();

        if (!orderError && orderData) {
          createdDbOrderId = orderData.id;
          displayOrderRef = `#ORD-${orderData.id.slice(0, 8).toUpperCase()}`;

          // 2. Insert order items if product_id is valid
          const itemsToInsert = cartItems
            .filter((it) => it.product_id && !it.product_id.startsWith('f'))
            .map((it) => ({
              order_id: orderData.id,
              product_id: it.product_id,
              quantity: it.quantity,
              price: it.product.price,
            }));

          if (itemsToInsert.length > 0) {
            try {
              await supabase.from('order_items').insert(itemsToInsert);
            } catch (itemsErr) {
              console.warn("Could not insert order_items:", itemsErr);
            }
          }
        } else if (orderError) {
          console.warn("Order table insert warning:", orderError);
        }
      } catch (dbErr) {
        console.warn("Database order saving error:", dbErr);
      }

      // 3. Update user profile details
      try {
        await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            full_name: finalName,
            phone: finalPhone,
            address: shippingAddress.trim(),
            role: 'customer'
          }, { onConflict: 'user_id' });
      } catch (pErr) {
        console.warn("Profile update warning:", pErr);
      }

      // 4. Construct WhatsApp message with Order ID and item details
      const itemsSummary = cartItems
        .map(
          (item, idx) =>
            `${idx + 1}. *${item.product.name}*\n   • Qty: ${item.quantity}\n   • Selling Price: ₹${(item.product.price * item.quantity).toFixed(2)} (₹${item.product.price.toFixed(2)} each)`
        )
        .join("\n\n");

      const promoDetails = appliedPromo
        ? `\n• *Promo Code Applied:* ${appliedPromo.code} (-₹${discountAmount.toFixed(2)})`
        : "";

      const whatsappMessage =
        `*FARMIK ORDER REQUEST*
*Order Reference:* ${displayOrderRef}
*Date:* ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}

*Customer Details:*
• *Name:* ${finalName}
• *Phone:* ${finalPhone}
• *Email:* ${finalEmail}
• *Delivery Address:* 
${shippingAddress.trim()}

*Order Items (${totalQty} ${totalQty === 1 ? 'item' : 'items'}):*
${itemsSummary}

━━━━━━━━━━━━━━━━━━━
*Items Subtotal:* ₹${subtotal}${promoDetails}
*Final Payable Total:* ₹${finalAmount}
*Payment Method:* Direct UPI on WhatsApp
*Order Status:* Pending Confirmation
━━━━━━━━━━━━━━━━━━━

*Payment:*
I have submitted this order in the system (Ref: ${displayOrderRef}). Please share your UPI QR code / UPI ID to confirm payment and dispatch my order. Thank you!`;

      const whatsappNumber = "918287317599";
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

      // 5. Clear cart in Supabase & local state
      try {
        await supabase.from('cart').delete().eq('user_id', user.id);
      } catch (cErr) {
        console.warn("Cart delete warning:", cErr);
      }
      try {
        await clearCart();
      } catch (hookErr) {
        console.warn("Hook clearCart warning:", hookErr);
      }
      setCartItems([]);

      // 6. Open WhatsApp window
      window.open(whatsappUrl, "_blank");

      toast({
        title: "Order Placed!",
        description: `Redirecting to WhatsApp to complete your order.`,
      });
    } catch (err: any) {
      console.error("WhatsApp checkout error:", err);
      toast({
        title: "Checkout Error",
        description: err.message || "Failed to process order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // PhonePe Payment Handler — calls the deployed create-phonepe-order edge function
  const handlePhonePeCheckout = async () => {
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
        description: "Please provide your delivery address before proceeding.",
        variant: "destructive",
      });
      return;
    }
    if (!customerPhone || customerPhone.trim().length === 0) {
      toast({
        title: "Phone Number Required",
        description: "Please provide your phone number for delivery coordination.",
        variant: "destructive",
      });
      return;
    }

    setIsPhonePePaying(true);

    let createdDbOrderId: string | null = null;
    const merchantOrderId = `ORD${Date.now()}`;

    try {
      const finalAmount = calculateFinalTotal();
      const finalName   = customerName.trim() || user?.user_metadata?.full_name || "Customer";
      const finalPhone  = customerPhone.trim() || user?.user_metadata?.phone || "";
      const finalEmail  = user?.email || "";
      const fullShippingAddress = `${finalName} | Phone: ${finalPhone} | Address: ${shippingAddress.trim()}`;

      // 1. Instantly record order in database with payment_status: 'unsuccessful'
      // It stays 'unsuccessful' if payment is cancelled/failed, and becomes 'success' when payment succeeds
      try {
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            user_id: user.id,
            total_amount: Number(finalAmount),
            shipping_address: fullShippingAddress,
            status: "pending",
            payment_status: "unsuccessful",
            payment_gateway: "phonepe",
            payment_id: merchantOrderId,
          })
          .select("id")
          .single();

        if (orderData && !orderError) {
          createdDbOrderId = orderData.id;
          const itemsToInsert = cartItems
            .filter((it) => it.product_id && !it.product_id.startsWith("f"))
            .map((it) => ({
              order_id: orderData.id,
              product_id: it.product_id,
              quantity: it.quantity,
              price: it.product.price,
            }));

          if (itemsToInsert.length > 0) {
            await supabase.from("order_items").insert(itemsToInsert);
          }
        }
      } catch (dbErr) {
        console.warn("[PhonePe] Instant order insert warning:", dbErr);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey     = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // PhonePe API expects amounts in PAISE (1 INR = 100 Paise).
      // Converting ₹575 -> 57500 paise so PhonePe checkout charges ₹575.00 (not ₹5.75)
      const amountInPaise = Math.round(Number(finalAmount) * 100);

      console.log("[PhonePe] Calling create-phonepe-order | amount in paise:", amountInPaise, "(₹" + finalAmount + ")");

      const res = await fetch(`${supabaseUrl}/functions/v1/create-phonepe-order`, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${accessToken || anonKey}`,
          "apikey":        anonKey,
        },
        body: JSON.stringify({
          // ── amount in paise (e.g. 57500 for ₹575) ──
          amount: amountInPaise,
          merchantOrderId: merchantOrderId,
          redirectUrl: `${window.location.origin}/payment-success?orderId=${createdDbOrderId || merchantOrderId}`,
          customer: {
            name:    finalName,
            phone:   finalPhone,
            email:   finalEmail,
            address: shippingAddress.trim(),
          },
          cartItems: cartItems.map((it) => ({
            product_id: it.product_id,
            name:       it.product.name,
            quantity:   it.quantity,
            price:      it.product.price,
          })),
          userId:        user.id,
          discountAmount,
          promoCode:     appliedPromo?.code || null,
        }),
      });

      const resText = await res.text();
      console.log("[PhonePe] create-phonepe-order status:", res.status);
      console.log("[PhonePe] create-phonepe-order response:", resText);

      if (!res.ok) {
        if (createdDbOrderId) {
          await supabase.from("orders").update({
            status: "cancelled",
            payment_status: "unsuccessful",
          }).eq("id", createdDbOrderId);
        }
        let errMsg = "Payment initiation failed. Please try again.";
        try {
          const errData = JSON.parse(resText);
          errMsg = errData.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }

      const data = JSON.parse(resText);

      // PhonePe v2 returns redirectUrl (checkout page URL)
      const checkoutUrl =
        data?.checkoutUrl ||
        data?.redirectUrl ||
        data?.data?.redirectUrl ||
        data?.data?.instrumentResponse?.redirectInfo?.url ||
        null;

      if (!checkoutUrl) {
        if (createdDbOrderId) {
          await supabase.from("orders").update({
            status: "cancelled",
            payment_status: "unsuccessful",
          }).eq("id", createdDbOrderId);
        }
        console.error("[PhonePe] No checkoutUrl in response:", resText);
        throw new Error(
          "PhonePe did not return a checkout URL. " +
          (data?.error || data?.message || "Please try again.")
        );
      }

      // Update user profile
      try {
        await supabase.from("profiles").upsert({
          user_id:   user.id,
          full_name: finalName,
          phone:     finalPhone,
          address:   shippingAddress.trim(),
          role:      "customer",
        }, { onConflict: "user_id" });
      } catch (pErr) {
        console.warn("[PhonePe] Profile update warning:", pErr);
      }

      toast({
        title: "Connecting to PhonePe...",
        description: "Redirecting to complete payment securely.",
      });

      // Redirect user to PhonePe's hosted payment page
      window.location.href = checkoutUrl;

    } catch (err: any) {
      console.error("[PhonePe] Checkout error:", err);
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPhonePePaying(false);
    }
  };


  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] pt-24 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#1A3C2A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-xs font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] pt-16 pb-20">
      {/* Header (Clean, solid & simple) */}
      <section className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/products')}
              className="text-xs text-[#1A3C2A] hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Continue Shopping
            </Button>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl sm:text-3xl font-bold text-[#1A3C2A]">
              Shopping Cart
            </h1>
            <span className="text-xs text-gray-500">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 max-w-md mx-auto p-8">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-500 text-xs mb-6">
              Browse our selection of cold-pressed oils to add items.
            </p>
            <Button 
              onClick={() => navigate("/products")} 
              className="bg-[#1A3C2A] hover:bg-[#2D5A27] text-white px-6 py-2 rounded-lg text-xs font-semibold"
            >
              Shop Oils
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-7 space-y-3">
              <h2 className="text-sm font-bold text-gray-900">Products in Cart ({cartItems.length})</h2>

              {cartItems.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  <img
                    src={item.product.image_url}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-gray-100 bg-gray-50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {item.product.name}
                    </h3>
                    
                    {/* Unit price */}
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-sm font-bold text-[#1A3C2A]">
                        ₹{item.product.price.toFixed(0)}
                      </span>
                      {item.product.mrp && item.product.mrp > item.product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          MRP ₹{item.product.mrp.toFixed(0)}
                        </span>
                      )}
                      {item.product.discount_percentage && item.product.discount_percentage > 0 && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {item.product.discount_percentage}% OFF
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mt-1">
                      Item Total: <span className="font-bold text-gray-800">₹{(item.product.price * item.quantity).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded text-gray-700 hover:bg-white"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center text-xs font-bold text-gray-800">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded text-gray-700 hover:bg-white"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 rounded"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Order Summary & Customer Details Sidebar */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Promo Code Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2.5">
                <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#2D5A27]" />
                  <span>Have a Promo Code?</span>
                </div>

                {appliedPromo ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-900 font-mono">
                        {appliedPromo.code}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        ₹{discountAmount.toFixed(2)} discount applied
                      </p>
                    </div>
                    <button
                      onClick={handleRemovePromo}
                      className="p-1 rounded text-gray-500 hover:text-red-600"
                      title="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter Promo Code (e.g. HARVEST25)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                        className="text-xs uppercase font-mono h-8"
                      />
                      <Button
                        onClick={() => handleApplyPromo()}
                        disabled={promoApplying || !promoInput.trim()}
                        className="bg-[#1A3C2A] hover:bg-[#2D5A27] text-white text-xs h-8 px-3 rounded font-semibold"
                      >
                        {promoApplying ? "..." : "Apply"}
                      </Button>
                    </div>

                    {/* Quick Promo Suggestions */}
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-gray-400">Codes:</span>
                      {["HARVEST25", "FARMIK100", "WELCOME15"].map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleApplyPromo(code)}
                          className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-[#2D5A27]" />
                  Order Summary
                </h3>

                {/* Breakdown */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-gray-900">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>

                  {appliedPromo && discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promo Discount ({appliedPromo.code})</span>
                      <span>-₹{discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span className="font-semibold text-emerald-700">FREE</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center font-bold text-gray-900">
                  <span className="text-sm">Total Payable</span>
                  <span className="text-xl text-[#1A3C2A]">₹{calculateFinalTotal().toFixed(2)}</span>
                </div>

                <Separator />

                {/* Delivery Information */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#2D5A27]" />
                    Delivery Details
                  </h4>

                  <div>
                    <Label htmlFor="customerName" className="text-xs text-gray-600">Full Name</Label>
                    <Input
                      id="customerName"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="text-xs mt-1 h-8"
                    />
                  </div>

                  <div>
                    <Label htmlFor="customerPhone" className="text-xs text-gray-600">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="text-xs mt-1 h-8"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shipping" className="text-xs text-gray-600">Delivery Address *</Label>
                    <Textarea
                      id="shipping"
                      placeholder="House No, Street, City, State, Pincode"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      rows={2}
                      className="mt-1 text-xs resize-none"
                    />
                  </div>
                </div>

                {/* PhonePe Pay Button – Green Primary CTA */}
                <Button
                  onClick={handlePhonePeCheckout}
                  disabled={isPhonePePaying || isPlacingOrder || cartItems.length === 0}
                  className="w-full bg-[#1A3C2A] hover:bg-[#235038] text-white py-3.5 h-auto text-sm font-bold rounded-xl shadow-md transition-all disabled:opacity-60 relative overflow-hidden group"
                >
                  {isPhonePePaying ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Connecting to PhonePe...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Pay with PhonePe</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-semibold text-emerald-100">UPI / Cards / NetBanking</span>
                    </div>
                  )}
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* WhatsApp Order Button */}
                <Button
                  onClick={handleWhatsAppCheckout}
                  disabled={isPlacingOrder || isPhonePePaying || cartItems.length === 0}
                  className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 h-auto text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all disabled:opacity-60"
                >
                  {isPlacingOrder ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Opening WhatsApp...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Order on WhatsApp</span>
                    </div>
                  )}
                </Button>

                <p className="text-[10px] text-gray-400 text-center">
                  🔒 100% Safe &amp; Secure Payments
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
