// supabase/functions/send-order-email/index.ts
// Triggered on INSERT into public.orders table via Supabase Database Webhook
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
    const payload = await req.json();
    console.log("Database Webhook Payload received:", JSON.stringify(payload));

    // Supabase Webhooks pass: { type: 'INSERT', table: 'orders', schema: 'public', record: { ... } }
    const order = payload.record || payload;

    if (!order || !order.id) {
      return new Response(JSON.stringify({ error: "No order record provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch order items for this order
    const { data: items } = await supabase
      .from("order_items")
      .select("quantity, price, product_id, products(name, image_url)")
      .eq("order_id", order.id);

    // 2. Fetch customer profile info if user_id exists
    let customerName = "Customer";
    let customerEmail = "";
    let customerPhone = "";

    if (order.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", order.user_id)
        .maybeSingle();

      if (profile?.full_name) customerName = profile.full_name;
      if (profile?.phone) customerPhone = profile.phone;

      const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
      if (userData?.user?.email) customerEmail = userData.user.email;
    }

    // 3. Format items HTML table
    const itemsListHtml = (items && items.length > 0)
      ? items.map((it: any) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 0; color: #111827; font-weight: 500;">
            ${it.products?.name || "Product"}
          </td>
          <td style="padding: 10px 0; text-align: center; color: #4b5563;">
            ${it.quantity}
          </td>
          <td style="padding: 10px 0; text-align: right; color: #111827; font-weight: 600;">
            ₹${(Number(it.price) * Number(it.quantity)).toFixed(2)}
          </td>
        </tr>
      `).join("")
      : `<tr><td colspan="3" style="padding: 10px 0; color: #6b7280;">Order details logged in dashboard</td></tr>`;

    // Configurable email settings (stored in Supabase Dashboard -> Edge Functions -> Secrets)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
    const ADMIN_NOTIFICATION_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "priyanshmalik332@gmail.com";
    const SENDER_EMAIL = Deno.env.get("SENDER_EMAIL") || "FARMIK Orders <orders@myfarmik.com>";

    const shortRef = `#ORD-${order.id.slice(0, 8).toUpperCase()}`;

    // 4. Construct Email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb; }
          .header { background: #1A3C2A; padding: 24px; text-align: center; color: #ffffff; }
          .content { padding: 24px; color: #374151; line-height: 1.6; }
          .card { background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #e5e7eb; }
          .badge { display: inline-block; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: bold; }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-paid { background: #d1fae5; color: #065f46; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px; letter-spacing: 0.5px;">🌱 FARMIK</h1>
            <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">New Order Notification</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1A3C2A; margin-top: 0;">New Order Placed!</h2>
            <p>A new order <strong>${shortRef}</strong> has been created in your system.</p>

            <div class="card">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Order ID:</td>
                  <td style="padding: 4px 0; font-weight: bold; font-family: monospace;">${order.id}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Total Amount:</td>
                  <td style="padding: 4px 0; font-weight: bold; color: #1A3C2A; font-size: 16px;">₹${Number(order.total_amount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Payment Method:</td>
                  <td style="padding: 4px 0; font-weight: 500; text-transform: uppercase;">${order.payment_gateway || (order.payment_id?.startsWith("wa_") ? "WhatsApp UPI" : "Online")}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Payment Status:</td>
                  <td style="padding: 4px 0;">
                    <span class="badge ${order.status === 'paid' || order.payment_status === 'success' ? 'badge-paid' : 'badge-pending'}">
                      ${order.payment_status || order.status || 'pending'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Customer:</td>
                  <td style="padding: 4px 0;">${customerName} ${customerPhone ? `(${customerPhone})` : ''}</td>
                </tr>
                ${customerEmail ? `
                <tr>
                  <td style="padding: 4px 0; color: #6b7280;">Email:</td>
                  <td style="padding: 4px 0;">${customerEmail}</td>
                </tr>` : ''}
              </table>
            </div>

            <div class="card">
              <h4 style="margin: 0 0 10px 0; color: #111827; font-size: 14px;">Shipping Address</h4>
              <p style="margin: 0; font-size: 13px; color: #4b5563; white-space: pre-line;">${order.shipping_address || 'Not provided'}</p>
            </div>

            <h4 style="margin: 20px 0 10px 0; color: #111827;">Order Items</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 12px; text-transform: uppercase;">
                  <th style="padding: 8px 0; text-align: left;">Item</th>
                  <th style="padding: 8px 0; text-align: center;">Qty</th>
                  <th style="padding: 8px 0; text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${itemsListHtml}
              </tbody>
            </table>

            <div style="margin-top: 30px; text-align: center;">
              <a href="https://myfarmik.com/admin/dashboard" style="background: #1A3C2A; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                View in Admin Dashboard →
              </a>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
            © ${new Date().getFullYear()} FARMIK. Automated notification system.
          </div>
        </div>
      </body>
      </html>
    `;

    // 5. Send via Resend API
    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [ADMIN_NOTIFICATION_EMAIL],
        subject: `🌱 New FARMIK Order: ${shortRef} (₹${Number(order.total_amount || 0).toFixed(2)})`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResp.text();
    console.log("Resend API response:", resendResp.status, resendData);

    return new Response(
      JSON.stringify({ success: true, resendStatus: resendResp.status, details: resendData }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Order email error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
