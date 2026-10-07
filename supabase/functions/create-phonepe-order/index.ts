// supabase/functions/create-phonepe-order/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = await req.json();

    // ENV variables
    const CLIENT_ID = Deno.env.get("PHONEPE_CLIENT_ID") || "SU2511241311088259847758";
    const CLIENT_SECRET = Deno.env.get("PHONEPE_CLIENT_SECRET") || "72bb3d80-035f-495f-85e5-0655772132db";
    const CLIENT_VERSION = Deno.env.get("PHONEPE_CLIENT_VERSION") || "1";
    const CALLBACK_URL = "https://liolbsrurnunulzlpprk.supabase.co/functions/v1/phonePeCallback";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ─────────────────────────────────────────────────────────────
    // Helper: Get OAuth Token from PhonePe
    // ─────────────────────────────────────────────────────────────
    async function getOAuthToken() {
      const form = new URLSearchParams();
      form.append("client_id", CLIENT_ID);
      form.append("client_version", CLIENT_VERSION);
      form.append("client_secret", CLIENT_SECRET);
      form.append("grant_type", "client_credentials");

      const authResp = await fetch(
        "https://api.phonepe.com/apis/identity-manager/v1/oauth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        }
      );

      const auth = await authResp.json();
      return auth?.access_token || null;
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION: Check Payment Status directly from PhonePe API
    // ─────────────────────────────────────────────────────────────
    if (body.action === "check_status") {
      const { merchantOrderId } = body;
      if (!merchantOrderId) {
        return new Response(JSON.stringify({ error: "merchantOrderId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const token = await getOAuthToken();
      if (!token) {
        return new Response(JSON.stringify({ error: "OAuth failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const statusResp = await fetch(
        `https://api.phonepe.com/apis/pg/checkout/v2/order/${merchantOrderId}/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `O-Bearer ${token}`,
          },
        }
      );

      const statusData = await statusResp.json();
      console.log(`[Status Check] Order ${merchantOrderId}:`, statusData);

      const state = statusData?.state || statusData?.data?.state || statusData?.code;
      const isSuccess = state === "COMPLETED" || state === "PAYMENT_SUCCESS" || statusData?.code === "PAYMENT_SUCCESS";

      // Look up order in database
      const { data: order } = await supabase
        .from("orders")
        .select("id, user_id, payment_status")
        .eq("payment_id", merchantOrderId)
        .maybeSingle();

      if (order) {
        if (isSuccess) {
          await supabase.from("orders").update({
            status: "paid",
            payment_status: "success",
          }).eq("id", order.id);

          if (order.user_id) {
            await supabase.from("cart").delete().eq("user_id", order.user_id);
          }
        } else if (state === "FAILED" || state === "DECLINED" || state === "CANCELLED" || state === "TIMED_OUT") {
          await supabase.from("orders").update({
            status: "cancelled",
            payment_status: "unsuccessful",
          }).eq("id", order.id);
        }
      }

      return new Response(JSON.stringify({
        isSuccess,
        state,
        statusData,
        orderId: order?.id || null,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // ACTION: Create PhonePe Order
    // ─────────────────────────────────────────────────────────────
    const {
      amount,
      customer,
      merchantOrderId: incomingOrderId,
      redirectUrl: incomingRedirectUrl,
    } = body;

    if (!amount) {
      return new Response(JSON.stringify({ error: "amount required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await getOAuthToken();
    if (!token) {
      return new Response(JSON.stringify({ error: "OAuth failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use matching merchantOrderId
    const merchantOrderId = incomingOrderId || ("ORD" + Date.now());

    // Redirect user back to cart page with query parameter for toast handling
    const redirectUrl = incomingRedirectUrl || `https://myfarmik.com/cart?phonepe_order_id=${merchantOrderId}`;

    const payBody = {
      merchantOrderId,
      amount, // Amount in Paise
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
