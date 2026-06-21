import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const BANNER_GIF_URL = `https://altioneventcalendar.vercel.app/bannerwebhook.gif?v=${Date.now()}`;

function formatDateID(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

async function sendDiscordNotification(event, action = "add") {
  if (!DISCORD_WEBHOOK_URL) return;
  const isAdd  = action === "add";
  const isEdit = action === "edit";
  const isWedding = event.event_type === "wedding";

  const tanggal = event.date_end && event.date_end !== event.date
    ? `${formatDateID(event.date)} — ${formatDateID(event.date_end)}`
    : formatDateID(event.date);

  const title = isAdd
    ? (isWedding ? "💍 Wedding Baru Ditambahkan!" : "🎉 Event Baru Ditambahkan!")
    : isEdit
    ? (isWedding ? "✏️ Detail Wedding Diperbarui" : "✏️ Detail Event Diperbarui")
    : (isWedding ? "🗑️ Wedding Dihapus" : "🗑️ Event Dihapus");

  const color = isAdd ? (isWedding ? 0x1a8fff : 0x0fb87a) : isEdit ? 0xf59e0b : 0xe53e3e;

  const content = isAdd
    ? "@here Event baru telah ditambahkan ke kalender."
    : isEdit
    ? "Detail event telah diperbarui."
    : "Sebuah event telah dihapus dari kalender.";

  const payload = {
    content,
    embeds: [{
      title,
      color,
      image: {
        url: BANNER_GIF_URL,
      },
      fields: [
        { name: isWedding ? "👫 Pasangan" : "📌 Nama Event", value: event.couple || "-", inline: true },
        { name: "📅 Tanggal", value: tanggal, inline: true },
        { name: "🏛️ Venue",  value: event.venue || "-", inline: true },
        { name: "🕐 Waktu",  value: event.time  || "-", inline: true },
        ...(event.max_staff ? [{ name: "👥 Maks. Staff", value: `${event.max_staff} orang`, inline: true }] : []),
        ...(event.addon ? [{ name: "✨ Add On", value: event.addon }] : []),
        ...(event.notes ? [{ name: "📝 Catatan", value: event.notes }] : []),
        { name: "🔗 Website", value: "[Klik di sini untuk list staff event!](https://altioneventcalendar.vercel.app/staff)", inline: false },
      ],
      footer: { text: "ALTION Event Calendar • Created by GG & Camolly" },
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
    const { couple, venue, time, notes, addon, date, date_end, event_type, max_staff } = req.body;
    if (!couple || !date) return res.status(400).json({ error: "Nama dan tanggal wajib diisi" });

    // date_end harus >= date
    const endDate = date_end && date_end >= date ? date_end : date;

    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const created_at = wib.toISOString().replace("Z", "+07:00");

    const { data, error } = await supabase
      .from("wedding_events")
      .insert([{ couple, venue, time, notes, addon, date, date_end: endDate, event_type, created_at, max_staff: max_staff ? parseInt(max_staff) : null }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    await sendDiscordNotification(data, "add");
    return res.status(201).json(data);
  }

  if (req.method === "PUT") {
    const { id } = req.query;
    const { couple, venue, time, notes, addon, date, date_end, event_type, max_staff } = req.body;
    if (!couple || !date) return res.status(400).json({ error: "Nama dan tanggal wajib diisi" });

    const endDate = date_end && date_end >= date ? date_end : date;

    const { data, error } = await supabase
      .from("wedding_events")
      .update({ couple, venue, time, notes, addon, date, date_end: endDate, event_type, max_staff: max_staff ? parseInt(max_staff) : null })
      .eq("id", id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    await sendDiscordNotification(data, "edit");
    return res.status(200).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;
    const { data: eventData } = await supabase.from("wedding_events").select("*").eq("id", id).single();
    const { error } = await supabase.from("wedding_events").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    if (eventData) await sendDiscordNotification(eventData, "delete");
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
