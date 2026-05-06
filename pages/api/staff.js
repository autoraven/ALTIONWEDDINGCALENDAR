import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DISCORD_WEBHOOK_URL = process.env.DISCORD_STAFF_WEBHOOK_URL;

async function sendDiscordNotification(type, staff, event, allStaff) {
  if (!DISCORD_WEBHOOK_URL) return;

  const isJoin = type === "join";
  const dateFormatted = new Date(event.date).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // Format full member list
  const memberList = allStaff.length > 0
    ? allStaff.map((s, i) => `${i + 1}. **${s.name}** — ${s.role}`).join("\n")
    : "_Belum ada staff_";

  const eventLabel = `${event.event_type === "wedding" ? "💍" : "🎉"} ${event.couple}`;

  const payload = {
    embeds: [{
      title: isJoin
        ? `${staff.name} masuk event`
        : `${staff.name} keluar dari event`,
      description: isJoin
        ? `**${staff.name}** (${staff.role || "Staff"}) telah bergabung ke **${eventLabel}**`
        : `**${staff.name}** (${staff.role || "Staff"}) telah keluar dari **${eventLabel}**`,
      color: isJoin ? 0x10b981 : 0xef4444,
      fields: [
        { name: "📅 Tanggal", value: dateFormatted, inline: true },
        { name: "🏛️ Venue",  value: event.venue || "-", inline: true },
        {
          name: `👥 Daftar Staff (${allStaff.length} orang)`,
          value: memberList,
          inline: false,
        },
      ],
      footer: { text: "ALTION Staff System" },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Discord staff notification failed:", err);
  }
}

export default async function handler(req, res) {

  // GET — ambil semua staff untuk event tertentu atau semua
  if (req.method === "GET") {
    const { event_id } = req.query;
    let query = supabase.from("event_staff").select("*").order("joined_at", { ascending: true });
    if (event_id) query = query.eq("event_id", event_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — staff join event
  if (req.method === "POST") {
    const { event_id, name, role } = req.body;
    if (!event_id || !name?.trim()) return res.status(400).json({ error: "Event dan nama wajib diisi" });

    // Cek duplikat
    const { data: existing } = await supabase
      .from("event_staff")
      .select("id")
      .eq("event_id", event_id)
      .ilike("name", name.trim())
      .single();
    if (existing) return res.status(409).json({ error: "Nama ini sudah terdaftar di event ini" });

    // Ambil data event untuk notif
    const { data: event } = await supabase
      .from("wedding_events")
      .select("*")
      .eq("id", event_id)
      .single();

    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const joined_at = wib.toISOString().replace("Z", "+07:00");

    const { data, error } = await supabase
      .from("event_staff")
      .insert([{ event_id, name: name.trim(), role: role?.trim() || "Staff", joined_at }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    if (event) {
      // Ambil full list staff terbaru untuk event ini
      const { data: allStaff } = await supabase
        .from("event_staff")
        .select("*")
        .eq("event_id", event_id)
        .order("joined_at", { ascending: true });
      await sendDiscordNotification("join", data, event, allStaff || []);
    }
    return res.status(201).json(data);
  }

  // DELETE — staff keluar event
  if (req.method === "DELETE") {
    const { id } = req.query;

    const { data: staffData } = await supabase
      .from("event_staff").select("*, wedding_events(*)").eq("id", id).single();

    const { error } = await supabase.from("event_staff").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    if (staffData) {
      const event = staffData.wedding_events;
      // Ambil sisa staff setelah delete
      const { data: allStaff } = await supabase
        .from("event_staff")
        .select("*")
        .eq("event_id", staffData.event_id)
        .order("joined_at", { ascending: true });
      await sendDiscordNotification("leave", staffData, event || {}, allStaff || []);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
