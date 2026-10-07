import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // IMPORTANT
);

serve(async (req) => {
  try {
    const rawBody = await req.text();
    console.log("RAW BODY:", rawBody);

    let parsed: any = {};
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      // If query parameters or urlencoded form
      parsed = {};
    }

    if (!parsed.response) {
      console.error("No response field");
      return new Response("OK", { status: 200 });
    }

    const decoded = JSON.parse(atob(parsed.response));
    console.log("DECODED:", decoded);

    const status = decoded.code;
    const txnid = decoded.data?.merchantTransactionId || decoded.data?.merchantOrderId;

    if (!txnid) {
      console.error("No txnid");
      return new Response("OK", { status: 200 });
    }

    // Try finding order by payment_id or txnid or id
    let { data: order } = await supabase
      .from("orders")
      .select("id, user_id, payment_status")
      .eq("payment_id", txnid)
      .maybeSingle();

    if (!order) {
      const { data: fallbackOrder } = await supabase
        .from("orders")
        .select("id, user_id, payment_status")
        .eq("id", txnid)
        .maybeSingle();
      order = fallbackOrder;
    }

    if (!order) {
      console.error("Order not found for txnid:", txnid);
      return new Response("OK", { status: 200 });
    }

    if (order.payment_status === "success") {
      return new Response("OK", { status: 200 });
    }

    if (status === "PAYMENT_SUCCESS") {
      await supabase.from("orders").update({
        status: "paid",
        payment_status: "success",
      }).eq("id", order.id);

      await supabase.from("cart")
        .delete()
        .eq("user_id", order.user_id);
    } else {
      // Mark as unsuccessful if cancelled or failed
      await supabase.from("orders").update({
        payment_status: "unsuccessful",
        status: "cancelled",
      }).eq("id", order.id);
    }

    return new Response("OK", { status: 200 });

  } catch (err: any) {
    console.error("Callback error:", err);
    return new Response("ERROR", { status: 500 });
  }
});
