import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ success: false, message: "Username dan password wajib diisi" });

  const { data: user, error } = await supabase
    .from("staff_users")
    .select("*")
    .eq("username", username.trim().toLowerCase())
    .eq("is_active", true)
    .single();

  if (error || !user)
    return res.status(401).json({ success: false, message: "Username atau password salah" });

  if (user.password !== password)
    return res.status(401).json({ success: false, message: "Username atau password salah" });

  return res.status(200).json({
    success: true,
    user: {
      id:       user.id,
      name:     user.name,
      username: user.username,
      jabatan:  user.jabatan,
      posisi:   user.posisi,
      is_admin: user.is_admin === true,
    },
  });
}
