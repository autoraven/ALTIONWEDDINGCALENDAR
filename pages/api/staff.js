import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DISCORD_WEBHOOK_WEDDING = process.env.DISCORD_STAFF_WEBHOOK_WEDDING;
const DISCORD_WEBHOOK_EVENT   = process.env.DISCORD_STAFF_WEBHOOK_EVENT;

async function sendDiscordNotification(type, staff, event, allStaff) {
  const isWedding = event.event_type === "wedding";
  const webhookUrl = isWedding ? DISCORD_WEBHOOK_WEDDING : DISCORD_WEBHOOK_EVENT;
  if (!webhookUrl) return;

  const isJoin = type === "join";

  const isMultiDay = event.date_end && event.date_end !== event.date;
  const dateFormatted = isMultiDay
    ? `${new Date(event.date).toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})} — ${new Date(event.date_end).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}`
    : new Date(event.date).toLocaleDateString("id-ID", { weekday:"long", year:"numeric", month:"long", day:"numeric" });

  const slotInfo = event.max_staff
    ? `${allStaff.length}/${event.max_staff} orang ${allStaff.length >= event.max_staff ? "🔴 **PENUH**" : allStaff.length >= event.max_staff * 0.75 ? "🟡 Hampir penuh" : "🟢 Tersedia"}`
    : `${allStaff.length} orang (tidak dibatasi)`;

  const memberList = allStaff.length > 0
    ? allStaff.map((s, i) => `${i+1}. **${s.name}** — ${s.role}`).join("\n")
    : "_Belum ada staff_";

  const eventLabel = `${isWedding ? "💍" : "🎉"} ${event.couple}`;

  // Warna & judul dibedakan wedding vs event
  const embedColor = isJoin
    ? (isWedding ? 0x7c3aed : 0x0fb87a)   // join: ungu utk wedding, hijau utk event
    : (isWedding ? 0xe53e3e : 0xf59e0b);   // leave: merah utk wedding, oranye utk event

  const embedTitle = isJoin
    ? (isWedding
        ? `💍 ${staff.name} bergabung ke Wedding`
        : `🎉 ${staff.name} bergabung ke Event`)
    : (isWedding
        ? `💍 ${staff.name} keluar dari Wedding`
        : `🎉 ${staff.name} keluar dari Event`);

  const payload = {
    embeds: [{
      title: embedTitle,
      description: isJoin
        ? `**${staff.name}** (${staff.role || "Staff"}) telah bergabung ke **${eventLabel}**`
        : `**${staff.name}** (${staff.role || "Staff"}) telah keluar dari **${eventLabel}**`,
      color: embedColor,
      fields: [
        { name: "📅 Tanggal",    value: dateFormatted,   inline: true },
        { name: "🏛️ Venue",     value: event.venue || "-", inline: true },
        { name: "👥 Slot Staff", value: slotInfo,         inline: true },
        { name: `📋 Daftar Staff (${allStaff.length} orang)`, value: memberList, inline: false },
        { name: "🔗 Website", value: "[Klik di sini untuk list staff event!](https://altioneventcalendar.vercel.app/staff)", inline: false },
      ],
      footer: { text: `${isWedding ? "ALTION Wedding System" : "ALTION Event System"} • Created by GG & Camolly` },
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
    console.error("Discord staff notification failed:", err);
  }
}

export default async function handler(req, res) {


  if (req.method === "GET") {
    const { event_id } = req.query;
    let query = supabase.from("event_staff").select("*").order("joined_at", { ascending: true });
    if (event_id) query = query.eq("event_id", event_id);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }


  if (req.method === "POST") {
    const { event_id, name, role, bypass_limit, requester_id } = req.body;
    if (!event_id || !name?.trim()) return res.status(400).json({ error: "Event dan nama wajib diisi" });


    const { data: existing } = await supabase
      .from("event_staff")
      .select("id")
      .eq("event_id", event_id)
      .ilike("name", name.trim())
      .single();
    if (existing) return res.status(409).json({ error: "Nama ini sudah terdaftar di event ini" });

    const { data: event } = await supabase
      .from("wedding_events")
      .select("*")
      .eq("id", event_id)
      .single();

    // Cek slot limit — bisa dilewati oleh admin / Head Staff ke atas via Kelola Absensi
    let allowBypass = false;
    if (bypass_limit) {
      if (requester_id) {
        // Diminta dari staff page: verifikasi role requester di server
        const { data: requester } = await supabase
          .from("staff_users")
          .select("is_admin, jabatan")
          .eq("id", requester_id)
          .single();
        const PRIVILEGED = ["Head Staff", "Manager", "Executive", "Ceo"];
        allowBypass = requester?.is_admin === true || PRIVILEGED.includes(requester?.jabatan);
      } else {
        // Diminta dari admin panel (performance page) yang sudah pakai ADMIN_CREDENTIALS
        allowBypass = true;
      }
    }

    if (event?.max_staff && !allowBypass) {
      const { count } = await supabase
        .from("event_staff")
        .select("id", { count: "exact", head: true })
        .eq("event_id", event_id);
      if (count >= event.max_staff)
        return res.status(409).json({ error: `Slot staff penuh! Maksimal ${event.max_staff} orang untuk event ini.` });
    }

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
      const { data: allStaff } = await supabase
        .from("event_staff")
        .select("*")
        .eq("event_id", event_id)
        .order("joined_at", { ascending: true });
      await sendDiscordNotification("join", data, event, allStaff || []);
    }
    return res.status(201).json(data);
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    const { data: staffData } = await supabase
      .from("event_staff").select("*, wedding_events(*)").eq("id", id).single();

    const { error } = await supabase.from("event_staff").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });

    if (staffData) {
      const event = staffData.wedding_events;
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
