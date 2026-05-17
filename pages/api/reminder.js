import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DISCORD_WEBHOOK_URL = process.env.DISCORD_REMINDER_WEBHOOK_URL;

export default async function handler(req, res) {
  // Keamanan — allow Vercel Cron internal calls atau manual dengan secret
  const isVercelCron = req.headers["x-vercel-cron"] === "1";
  const isAuthorized = req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`;
  if (!isVercelCron && !isAuthorized) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Hitung tanggal H-2 dalam WIB (UTC+7)
  const nowUTC = new Date();
  const nowWIB = new Date(nowUTC.getTime() + 7 * 60 * 60 * 1000);
  const target = new Date(nowWIB);
  target.setDate(target.getDate() + 2);
  // Format manual agar tidak terpengaruh timezone server
  const yyyy = target.getUTCFullYear();
  const mm   = String(target.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(target.getUTCDate()).padStart(2, "0");
  const targetDate = `${yyyy}-${mm}-${dd}`;

  // Cari event yang tanggalnya H-2
  const { data: events, error } = await supabase
    .from("wedding_events")
    .select("*")
    .eq("date", targetDate);

  if (error) return res.status(500).json({ error: error.message });
  if (!events || events.length === 0) {
    return res.status(200).json({ message: "Tidak ada event H-2", date: targetDate });
  }

  // Kirim notif per event
  for (const event of events) {
    // Ambil daftar staff event ini
    const { data: staffList } = await supabase
      .from("event_staff")
      .select("*")
      .eq("event_id", event.id)
      .order("joined_at", { ascending: true });

    const dateFormatted = new Date(event.date).toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      timeZone: "Asia/Jakarta",
    });

    const eventLabel = `${event.event_type === "wedding" ? "💍" : "🎉"} ${event.couple}`;

    const memberList = staffList && staffList.length > 0
      ? staffList.map((s, i) => `${i + 1}. **${s.name}** — ${s.role}`).join("\n")
      : "_Belum ada staff terdaftar_";

    const payload = {
      content: `@everyone 🔔 **REMINDER — Besok lusa ada event!**`,
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
    message: `Reminder terkirim untuk ${events.length} event`,
    date: targetDate,
  });
}
