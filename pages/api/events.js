import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // pakai service role di server-side
);

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Kirim notifikasi Discord dengan @here
async function sendDiscordNotification(event, action = "add") {
  if (!DISCORD_WEBHOOK_URL) return;

  const isAdd = action === "add";
  const emoji = isAdd ? "💍" : "🗑️";
  const color = isAdd ? 0x0fb87a : 0xe53e3e; // hijau / merah
  const title = isAdd
    ? `${emoji} Wedding Baru Ditambahkan!`
    : `${emoji} Wedding Dihapus`;

  const dateFormatted = new Date(event.date).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const payload = {
    content: isAdd ? "@here Ada booking wedding baru! 🎉" : "@here Wedding telah dihapus.",
    embeds: [
      {
        title,
        color,
        fields: [
          { name: "👫 Pasangan", value: event.couple || "-", inline: true },
          { name: "📅 Tanggal", value: dateFormatted, inline: true },
          { name: "🏛️ Venue", value: event.venue || "-", inline: true },
          { name: "🕐 Waktu", value: event.time || "-", inline: true },
          ...(event.notes ? [{ name: "📝 Catatan", value: event.notes }] : []),
        ],
        footer: { text: "ALTION Wedding Calendar" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Discord notification failed:", err);
  }
}

export default async function handler(req, res) {
  // GET - ambil semua events
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("wedding_events")
      .select("*")
      .order("date", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST - tambah event baru
  if (req.method === "POST") {
    const { couple, venue, time, notes, date } = req.body;

    if (!couple || !date) {
      return res.status(400).json({ error: "Nama pasangan dan tanggal wajib diisi" });
    }

    const { data, error } = await supabase
      .from("wedding_events")
      .insert([{ couple, venue, time, notes, date }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // Kirim notif Discord (non-blocking)
    sendDiscordNotification(data, "add");

    return res.status(201).json(data);
  }

  // DELETE - hapus event
  if (req.method === "DELETE") {
    const { id } = req.query;

    // Ambil data event dulu untuk notif Discord
    const { data: eventData } = await supabase
      .from("wedding_events")
      .select("*")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("wedding_events")
      .delete()
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    // Kirim notif Discord (non-blocking)
    if (eventData) sendDiscordNotification(eventData, "delete");

    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
