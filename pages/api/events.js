import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

async function sendDiscordNotification(event, action = "add") {
  if (!DISCORD_WEBHOOK_URL) return;

  const isAdd = action === "add";
  const isWedding = event.event_type === "wedding";
  const dateFormatted = new Date(event.date).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const payload = {
    content: isAdd
      ? `@here Ada booking ${isWedding ? "wedding 💍" : "event 🎉"} baru!`
      : "@here Satu event telah dihapus.",
    embeds: [{
      title: isAdd
        ? (isWedding ? "💍 Wedding Baru Ditambahkan!" : "🎉 Event Baru Ditambahkan!")
        : "🗑️ Event Dihapus",
      color: isAdd ? (isWedding ? 0x1a8fff : 0x0fb87a) : 0xe53e3e,
      fields: [
        { name: isWedding ? "👫 Pasangan" : "📌 Nama Event", value: event.couple || "-", inline: true },
        { name: "📅 Tanggal", value: dateFormatted, inline: true },
        { name: "🏛️ Venue",  value: event.venue || "-", inline: true },
        { name: "🕐 Waktu",  value: event.time  || "-", inline: true },
        ...(event.addon ? [{ name: "✨ Add On", value: event.addon }] : []),
        ...(event.notes ? [{ name: "📝 Catatan", value: event.notes }] : []),
      ],
      footer: { text: "ALTION Event Calendar" },
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
    console.error("Discord notification failed:", err);
  }
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("wedding_events")
      .select("*")
      .order("date", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === "POST") {
    const { couple, venue, time, notes, addon, date, event_type, max_staff } = req.body;
    if (!couple || !date) return res.status(400).json({ error: "Nama dan tanggal wajib diisi" });

    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const created_at = wib.toISOString().replace("Z", "+07:00");

    const { data, error } = await supabase
      .from("wedding_events")
      .insert([{ couple, venue, time, notes, addon, date, event_type, created_at, max_staff: max_staff ? parseInt(max_staff) : null }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    await sendDiscordNotification(data, "add");
    return res.status(201).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    const { data: eventData } = await supabase
      .from("wedding_events").select("*").eq("id", id).single();

    const { error } = await supabase
      .from("wedding_events").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    if (eventData) await sendDiscordNotification(eventData, "delete");
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
