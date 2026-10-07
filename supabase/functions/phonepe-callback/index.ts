// supabase/functions/phonepe-callback/index.ts
// PhonePe Payment Callback Handler - SURL (Success/Redirect URL)
// This runs after the user completes (or abandons) payment on PhonePe
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PHONEPE_TOKEN_URL  = "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";
const PHONEPE_STATUS_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/checkout/v2/order";

const SUPABASE_URL      = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CLIENT_ID         = Deno.env.get("PHONEPE_CLIENT_ID")!;
const CLIENT_SECRET     = Deno.env.get("PHONEPE_CLIENT_SECRET")!;
const CLIENT_VERSION    = Deno.env.get("PHONEPE_CLIENT_VERSION") || "1";
const SITE_URL          = Deno.env.get("SITE_URL") || "https://farmik.netlify.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_ROLE_KEY);

serve(async (req) => {
  const url = new URL(req.url);
  const orderId    = url.searchParams.get("orderId");
  const orderRef   = url.searchParams.get("orderRef");
  const userId     = url.searchParams.get("userId");

  console.log(`[PhonePe Callback] orderId=${orderId} orderRef=${orderRef} userId=${userId}`);
  console.log(`[PhonePe Callback] Full URL: ${req.url}`);

  // Log ALL query params from PhonePe
  const allParams: Record<string, string> = {};
  url.searchParams.forEach((v, k) => { allParams[k] = v; });
  console.log("[PhonePe Callback] All query params:", JSON.stringify(allParams));

  if (!orderId || !orderRef) {
    console.error("[PhonePe Callback] Missing orderId or orderRef in callback");
    return Response.redirect(`${SITE_URL}/cart?status=failed&reason=missing_params`, 302);
  }

  try {
    // ── Step 1: Get fresh OAuth token ──────────────────────────────────────
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
    console.log("[PhonePe Callback] Token status:", tokenRes.status, "| Body:", tokenText);

    if (!tokenRes.ok) {
      throw new Error(`Token fetch failed: ${tokenText}`);
    }

    const tokenData = JSON.parse(tokenText);
    const accessToken = tokenData.access_token;

    // ── Step 2: Check order status from PhonePe ────────────────────────────
    const statusUrl = `${PHONEPE_STATUS_URL}/${orderRef}`;
    console.log("[PhonePe Callback] Checking status at:", statusUrl);

    const statusRes = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Authorization": `O-Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const statusText = await statusRes.text();
    console.log("[PhonePe Callback] Status response:", statusRes.status, "|", statusText);

    let paymentStatus = "unknown";
    let phonepeTransactionId = "";
    let paymentSuccess = false;

    if (statusRes.ok) {
      const statusData = JSON.parse(statusText);
      console.log("[PhonePe Callback] Full status data:", JSON.stringify(statusData));

      // Handle both v1 and v2 response structures
      const state = statusData?.state || statusData?.data?.state || statusData?.status || "";
      paymentStatus = state.toLowerCase();
      phonepeTransactionId = statusData?.orderId || statusData?.data?.transactionId || "";

      console.log(`[PhonePe Callback] Payment state: ${state}`);

      if (state === "COMPLETED" || state === "SUCCESS" || state === "success") {
        paymentSuccess = true;
      }
    } else {
      console.warn("[PhonePe Callback] Status check failed, falling back to 'unknown'");
    }

    // ── Step 3: Update order in database ──────────────────────────────────
    const newStatus = paymentSuccess ? "processing" : "cancelled";
    const newPaymentStatus = paymentSuccess ? "success" : "failed";

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        payment_status: newPaymentStatus,
        phonepe_transaction_id: phonepeTransactionId,
        payment_verified_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("[PhonePe Callback] Order update error:", updateError);
    } else {
      console.log(`[PhonePe Callback] Order ${orderId} updated to ${newStatus} / ${newPaymentStatus}`);
    }

    // ── Step 4: Log payment transaction ────────────────────────────────────
    try {
      await supabase.from("payment_logs").insert({
        order_id: orderId,
        order_ref: orderRef,
        user_id: userId || null,
        gateway: "phonepe",
        payment_status: newPaymentStatus,
        phonepe_transaction_id: phonepeTransactionId,
        raw_response: statusText,
        callback_params: JSON.stringify(allParams),
        created_at: new Date().toISOString(),
      });
      console.log("[PhonePe Callback] Payment log saved.");
    } catch (logErr) {
      console.warn("[PhonePe Callback] Could not save payment log:", logErr);
    }

    // ── Step 5: Clear cart if successful ───────────────────────────────────
    if (paymentSuccess && userId) {
      try {
        await supabase.from("cart").delete().eq("user_id", userId);
        console.log(`[PhonePe Callback] Cart cleared for user ${userId}`);
      } catch (cartErr) {
        console.warn("[PhonePe Callback] Could not clear cart:", cartErr);
      }
    }

    // ── Step 6: Redirect to frontend ──────────────────────────────────────
    const redirectPath = paymentSuccess
      ? `/payment-success?orderId=${orderId}&orderRef=${orderRef}&amount=${encodeURIComponent("")}`
      : `/payment-failed?orderId=${orderId}&orderRef=${orderRef}&reason=${paymentStatus}`;

    console.log(`[PhonePe Callback] Redirecting to: ${SITE_URL}${redirectPath}`);
    return Response.redirect(`${SITE_URL}${redirectPath}`, 302);

  } catch (err) {
    console.error("[PhonePe Callback] Fatal error:", err);
    return Response.redirect(`${SITE_URL}/cart?status=failed&reason=callback_error`, 302);
  }
});
