// supabase/functions/create-phonepe-order/index.ts
// PhonePe Payment Gateway — Create Order (SANDBOX / UAT)
// ─────────────────────────────────────────────────────────────────────────────
// Flow:
//   1. Validate inputs from Cart
//   2. Create a pending order row in DB (so we have an orderId before redirect)
//   3. Insert order_items
//   4. Fetch PhonePe OAuth token (sandbox)
//   5. Call PhonePe checkout/v2/pay (sandbox)
//   6. Return { checkoutUrl, orderId, merchantOrderId } to frontend
//
// SURL (redirectUrl):  phonePeCallback?type=redirect&orderId=…&merchantOrderId=…
// S2S Webhook:         phonePeCallback  (PhonePe hits this directly as POST)
// ─────────────────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Sandbox URLs ──────────────────────────────────────────────────────────────
const PHONEPE_TOKEN_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const PHONEPE_PAY_URL   = "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/pay";

// ── Env vars (set in Supabase Dashboard → Edge Functions → Secrets) ───────────
const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID         = Deno.env.get("PHONEPE_CLIENT_ID") || "SU2511241311088259847758";
const CLIENT_SECRET     = Deno.env.get("PHONEPE_CLIENT_SECRET") || "72bb3d80-035f-495f-85e5-0655772132db";
const CLIENT_VERSION    = Deno.env.get("PHONEPE_CLIENT_VERSION") || "1";
const SITE_URL          = Deno.env.get("SITE_URL") || "https://farmik.netlify.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      amount,           // Final amount in INR (rupees)
      customer,         // { name, phone, email, address }
      cartItems,        // [{ product_id, name, quantity, price }]
      userId,
      discountAmount,
      promoCode,
    } = body;

    if (!amount) {
      return new Response(JSON.stringify({ error: "amount required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalName    = customer?.name    || "Customer";
    const finalPhone   = customer?.phone   || "";
    const finalEmail   = customer?.email   || "";
    const finalAddress = customer?.address || "";

    // ── 1. Create pending order in DB ─────────────────────────────────────────
    const merchantOrderId = "FMKPE" + Date.now();
    const fullAddress     = `${finalName} | Phone: ${finalPhone} | ${finalAddress}`;

    console.log(`[create-phonepe-order] Creating DB order: ${merchantOrderId}`);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id:         userId || null,
        total_amount:    Number(amount),
        shipping_address: fullAddress,
        status:          "pending",
        payment_id:      merchantOrderId,   // ← stores the merchantOrderId
        payment_gateway: "phonepe",
        payment_status:  "initiated",
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("[create-phonepe-order] Order insert error:", orderError);
      // Continue even if DB insert fails — don't block payment
    }

    const dbOrderId = orderData?.id || null;
    console.log(`[create-phonepe-order] DB orderId: ${dbOrderId}`);

    // ── 2. Insert order items ─────────────────────────────────────────────────
    if (dbOrderId && cartItems && cartItems.length > 0) {
      const validItems = cartItems.filter(
        (it: any) => it.product_id && !String(it.product_id).startsWith("f")
      );
      if (validItems.length > 0) {
        const { error: itemsErr } = await supabase.from("order_items").insert(
          validItems.map((it: any) => ({
            order_id:   dbOrderId,
            product_id: it.product_id,
            quantity:   it.quantity,
            price:      it.price,
          }))
        );
        if (itemsErr) console.warn("[create-phonepe-order] order_items warn:", itemsErr);
        else console.log(`[create-phonepe-order] Inserted ${validItems.length} order items`);
      }
    }

    // ── 3. Fetch PhonePe OAuth Token (SANDBOX) ────────────────────────────────
    console.log("[create-phonepe-order] Fetching PhonePe sandbox OAuth token...");
    const form = new URLSearchParams();
    form.append("client_id",      CLIENT_ID);
    form.append("client_version", CLIENT_VERSION);
    form.append("client_secret",  CLIENT_SECRET);
    form.append("grant_type",     "client_credentials");

    const authResp = await fetch(PHONEPE_TOKEN_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    form.toString(),
    });

    const authText = await authResp.text();
    console.log("[create-phonepe-order] Token status:", authResp.status, "| Body:", authText);

    const auth = JSON.parse(authText);

    if (!auth?.access_token) {
      // Mark order as failed
      if (dbOrderId) {
        await supabase.from("orders").update({
          payment_status: "auth_failed",
          status:         "cancelled",
        }).eq("id", dbOrderId);
      }
      return new Response(JSON.stringify({ error: "PhonePe OAuth failed", details: auth }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = auth.access_token;

    // ── 4. Call PhonePe checkout/v2/pay (SANDBOX) ─────────────────────────────
    // SURL: phonePeCallback with type=redirect so it can verify & redirect user
    const surlBase    = `${SUPABASE_URL}/functions/v1/phonePeCallback`;
    const redirectUrl = `${surlBase}?type=redirect&orderId=${dbOrderId || ""}&merchantOrderId=${merchantOrderId}&userId=${userId || ""}`;

    const amountInPaisa = Math.round(Number(amount) * 100);

    const payBody = {
      merchantOrderId,
      amount: amountInPaisa,
      expireAfter: 1800,
      metaInfo: {
        udf1: dbOrderId  || "",
        udf2: finalPhone  || "",
        udf3: finalEmail  || "",
        udf4: JSON.stringify(customer || {}),
      },
      paymentFlow: {
        type:    "PG_CHECKOUT",
        message: "Payment for FARMIK order",
        merchantUrls: {
          redirectUrl,   // ← SURL: user lands here after paying
        },
      },
    };

    console.log("[create-phonepe-order] Initiating payment:", JSON.stringify(payBody));

    const payResp = await fetch(PHONEPE_PAY_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `O-Bearer ${token}`,
      },
      body: JSON.stringify(payBody),
    });

    const payText = await payResp.text();
    console.log("[create-phonepe-order] Pay status:", payResp.status, "| Body:", payText);

    const payData = JSON.parse(payText);

    if (!payResp.ok) {
      if (dbOrderId) {
        await supabase.from("orders").update({
          payment_status: "initiation_failed",
          status:         "cancelled",
        }).eq("id", dbOrderId);
      }
      return new Response(
        JSON.stringify({ error: "PhonePe payment initiation failed", details: payData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 5. Extract checkout URL ───────────────────────────────────────────────
    const checkoutUrl =
      payData?.redirectUrl ||
      payData?.data?.redirectUrl ||
      payData?.data?.instrumentResponse?.redirectInfo?.url ||
      payData?.data?.payPageUrl ||
      null;

    if (!checkoutUrl) {
      console.error("[create-phonepe-order] No checkoutUrl in response:", payText);
      if (dbOrderId) {
        await supabase.from("orders").update({
          payment_status: "no_checkout_url",
          status:         "cancelled",
        }).eq("id", dbOrderId);
      }
      return new Response(
        JSON.stringify({ error: "No checkout URL from PhonePe", raw: payText }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update order with phonepe's internal orderId
    const phonepeOrderId = payData?.orderId || payData?.data?.transactionId || "";
    if (dbOrderId) {
      await supabase.from("orders").update({
        payment_status:   "awaiting_payment",
        phonepe_order_id: phonepeOrderId,
      }).eq("id", dbOrderId);
    }

    // ── 6. Log to payment_logs ────────────────────────────────────────────────
    try {
      await supabase.from("payment_logs").insert({
        order_id:               dbOrderId,
        order_ref:              merchantOrderId,
        user_id:                userId || null,
        gateway:                "phonepe",
        payment_status:         "initiated",
        phonepe_transaction_id: phonepeOrderId,
        raw_response:           payText,
        callback_params:        JSON.stringify({ type: "initiation" }),
      });
    } catch (logErr) {
      console.warn("[create-phonepe-order] payment_logs insert warn:", logErr);
    }

    console.log(`[create-phonepe-order] ✅ checkoutUrl: ${checkoutUrl}`);

    return new Response(
      JSON.stringify({
        success:          true,
        checkoutUrl,
        orderId:          dbOrderId,
        merchantOrderId,
        phonepeOrderId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("[create-phonepe-order] Fatal:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
