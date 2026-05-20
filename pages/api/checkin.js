// pages/api/checkin.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function sendCheckinNotification(staffName, staffRole, discordId, event, checkinTime, allCheckins, totalStaff) {
  const isWedding = event.event_type === "wedding";
  const webhookUrl = isWedding
    ? process.env.DISCORD_STAFF_WEBHOOK_WEDDING
    : process.env.DISCORD_STAFF_WEBHOOK_EVENT;
  if (!webhookUrl) return;

  const timeFormatted = new Date(checkinTime).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  });
  const dateFormatted = new Date(event.date).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  });

  // Mention Discord jika ada
  const mention = discordId ? `<@${discordId}>` : `**${staffName}**`;

  // Progress hadir
  const checkinCount = allCheckins.length;
  const progressBar = totalStaff > 0
    ? `${"🟩".repeat(checkinCount)}${"⬛".repeat(Math.max(0, totalStaff - checkinCount))} ${checkinCount}/${totalStaff}`
    : `${checkinCount} orang hadir`;

  // Daftar yang sudah check-in
  const checkinList = allCheckins.length > 0
    ? allCheckins.map((c, i) => `${i + 1}. ✅ **${c.staff_name}** — ${new Date(c.checked_in_at).toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit", timeZone:"Asia/Jakarta" })} WIB`).join("\n")
    : "_Belum ada_";

  const payload = {
    content: discordId
      ? `${mention} telah check-in untuk event **${event.couple}**! ✅`
      : null,
    embeds: [{
      title: isWedding
        ? `💍 Check-in Wedding: ${event.couple}`
        : `🎉 Check-in Event: ${event.couple}`,
      color: isWedding ? 0x7c3aed : 0x0ea5e9,
      description: `${mention} — **${staffRole || "Staff"}** telah hadir dan check-in.`,
      fields: [
        { name: "📅 Tanggal Event", value: dateFormatted,          inline: true },
        { name: "🕐 Waktu Check-in", value: `${timeFormatted} WIB`, inline: true },
        { name: "📍 Venue",          value: event.venue || "-",     inline: true },
        ...(event.time  ? [{ name: "🎬 Mulai",   value: event.time,  inline: true }] : []),
        ...(event.addon ? [{ name: "✨ Add On", value: event.addon, inline: false }] : []),
        {
          name: `👥 Progress Kehadiran`,
          value: progressBar,
          inline: false,
        },
        {
          name: `✅ Sudah Hadir (${checkinCount})`,
          value: checkinList.slice(0, 1000), // Discord max 1024 char per field
          inline: false,
        },
      ],
      footer: { text: `ALTION Check-in System • ${isWedding ? "Wedding" : "Event"}` },
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
      .select("id, role")
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
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
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

    // Ambil data event, staff user (untuk discord_id & role), dan semua checkin terbaru
    const [eventRes, staffUserRes, allCheckinsRes, totalStaffRes] = await Promise.all([
      supabase.from("wedding_events").select("*").eq("id", event_id).single(),
      supabase.from("staff_users").select("discord_id, jabatan, posisi").eq("id", staff_user_id).single(),
      supabase.from("staff_checkins").select("staff_name, checked_in_at").eq("event_id", event_id).order("checked_in_at", { ascending: true }),
      supabase.from("event_staff").select("id", { count: "exact" }).eq("event_id", event_id),
    ]);

    const event      = eventRes.data;
    const staffUser  = staffUserRes.data;
    const allCheckins = allCheckinsRes.data || [];
    const totalStaff  = totalStaffRes.count || 0;

    const discordId  = staffUser?.discord_id || null;
    const staffRole  = registered.role || [staffUser?.jabatan, staffUser?.posisi].filter(Boolean).join(" · ") || "Staff";

    if (event) {
      await sendCheckinNotification(staff_name.trim(), staffRole, discordId, event, checked_in_at, allCheckins, totalStaff);
    }

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
