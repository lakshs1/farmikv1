// supabase/functions/create-phonepe-order/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      amount,
      customer,
      merchantOrderId: incomingOrderId,
      redirectUrl: incomingRedirectUrl,
    } = await req.json();

    if (!amount) {
      return new Response(JSON.stringify({ error: "amount required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ENV variables
    const CLIENT_ID = Deno.env.get("PHONEPE_CLIENT_ID") || "SU2511241311088259847758";
    const CLIENT_SECRET = Deno.env.get("PHONEPE_CLIENT_SECRET") || "72bb3d80-035f-495f-85e5-0655772132db";
    const CLIENT_VERSION = Deno.env.get("PHONEPE_CLIENT_VERSION") || "1";
    const CALLBACK_URL = "https://liolbsrurnunulzlpprk.supabase.co/functions/v1/phonePeCallback";

    // -----------------------------
    // 1️⃣ Request OAUTH TOKEN
    // -----------------------------
    const form = new URLSearchParams();
    form.append("client_id", CLIENT_ID);
    form.append("client_version", CLIENT_VERSION);
    form.append("client_secret", CLIENT_SECRET);
    form.append("grant_type", "client_credentials");

    const authResp = await fetch(
      "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      }
    );

    const auth = await authResp.json();
    console.log("AUTH RESPONSE:", auth);

    if (!auth?.access_token) {
      return new Response(JSON.stringify({ error: "OAuth failed", auth }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = auth.access_token;

    // -----------------------------
    // 2️⃣ Create Checkout Order
    // -----------------------------
    // Use the merchantOrderId from the database / frontend so it matches in callback
    const merchantOrderId = incomingOrderId || ("ORD" + Date.now());

    // Redirect user to the success page after payment completion
    const redirectUrl = incomingRedirectUrl || `https://myfarmik.com/payment-success?orderId=${merchantOrderId}`;

    const payBody = {
      merchantOrderId,
      amount, // Amount in Paise (e.g. 57500 for ₹575)
      metaInfo: {
        udf1: JSON.stringify(customer || {}),
        udf2: merchantOrderId,
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Order payment on FARMIK",
        merchantUrls: {
          redirectUrl: redirectUrl,
          callbackUrl: CALLBACK_URL,
        },
      },
    };

    const payResp = await fetch(
      "https://api.phonepe.com/apis/pg/checkout/v2/pay",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `O-Bearer ${token}`,
        },
        body: JSON.stringify(payBody),
      }
    );

    const payData = await payResp.json();
    console.log("PAY RESPONSE:", payData);

    return new Response(JSON.stringify({ ...payData, merchantOrderId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("ERROR:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
