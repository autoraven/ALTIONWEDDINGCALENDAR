// pages/api/checkin.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DISCORD_WEBHOOK = process.env.DISCORD_STAFF_WEBHOOK_WEDDING || process.env.DISCORD_STAFF_WEBHOOK_EVENT;

async function sendCheckinNotification(staffName, event, checkinTime) {
  const webhookUrl = event.event_type === "wedding"
    ? process.env.DISCORD_STAFF_WEBHOOK_WEDDING
    : process.env.DISCORD_STAFF_WEBHOOK_EVENT;
  if (!webhookUrl) return;

  const timeFormatted = new Date(checkinTime).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta"
  });
  const dateFormatted = new Date(event.date).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });

  const payload = {
    embeds: [{
      title: `✅ Check-in: ${staffName}`,
      description: `**${staffName}** telah check-in untuk event **${event.couple}**`,
      color: 0x10b981,
      fields: [
        { name: "📅 Tanggal Event", value: dateFormatted, inline: true },
        { name: "🕐 Waktu Check-in", value: `${timeFormatted} WIB`, inline: true },
        { name: "📍 Venue", value: event.venue || "-", inline: true },
      ],
      footer: { text: "ALTION Check-in System" },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Discord checkin notification failed:", err);
  }
}

export default async function handler(req, res) {

  // GET — ambil semua check-in (bisa filter by event_id atau staff_user_id)
  if (req.method === "GET") {
    const { event_id, staff_user_id } = req.query;
    let query = supabase
      .from("staff_checkins")
      .select("*")
      .order("checked_in_at", { ascending: false });

    if (event_id)      query = query.eq("event_id", event_id);
    if (staff_user_id) query = query.eq("staff_user_id", staff_user_id);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — staff check-in ke event
  if (req.method === "POST") {
    const { event_id, staff_user_id, staff_name, note } = req.body;

    if (!event_id || !staff_user_id || !staff_name?.trim())
      return res.status(400).json({ error: "event_id, staff_user_id, dan staff_name wajib diisi" });

    // Pastikan staff sudah terdaftar di event ini
    const { data: registered } = await supabase
      .from("event_staff")
      .select("id")
      .eq("event_id", event_id)
      .ilike("name", staff_name.trim())
      .single();

    if (!registered)
      return res.status(403).json({ error: "Kamu belum terdaftar di event ini. Daftar terlebih dahulu." });

    // Cek sudah check-in belum
    const { data: already } = await supabase
      .from("staff_checkins")
      .select("id, checked_in_at")
      .eq("event_id", event_id)
      .eq("staff_user_id", staff_user_id)
      .single();

    if (already) {
      const timeStr = new Date(already.checked_in_at).toLocaleTimeString("id-ID", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta"
      });
      return res.status(409).json({ error: `Kamu sudah check-in pukul ${timeStr} WIB`, alreadyCheckedIn: true });
    }

    // Waktu WIB
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const checked_in_at = wib.toISOString().replace("Z", "+07:00");

    const { data, error } = await supabase
      .from("staff_checkins")
      .insert([{
        event_id,
        staff_user_id,
        staff_name: staff_name.trim(),
        checked_in_at,
        note: note?.trim() || null,
      }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Kirim notif Discord
    const { data: event } = await supabase
      .from("wedding_events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (event) await sendCheckinNotification(staff_name.trim(), event, checked_in_at);

    return res.status(201).json(data);
  }

  // DELETE — batalkan check-in (admin only)
  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID wajib diisi" });

    const { error } = await supabase.from("staff_checkins").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
