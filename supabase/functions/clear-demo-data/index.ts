import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const chunk = <T>(arr: T[], size: number) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Only admins can run this
    const { data: isAdmin, error: isAdminErr } = await admin.rpc("is_admin", { _user_id: userData.user.id });
    if (isAdminErr || !isAdmin) {
      return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect demo user ids from auth
    const demoUserIds: string[] = [];
    let page = 1;
    const perPage = 1000;

    // listUsers is paginated
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;
      const users = data?.users ?? [];
      for (const u of users) {
        if (!u.email) continue;
        if (u.email.toLowerCase().endsWith("@demo.com")) demoUserIds.push(u.id);
      }
      if (users.length < perPage) break;
      page += 1;
    }

    if (demoUserIds.length === 0) {
      return new Response(JSON.stringify({ success: true, deleted: { users: 0 } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Profile ids
    const [{ data: buyerProfiles }, { data: courierProfiles }, { data: adminProfiles }] = await Promise.all([
      admin.from("buyer_profiles").select("id, user_id").in("user_id", demoUserIds),
      admin.from("courier_profiles").select("id, user_id").in("user_id", demoUserIds),
      admin.from("admin_profiles").select("id, user_id").in("user_id", demoUserIds),
    ]);

    const buyerIds = (buyerProfiles ?? []).map((p) => p.id);
    const courierIds = (courierProfiles ?? []).map((p) => p.id);
    const adminProfileIds = (adminProfiles ?? []).map((p) => p.id);

    // Orders linked to demo buyers/couriers
    let orderIds: string[] = [];
    if (buyerIds.length || courierIds.length) {
      const orParts: string[] = [];
      if (buyerIds.length) orParts.push(`buyer_id.in.(${buyerIds.join(",")})`);
      if (courierIds.length) orParts.push(`courier_id.in.(${courierIds.join(",")})`);

      const { data: orders } = await admin
        .from("orders")
        .select("id")
        .or(orParts.join(","));

      orderIds = (orders ?? []).map((o) => o.id);
    }

    const deleted = {
      users: demoUserIds.length,
      buyer_profiles: buyerIds.length,
      courier_profiles: courierIds.length,
      admin_profiles: adminProfileIds.length,
      orders: orderIds.length,
      payment_confirmations: 0,
      delivery_proofs: 0,
      order_items: 0,
      order_addresses: 0,
      order_status_history: 0,
      payout_requests: 0,
      referral_commissions: 0,
      user_roles: 0,
    };

    // Delete order-related data
    for (const ids of chunk(orderIds, 500)) {
      if (!ids.length) continue;

      const [{ count: pc }, { count: dp }, { count: osh }, { count: oi }, { count: oa }] = await Promise.all([
        admin.from("payment_confirmations").delete({ count: "exact" }).in("order_id", ids),
        admin.from("delivery_proofs").delete({ count: "exact" }).in("order_id", ids),
        admin.from("order_status_history").delete({ count: "exact" }).in("order_id", ids),
        admin.from("order_items").delete({ count: "exact" }).in("order_id", ids),
        admin.from("order_addresses").delete({ count: "exact" }).in("order_id", ids),
      ]);

      deleted.payment_confirmations += pc ?? 0;
      deleted.delivery_proofs += dp ?? 0;
      deleted.order_status_history += osh ?? 0;
      deleted.order_items += oi ?? 0;
      deleted.order_addresses += oa ?? 0;

      await admin.from("orders").delete().in("id", ids);
    }

    // Delete buyer related tables
    if (buyerIds.length) {
      const [{ count: pr }, { count: rc1 }, { count: rc2 }] = await Promise.all([
        admin.from("payout_requests").delete({ count: "exact" }).in("buyer_id", buyerIds),
        admin.from("referral_commissions").delete({ count: "exact" }).in("buyer_id", buyerIds),
        admin.from("referral_commissions").delete({ count: "exact" }).in("referrer_id", buyerIds),
      ]);
      deleted.payout_requests = pr ?? 0;
      deleted.referral_commissions = (rc1 ?? 0) + (rc2 ?? 0);
      await admin.from("buyer_profiles").delete().in("id", buyerIds);
    }

    if (courierIds.length) {
      await admin.from("courier_profiles").delete().in("id", courierIds);
    }

    if (adminProfileIds.length) {
      await admin.from("admin_profiles").delete().in("id", adminProfileIds);
    }

    // Keep user_roles and auth users intact so they can be re-seeded
    // Just reset profiles data instead of deleting accounts

    return new Response(JSON.stringify({ success: true, deleted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("clear-demo-data error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
