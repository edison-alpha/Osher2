import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DemoUser {
  email: string;
  password: string;
  role: "super_admin" | "admin_gudang" | "admin_keuangan" | "courier" | "buyer";
  full_name: string;
  phone?: string;
  nik?: string;
  vehicle_type?: string;
  vehicle_plate?: string;
}

const demoUsers: DemoUser[] = [
  { email: "admin@demo.com", password: "demo123456", role: "super_admin", full_name: "Admin Demo", phone: "081234567890" },
  { 
    email: "kurir1@demo.com", 
    password: "demo123456", 
    role: "courier", 
    full_name: "Budi Santoso", 
    phone: "081298765432",
    vehicle_type: "Motor",
    vehicle_plate: "B 1234 XYZ"
  },
  { 
    email: "kurir2@demo.com", 
    password: "demo123456", 
    role: "courier", 
    full_name: "Andi Wijaya", 
    phone: "081387654321",
    vehicle_type: "Motor",
    vehicle_plate: "B 5678 ABC"
  },
  { email: "buyer1@demo.com", password: "demo123456", role: "buyer", full_name: "Siti Nurhaliza", phone: "081234567893", nik: "3201010101010001" },
  { email: "buyer2@demo.com", password: "demo123456", role: "buyer", full_name: "Ahmad Dahlan", phone: "081234567894", nik: "3201010101010002" },
  { email: "buyer3@demo.com", password: "demo123456", role: "buyer", full_name: "Dewi Lestari", phone: "081234567895", nik: "3201010101010003" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results: { email: string; status: string; userId?: string; error?: string }[] = [];

    for (const user of demoUsers) {
      try {
        // Check if user already exists
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === user.email);

        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
          results.push({ email: user.email, status: "exists", userId });
        } else {
          // Create new user
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
          });

          if (authError) {
            results.push({ email: user.email, status: "error", error: authError.message });
            continue;
          }

          userId = authData.user.id;
          results.push({ email: user.email, status: "created", userId });
        }

        // Check if role exists
        const { data: existingRole } = await supabaseAdmin
          .from("user_roles")
          .select("id")
          .eq("user_id", userId)
          .eq("role", user.role)
          .single();

        if (!existingRole) {
          await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: user.role });
        }

        // Create profile based on role
        if (user.role === "super_admin" || user.role === "admin_gudang" || user.role === "admin_keuangan") {
          const { data: existingProfile } = await supabaseAdmin
            .from("admin_profiles")
            .select("id")
            .eq("user_id", userId)
            .single();

          if (!existingProfile) {
            await supabaseAdmin.from("admin_profiles").insert({
              user_id: userId,
              full_name: user.full_name,
              phone: user.phone,
            });
          }
        } else if (user.role === "courier") {
          const { data: existingProfile } = await supabaseAdmin
            .from("courier_profiles")
            .select("id")
            .eq("user_id", userId)
            .single();

          if (!existingProfile) {
            await supabaseAdmin.from("courier_profiles").insert({
              user_id: userId,
              full_name: user.full_name,
              phone: user.phone || "000000000000",
              vehicle_type: user.vehicle_type || "Motor",
              vehicle_plate: user.vehicle_plate || "B " + Math.floor(1000 + Math.random() * 9000) + " ABC",
              is_active: true,
            });
          } else {
            // Update existing courier profile with real data
            await supabaseAdmin
              .from("courier_profiles")
              .update({
                full_name: user.full_name,
                phone: user.phone || "000000000000",
                vehicle_type: user.vehicle_type || "Motor",
                vehicle_plate: user.vehicle_plate || "B " + Math.floor(1000 + Math.random() * 9000) + " ABC",
                is_active: true,
              })
              .eq("user_id", userId);
          }
        } else if (user.role === "buyer") {
          const { data: existingProfile } = await supabaseAdmin
            .from("buyer_profiles")
            .select("id")
            .eq("user_id", userId)
            .single();

          if (!existingProfile) {
            // Get first domicile
            const { data: domiciles } = await supabaseAdmin.from("domiciles").select("id").limit(1);
            const domicileId = domiciles?.[0]?.id || null;

            // Get first bank
            const { data: banks } = await supabaseAdmin.from("banks").select("id").limit(1);
            const bankId = banks?.[0]?.id || null;

            await supabaseAdmin.from("buyer_profiles").insert({
              user_id: userId,
              full_name: user.full_name,
              phone: user.phone,
              nik: user.nik || "0000000000000000",
              domicile_id: domicileId,
              bank_id: bankId,
              is_verified: true,
            });
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        results.push({ email: user.email, status: "error", error: String(userError) });
      }
    }

    console.log("Seed results:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Seed error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
