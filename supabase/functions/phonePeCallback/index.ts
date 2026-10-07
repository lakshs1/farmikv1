// supabase/functions/phonePeCallback/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // Service role key bypasses RLS
);

serve(async (req) => {
  try {
    const rawBody = await req.text();
    console.log("PHONEPE CALLBACK RAW BODY:", rawBody);

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      console.log("Non-JSON body received in callback:", rawBody);
    }

    if (!parsed.response) {
      console.error("No response field in callback payload");
      return new Response("OK", { status: 200 });
    }

    const decoded = JSON.parse(atob(parsed.response));
    console.log("DECODED PHONEPE CALLBACK:", decoded);

    const status = decoded.code; // 'PAYMENT_SUCCESS', 'PAYMENT_ERROR', 'PAYMENT_DECLINED', etc.
    const txnid = decoded.data?.merchantTransactionId || decoded.data?.merchantOrderId;

    if (!txnid) {
      console.error("No merchant transaction/order id found in callback:", decoded);
      return new Response("OK", { status: 200 });
    }

    console.log(`Processing callback for txnid: ${txnid} | status: ${status}`);

    // Look up order in database using payment_id (NOT txnid column)
    let { data: order, error: orderLookupErr } = await supabase
      .from("orders")
      .select("id, user_id, payment_status, status")
      .eq("payment_id", txnid)
      .maybeSingle();

    // Fallback: try by UUID id if payment_id didn't match
    if (!order) {
      const { data: fallbackOrder } = await supabase
        .from("orders")
        .select("id, user_id, payment_status, status")
        .eq("id", txnid)
        .maybeSingle();
      order = fallbackOrder;
    }

    if (!order) {
      console.error("Order not found in database for txnid:", txnid, "Lookup error:", orderLookupErr);
      return new Response("OK", { status: 200 });
    }

    console.log(`Found order ${order.id} for user ${order.user_id} (current payment_status: ${order.payment_status})`);

    if (status === "PAYMENT_SUCCESS") {
      // 1. Update order to paid & success
      const { error: updateErr } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payment_status: "success",
        })
        .eq("id", order.id);

      if (updateErr) {
        console.error("Error updating order to paid:", updateErr);
      } else {
        console.log(`Order ${order.id} marked as PAID and SUCCESS!`);
      }

      // 2. Clear cart for the user
      if (order.user_id) {
        const { error: cartErr } = await supabase
          .from("cart")
          .delete()
          .eq("user_id", order.user_id);

        if (cartErr) {
          console.error("Error clearing cart for user:", order.user_id, cartErr);
        } else {
          console.log(`Cart cleared for user ${order.user_id}`);
        }
      }
    } else {
      // Payment failed or cancelled
      await supabase
        .from("orders")
        .update({
          status: "cancelled",
          payment_status: "unsuccessful",
        })
        .eq("id", order.id);

      console.log(`Order ${order.id} marked as CANCELLED / UNSUCCESSFUL`);
    }

    return new Response("OK", { status: 200 });

  } catch (err: any) {
    console.error("Callback processing error:", err);
    return new Response("ERROR", { status: 500 });
  }
});
