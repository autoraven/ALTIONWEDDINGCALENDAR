import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DISCORD_WEBHOOK_URL = process.env.DISCORD_REMINDER_WEBHOOK_URL;

// Hitung tanggal WIB dari offset hari
function getWIBDate(offsetDays = 0) {
  const nowUTC = new Date();
  const nowWIB = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);
  const target = new Date(nowWIB);
  target.setDate(target.getDate() + offsetDays);
  const yyyy = target.getUTCFullYear();
  const mm   = String(target.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(target.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Cari event yang aktif pada tanggal tertentu
async function getEventsOnDate(dateStr) {
  const { data: events, error } = await supabase
    .from("wedding_events")
    .select("*")
    .lte("date", dateStr)
    .or(`date_end.gte.${dateStr},date_end.is.null`);
  if (error) return [];
  return (events || []).filter(e => {
    const end = e.date_end || e.date;
    return dateStr >= e.date && dateStr <= end;
  });
}

// Build dan kirim satu pesan reminder ke Discord
async function sendReminder(event, type, discordMap) {
  // type: "h2" | "hari-h"
  const { data: staffList } = await supabase
    .from("event_staff")
    .select("*")
    .eq("event_id", event.id)
    .order("joined_at", { ascending: true });

  const isMultiDay = event.date_end && event.date_end !== event.date;
  const dateFormatted = isMultiDay
    ? `${new Date(event.date).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric", timeZone:"Asia/Jakarta" })} — ${new Date(event.date_end).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric", timeZone:"Asia/Jakarta" })}`
    : new Date(event.date).toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric", timeZone:"Asia/Jakarta" });

  const eventLabel = `${event.event_type === "wedding" ? "💍" : "🎉"} ${event.couple}`;

  // Daftar staff + Discord mention
  let mentionParts = [];
  const memberList = staffList && staffList.length > 0
    ? staffList.map((s, i) => {
        const discordId = discordMap[s.name.toLowerCase().trim()];
        const mention = discordId ? ` <@${discordId}>` : "";
        if (discordId) mentionParts.push(`<@${discordId}>`);
        return `${i + 1}. **${s.name}**${mention} — ${s.role}`;
      }).join("\n")
    : "_Belum ada staff terdaftar_";

  const mentionLine = mentionParts.length > 0
    ? `${mentionParts.join(" ")} 👇`
    : "";

  // Bedakan konten & warna berdasarkan tipe
  const isHariH = type === "hari-h";
  const embedColor  = isHariH ? 0x10b981 : 0xf59e0b;
  const embedTitle  = isHariH
    ? `🟢 HARI H — Event Dimulai Hari Ini: ${eventLabel}`
    : `⏰ H-2 — Event 2 Hari Lagi: ${eventLabel}`;
  const description = isHariH
    ? `**Event berlangsung HARI INI!** Pastikan semua tim sudah siap dan hadir tepat waktu. ✅`
    : `Event ini akan berlangsung **2 hari lagi**. Pastikan semua persiapan sudah siap!`;
  const contentLine = isHariH
    ? `🚨 **HARI H — Event dimulai hari ini!**\n${mentionLine || "@everyone harap bersiap!"}`
    : `🔔 **REMINDER H-2 — Besok lusa ada event!**\n${mentionLine || "@everyone cek jadwal kalian!"}`;

  const payload = {
    content: contentLine,
    embeds: [{
      title: embedTitle,
      color: embedColor,
      description,
      fields: [
        { name: "📅 Tanggal",  value: dateFormatted,       inline: true },
        { name: "🏛️ Venue",   value: event.venue || "-",  inline: true },
        { name: "🕐 Waktu",   value: event.time  || "-",  inline: true },
        ...(event.addon ? [{ name: "✨ Add On",    value: event.addon, inline: false }] : []),
        ...(event.notes ? [{ name: "📝 Catatan",   value: event.notes, inline: false }] : []),
        {
          name: `👥 Daftar Staff (${staffList?.length || 0} orang)`,
          value: memberList,
          inline: false,
        },
      ],
      footer: { text: `ALTION Reminder System • ${isHariH ? "Hari H" : "H-2"} • WIB` },
      timestamp: new Date().toISOString(),
    }],
  };

  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export default async function handler(req, res) {
  const isVercelCron = req.headers["x-vercel-cron"] === "1";
  const isAuthorized = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  const isGetTest    = req.method === "GET";
  if (!isVercelCron && !isAuthorized && !isGetTest) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Tanggal hari ini dan H-2 dalam WIB
  const todayDate = getWIBDate(0);
  const h2Date    = getWIBDate(2);

  // Cek apakah cron ini untuk Hari H (jam 01:00 UTC = 08:00 WIB) atau H-2 (jam 04:55 UTC = 11:55 WIB)
  // Tapi kita jalankan KEDUANYA dalam satu request supaya satu endpoint bisa dipakai untuk test juga
  const [todayEvents, h2Events] = await Promise.all([
    getEventsOnDate(todayDate),
    getEventsOnDate(h2Date),
  ]);

  const totalEvents = todayEvents.length + h2Events.length;
  if (totalEvents === 0) {
    return res.status(200).json({
      message: "Tidak ada event hari ini maupun H-2",
      today: todayDate,
      h2: h2Date,
    });
  }

  // Discord map: nama → discord_id
  const { data: staffUsers } = await supabase
    .from("staff_users")
    .select("name, discord_id")
    .not("discord_id", "is", null);

  const discordMap = {};
  (staffUsers || []).forEach(u => {
    if (u.discord_id?.trim()) {
      discordMap[u.name.toLowerCase().trim()] = u.discord_id.trim();
    }
  });

  const results = { "hari-h": [], "h-2": [] };

  // Kirim reminder Hari H
  for (const event of todayEvents) {
    await sendReminder(event, "hari-h", discordMap);
    results["hari-h"].push(event.couple);
  }

  // Kirim reminder H-2
  for (const event of h2Events) {
    await sendReminder(event, "h2", discordMap);
    results["h-2"].push(event.couple);
  }

  return res.status(200).json({
    message: `Reminder terkirim: ${todayEvents.length} hari H, ${h2Events.length} H-2`,
    today: todayDate,
    h2: h2Date,
    results,
  });
}
