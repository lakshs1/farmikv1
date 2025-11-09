// supabase/functions/payuSuccess/index.ts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import SHA512 from "https://esm.sh/crypto-js@4.1.1/sha512.js";
import encHex from "https://esm.sh/crypto-js@4.1.1/enc-hex.js";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
const handler = async (req)=>{
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());
    const { txnid, amount, productinfo, firstname, email, status, hash, mihpayid } = data;
    // ✅ Recalculate hash to verify authenticity
    const PAYU_KEY = Deno.env.get("PAYU_KEY");
    const PAYU_SALT = Deno.env.get("PAYU_SALT");
    const hashSeq = `${PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY}`;
    const calculatedHash = SHA512(hashSeq).toString(encHex);
    if (calculatedHash !== hash) {
      return new Response("Invalid hash, possible tampering", {
        status: 400
      });
    }
    if (status === "success") {
      // ✅ Insert into orders table
      const { error } = await supabase.from("orders").insert({
        transaction_id: txnid,
        payu_id: mihpayid,
        amount,
        product_info: productinfo,
        customer_name: firstname,
        customer_email: email,
        payment_status: "success"
      });
      if (error) throw error;
    }
    // ✅ Redirect user back to frontend success page
    return Response.redirect("https://farmik.netlify.app/cart?status=success", 302);
  } catch (err) {
    console.error("PayU Success Handler Error:", err);
    return Response.redirect("https://farmik.netlify.app/cart?status=failed", 302);
  }
};
serve(handler);
