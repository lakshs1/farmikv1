// supabase/functions/phonepe-initiate/index.ts
// PhonePe Payment Gateway - Initiate Payment (Sandbox / UAT)
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PHONEPE_TOKEN_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const PHONEPE_PAY_URL   = "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID         = Deno.env.get("PHONEPE_CLIENT_ID")!;
const CLIENT_SECRET     = Deno.env.get("PHONEPE_CLIENT_SECRET")!;
const CLIENT_VERSION    = Deno.env.get("PHONEPE_CLIENT_VERSION") || "1";
const SITE_URL          = Deno.env.get("SITE_URL") || "https://farmik.netlify.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      amount,
      customerName,
      customerPhone,
      customerEmail,
      shippingAddress,
      cartItems,
      userId,
    } = body;

    if (!amount || !userId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Create a pending order in DB
    const orderRef = `FMKPE-${Date.now().toString(36).toUpperCase()}`;
    const fullAddress = `${customerName} | Phone: ${customerPhone} | ${shippingAddress}`;

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        total_amount: Number(amount),
        shipping_address: fullAddress,
        status: "pending",
        payment_id: orderRef,
        payment_gateway: "phonepe",
        payment_status: "initiated",
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      throw new Error("Failed to create order: " + orderError.message);
    }

    const orderId = orderData.id;
    console.log(`[PhonePe] Order created: ${orderId} | Ref: ${orderRef}`);

    // Insert order items
    if (cartItems && cartItems.length > 0) {
      const validItems = cartItems.filter(
        (it) => it.product_id && !it.product_id.startsWith("f")
      );
      if (validItems.length > 0) {
        const { error: itemsError } = await supabase.from("order_items").insert(
          validItems.map((it) => ({
            order_id: orderId,
            product_id: it.product_id,
            quantity: it.quantity,
            price: it.price,
          }))
        );
        if (itemsError) console.warn("order_items insert warn:", itemsError);
      }
    }

    // 2. Get PhonePe OAuth Token
    console.log("[PhonePe] Fetching OAuth token...");
    const tokenParams = new URLSearchParams({
      client_id:      CLIENT_ID,
      client_secret:  CLIENT_SECRET,
      client_version: CLIENT_VERSION,
      grant_type:     "client_credentials",
    });

    const tokenRes = await fetch(PHONEPE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    const tokenText = await tokenRes.text();
    console.log("[PhonePe] Token response status:", tokenRes.status);
    console.log("[PhonePe] Token response body:", tokenText);

    if (!tokenRes.ok) {
      await supabase.from("orders").update({
        payment_status: "auth_failed",
        status: "cancelled",
      }).eq("id", orderId);
      throw new Error(`PhonePe token fetch failed (${tokenRes.status}): ${tokenText}`);
    }

    const tokenData = JSON.parse(tokenText);
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      throw new Error("No access_token in PhonePe response: " + tokenText);
    }

    // 3. Initiate Payment
    const callbackUrl = `${SUPABASE_URL}/functions/v1/phonepe-callback?orderId=${orderId}&orderRef=${orderRef}&userId=${userId}`;
    const amountInPaisa = Math.round(Number(amount) * 100);

    const payPayload = {
      merchantOrderId: orderRef,
      amount: amountInPaisa,
      expireAfter: 1800,
      metaInfo: {
        udf1: orderId,
        udf2: customerPhone || "",
        udf3: customerEmail || "",
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Payment for FARMIK order",
        merchantUrls: {
          redirectUrl: callbackUrl,
        },
      },
    };

    console.log("[PhonePe] Initiating payment:", JSON.stringify(payPayload));

    const payRes = await fetch(PHONEPE_PAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `O-Bearer ${accessToken}`,
      },
      body: JSON.stringify(payPayload),
    });

    const payText = await payRes.text();
    console.log("[PhonePe] Pay response status:", payRes.status);
    console.log("[PhonePe] Pay response body:", payText);

    if (!payRes.ok) {
      await supabase.from("orders").update({
        payment_status: "initiation_failed",
        status: "cancelled",
      }).eq("id", orderId);
      throw new Error(`PhonePe pay initiation failed (${payRes.status}): ${payText}`);
    }

    const payData = JSON.parse(payText);

    // Extract checkout URL (PhonePe v2 structure)
    const checkoutUrl =
      payData?.redirectUrl ||
      payData?.data?.redirectUrl ||
      payData?.data?.instrumentResponse?.redirectInfo?.url ||
      payData?.data?.payPageUrl ||
      null;

    if (!checkoutUrl) {
      throw new Error("No checkout URL in PhonePe response: " + payText);
    }

    const phonepeOrderId = payData?.orderId || payData?.data?.merchantTransactionId || "";
    await supabase.from("orders").update({
      payment_status: "awaiting_payment",
      phonepe_order_id: phonepeOrderId,
    }).eq("id", orderId);

    console.log(`[PhonePe] Checkout URL: ${checkoutUrl}`);

    return new Response(
      JSON.stringify({ success: true, checkoutUrl, orderId, orderRef, phonepeOrderId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[PhonePe] Initiate error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
