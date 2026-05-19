import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DISCORD_WEBHOOK_URL = process.env.DISCORD_REMINDER_WEBHOOK_URL;

export default async function handler(req, res) {
  const isVercelCron = req.headers["x-vercel-cron"] === "1";
  const isAuthorized = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  const isGetTest = req.method === "GET";
  if (!isVercelCron && !isAuthorized && !isGetTest) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Hitung tanggal H-2 dalam WIB (UTC+7)
  const nowUTC = new Date();
  const nowWIB = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);
  const target = new Date(nowWIB);
  target.setDate(target.getDate() + 2);
  const yyyy = target.getUTCFullYear();
  const mm   = String(target.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(target.getUTCDate()).padStart(2, "0");
  const targetDate = `${yyyy}-${mm}-${dd}`;

  // Cari event H-2
  const { data: events, error } = await supabase
    .from("wedding_events")
    .select("*")
    .lte("date", targetDate)
    .or(`date_end.gte.${targetDate},date_end.is.null`);

  if (error) return res.status(500).json({ error: error.message });

  const matchedEvents = (events || []).filter(e => {
    const end = e.date_end || e.date;
    return targetDate >= e.date && targetDate <= end;
  });

  if (matchedEvents.length === 0) {
    return res.status(200).json({ message: "Tidak ada event H-2", date: targetDate });
  }

  // Ambil semua staff_users untuk mapping nama → discord_id
  const { data: staffUsers } = await supabase
    .from("staff_users")
    .select("name, discord_id")
    .not("discord_id", "is", null);

  // Buat map: nama (lowercase) → discord_id
  const discordMap = {};
  (staffUsers || []).forEach(u => {
    if (u.discord_id?.trim()) {
      discordMap[u.name.toLowerCase().trim()] = u.discord_id.trim();
    }
  });

  for (const event of matchedEvents) {
    const { data: staffList } = await supabase
      .from("event_staff")
      .select("*")
      .eq("event_id", event.id)
      .order("joined_at", { ascending: true });

    const isMultiDay = event.date_end && event.date_end !== event.date;
    const dateFormatted = isMultiDay
      ? `${new Date(event.date).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"})} — ${new Date(event.date_end).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"})}`
      : new Date(event.date).toLocaleDateString("id-ID", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          timeZone: "Asia/Jakarta",
        });

    const eventLabel = `${event.event_type === "wedding" ? "💍" : "🎉"} ${event.couple}`;

    // Buat daftar staff dengan mention Discord jika ada
    let mentionParts = []; // untuk @mention di atas embed
    const memberList = staffList && staffList.length > 0
      ? staffList.map((s, i) => {
          const discordId = discordMap[s.name.toLowerCase().trim()];
          const mention = discordId ? ` <@${discordId}>` : "";
          if (discordId) mentionParts.push(`<@${discordId}>`);
          return `${i + 1}. **${s.name}**${mention} — ${s.role}`;
        }).join("\n")
      : "_Belum ada staff terdaftar_";

    // Baris mention di atas embed (semua yang punya discord)
    const mentionLine = mentionParts.length > 0
      ? `${mentionParts.join(" ")} — cek jadwal kalian! 👇`
      : "";

    const payload = {
      content: mentionLine
        ? `🔔 **REMINDER — Besok lusa ada event!**\n${mentionLine}`
        : `@everyone 🔔 **REMINDER — Besok lusa ada event!**`,
      embeds: [{
        title: `⏰ H-2 Event: ${eventLabel}`,
        color: 0xf59e0b,
        description: `Event ini akan berlangsung **2 hari lagi**. Pastikan semua persiapan sudah siap!`,
        fields: [
          { name: "📅 Tanggal", value: dateFormatted, inline: true },
          { name: "🏛️ Venue",  value: event.venue || "-", inline: true },
          { name: "🕐 Waktu",  value: event.time  || "-", inline: true },
          ...(event.addon ? [{ name: "✨ Add On", value: event.addon, inline: false }] : []),
          ...(event.notes ? [{ name: "📝 Catatan", value: event.notes, inline: false }] : []),
          {
            name: `👥 Daftar Staff (${staffList?.length || 0} orang)`,
            value: memberList,
            inline: false,
          },
        ],
        footer: { text: `ALTION Reminder System • WIB` },
        timestamp: new Date().toISOString(),
      }],
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  return res.status(200).json({
    message: `Reminder terkirim untuk ${matchedEvents.length} event`,
    date: targetDate,
  });
}
