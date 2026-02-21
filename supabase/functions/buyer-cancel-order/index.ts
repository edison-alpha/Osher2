import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type JsonBody = {
  orderId?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authHeader = req.headers.get("Authorization") ?? "";

    const authed = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await authed.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as JsonBody;
    const orderId = body.orderId;

    if (!orderId) {
      return new Response(JSON.stringify({ success: false, error: "orderId wajib diisi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Get buyer profile
    const { data: buyerProfile, error: buyerErr } = await admin
      .from("buyer_profiles")
      .select("id")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (buyerErr || !buyerProfile) {
      return new Response(JSON.stringify({ success: false, error: "Profil buyer tidak ditemukan" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load order and validate ownership + state
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, status, buyer_id")
      .eq("id", orderId)
      .eq("buyer_id", buyerProfile.id)
      .maybeSingle();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ success: false, error: "Pesanan tidak ditemukan" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status !== "new" && order.status !== "waiting_payment") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Pesanan tidak dapat dibatalkan pada status saat ini",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Block cancellation if payment proof already exists
    const { data: payment, error: payErr } = await admin
      .from("payment_confirmations")
      .select("id")
      .eq("order_id", orderId)
      .limit(1);

    if (payErr) {
      return new Response(JSON.stringify({ success: false, error: "Gagal mengecek pembayaran" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payment && payment.length > 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Pesanan tidak bisa dibatalkan karena sudah ada bukti pembayaran",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const nowIso = new Date().toISOString();

    const { data: updated, error: updErr } = await admin
      .from("orders")
      .update({ status: "cancelled", cancelled_at: nowIso })
      .eq("id", orderId)
      .select("id, order_number, status, cancelled_at")
      .maybeSingle();

    if (updErr || !updated) {
      return new Response(JSON.stringify({ success: false, error: "Gagal membatalkan pesanan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, order: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("buyer-cancel-order error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
