import { ADMIN_CREDENTIALS } from "../../lib/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { username, password } = req.body;

  // 1. Cek main admin account (tidak bisa dihapus)
  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    return res.status(200).json({ success: true, token: "admin-authenticated" });
  }

  // 2. Cek staff users yang punya is_admin = true
  const { data: staffAdmin } = await supabase
    .from("staff_users")
    .select("id, username, password, is_active, is_admin")
    .eq("username", username.trim().toLowerCase())
    .eq("is_admin", true)
    .eq("is_active", true)
    .single();

  if (staffAdmin && staffAdmin.password === password) {
    return res.status(200).json({ success: true, token: "admin-authenticated" });
  }

  return res.status(401).json({ success: false, message: "Username atau password salah" });
}
