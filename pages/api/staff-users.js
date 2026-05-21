import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("staff_users")
      .select("id, name, username, jabatan, posisi, discord_id, is_active, is_admin, created_at")
      .order("name", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { name, username, password, jabatan, posisi, discord_id, is_admin } = req.body;
    if (!name?.trim() || !username?.trim() || !password?.trim())
      return res.status(400).json({ error: "Nama, username, dan password wajib diisi" });

    const { data: existing } = await supabase
      .from("staff_users").select("id").eq("username", username.trim().toLowerCase()).single();
    if (existing) return res.status(409).json({ error: "Username sudah digunakan" });

    const { data, error } = await supabase
      .from("staff_users")
      .insert([{
        name: name.trim(),
        username: username.trim().toLowerCase(),
        password: password.trim(),
        jabatan: jabatan?.trim() || "",
        posisi: posisi?.trim() || "",
        discord_id: discord_id?.trim() || null,
        is_active: true,
        is_admin: is_admin === true,
      }])
      .select("id, name, username, jabatan, posisi, discord_id, is_active, is_admin, created_at")
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === "PUT") {
    const { id } = req.query;
    const { name, username, password, jabatan, posisi, discord_id, is_active, is_admin } = req.body;
    if (!id) return res.status(400).json({ error: "ID wajib diisi" });

    if (username) {
      const { data: existing } = await supabase
        .from("staff_users").select("id").eq("username", username.trim().toLowerCase()).neq("id", id).single();
      if (existing) return res.status(409).json({ error: "Username sudah digunakan" });
    }

    const updateData = {};
    if (name !== undefined)     updateData.name       = name.trim();
    if (username !== undefined) updateData.username   = username.trim().toLowerCase();
    if (password !== undefined && password.trim()) updateData.password = password.trim();
    if (jabatan !== undefined)  updateData.jabatan    = jabatan.trim();
    if (posisi !== undefined)   updateData.posisi     = posisi.trim();
    if (discord_id !== undefined) updateData.discord_id = discord_id?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (is_admin !== undefined)  updateData.is_admin  = is_admin;

    const { data, error } = await supabase
      .from("staff_users")
      .update(updateData).eq("id", id)
      .select("id, name, username, jabatan, posisi, discord_id, is_active, is_admin, created_at")
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID wajib diisi" });
    const { error } = await supabase.from("staff_users").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
