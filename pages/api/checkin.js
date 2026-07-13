import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Google Sheets helper ─────────────────────────────────────────────────────
// Kolom: Timestamp | ID Karyawan | Nama Karyawan | Tanggal | Jam Masuk (WIB) | Jam Keluar (WIB) | Status Kehadiran | Keterangan
async function appendToSheet({ timestamp, employeeId, staffName, tanggal, jamMasuk, namaEvent }) {
  try {
    const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const spreadsheetId   = process.env.GOOGLE_SHEET_ID;
    if (!credentialsJson || !spreadsheetId) return;

    const credentials = JSON.parse(credentialsJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Pastikan header row ada
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Sheet1!A1:H1",
    });

    const hasHeader = existing.data.values && existing.data.values.length > 0;
    if (!hasHeader) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: "Sheet1!A:H",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [["Timestamp", "ID Karyawan", "Nama Karyawan", "Tanggal", "Jam Masuk (WIB)", "Jam Keluar (WIB)", "Status Kehadiran", "Keterangan"]],
        },
      });
    }

    // Append data row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:H",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, employeeId || "", staffName, tanggal, jamMasuk, "", "Hadir", namaEvent]],
      },
    });
  } catch (err) {
    console.error("Google Sheets append error:", err.message);
  }
}

// ── Discord notification ─────────────────────────────────────────────────────
async function sendCheckinNotification(staffName, staffRole, staffJobdesk, discordId, event, checkinTime, allCheckins, totalStaff) {
  const isWedding  = event.event_type === "wedding";
  const webhookUrl = isWedding
    ? process.env.DISCORD_CHECKIN_WEBHOOK_WEDDING
    : process.env.DISCORD_CHECKIN_WEBHOOK_EVENT;
  if (!webhookUrl) return;

  const timeFormatted = new Date(checkinTime).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
  });
  const dateFormatted = new Date(event.date).toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  });

  const mention     = discordId ? `<@${discordId}>` : `**${staffName}**`;
  const checkinCount = allCheckins.length;
  const progressBar = totalStaff > 0
    ? `${"🟩".repeat(checkinCount)}${"⬛".repeat(Math.max(0, totalStaff - checkinCount))} ${checkinCount}/${totalStaff}`
    : `${checkinCount} orang hadir`;

  const checkinList = allCheckins.length > 0
    ? allCheckins.map((c, i) =>
        `${i + 1}. ✅ **${c.staff_name}**${c.jobdesk ? ` (💼 ${c.jobdesk})` : ""} — ${new Date(c.checked_in_at).toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit", timeZone:"Asia/Jakarta" })} WIB`
      ).join("\n")
    : "_Belum ada_";

  const payload = {
    content: discordId ? `${mention} telah check-in untuk event **${event.couple}**! ✅` : null,
    embeds: [{
      title: isWedding ? `💍 Check-in Wedding: ${event.couple}` : `🎉 Check-in Event: ${event.couple}`,
      color: isWedding ? 0x7c3aed : 0x0ea5e9,
      description: `${mention} — **${staffRole || "Staff"}**${isWedding && staffJobdesk ? ` (💼 ${staffJobdesk})` : ""} telah hadir dan check-in.`,
      fields: [
        { name: "📅 Tanggal Event",  value: dateFormatted,           inline: true },
        { name: "🕐 Waktu Check-in", value: `${timeFormatted} WIB`,  inline: true },
        { name: "📍 Venue",          value: event.venue || "-",      inline: true },
        ...(event.time  ? [{ name: "🎬 Mulai",  value: event.time,  inline: true }] : []),
        ...(event.addon ? [{ name: "✨ Add On", value: event.addon, inline: false }] : []),
        { name: "👥 Progress Kehadiran", value: progressBar,   inline: false },
        { name: `✅ Sudah Hadir (${checkinCount})`, value: checkinList.slice(0, 1000), inline: false },
      ],
      footer: { text: `ALTION Check-in System • ${isWedding ? "Wedding" : "Event"} • Created by GG & Camolly` },
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

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {

  // GET
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

  // POST — check-in
  if (req.method === "POST") {
    const { event_id, staff_user_id, staff_name, employee_id, note, admin_override, admin_user_id } = req.body;
    if (!event_id || !staff_name?.trim())
      return res.status(400).json({ error: "event_id dan staff_name wajib diisi" });
    if (!admin_override && !staff_user_id)
      return res.status(400).json({ error: "staff_user_id wajib diisi" });

    // Jika admin_override, verifikasi admin atau jabatan Head Staff ke atas
    if (admin_override) {
      const PRIVILEGED = ["Head Staff", "Manager", "Executive", "Ceo"];
      const { data: adminUser } = await supabase
        .from("staff_users")
        .select("is_admin, jabatan")
        .eq("id", admin_user_id)
        .single();
      if (!adminUser?.is_admin && !PRIVILEGED.includes(adminUser?.jabatan))
        return res.status(403).json({ error: "Hanya admin atau Head Staff ke atas yang dapat melakukan check-in untuk staff lain." });
    }

    // Cek sudah terdaftar di event — utamakan employee_id, fallback ke nama
    let registered = null;
    if (employee_id) {
      const { data } = await supabase
        .from("event_staff")
        .select("id, role, employee_id, jobdesk")
        .eq("event_id", event_id)
        .eq("employee_id", employee_id)
        .maybeSingle();
      registered = data;
    }
    if (!registered) {
      const { data } = await supabase
        .from("event_staff")
        .select("id, role, employee_id, jobdesk")
        .eq("event_id", event_id)
        .ilike("name", staff_name.trim())
        .maybeSingle();
      registered = data;
    }
    if (!registered)
      return res.status(403).json({ error: admin_override ? "Staff belum terdaftar di event ini." : "Kamu belum terdaftar di event ini. Daftar terlebih dahulu." });

    // Cek sudah check-in belum — utamakan employee_id, fallback ke staff_user_id/nama
    const resolvedEmployeeId = employee_id || registered.employee_id || null;
    let already = null;
    if (resolvedEmployeeId) {
      const { data } = await supabase
        .from("staff_checkins")
        .select("id, checked_in_at")
        .eq("event_id", event_id)
        .eq("employee_id", resolvedEmployeeId)
        .maybeSingle();
      already = data;
    }
    if (!already) {
      let alreadyQuery = supabase
        .from("staff_checkins")
        .select("id, checked_in_at")
        .eq("event_id", event_id);
      if (admin_override) {
        alreadyQuery = alreadyQuery.ilike("staff_name", staff_name.trim());
      } else {
        alreadyQuery = alreadyQuery.eq("staff_user_id", staff_user_id);
      }
      const { data } = await alreadyQuery.maybeSingle();
      already = data;
    }
    if (already) {
      const timeStr = new Date(already.checked_in_at).toLocaleTimeString("id-ID", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta",
      });
      const errMsg = admin_override
        ? `${staff_name} sudah check-in pukul ${timeStr} WIB`
        : `Kamu sudah check-in pukul ${timeStr} WIB`;
      return res.status(409).json({ error: errMsg, alreadyCheckedIn: true });
    }

    // Simpan waktu WIB
    const now = new Date();
    const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const checked_in_at = wib.toISOString().replace("Z", "+07:00");

    // Jika admin_override, resolve staff_user_id — utamakan employee_id, fallback nama
    let resolvedUserId = staff_user_id || null;
    if (admin_override && !resolvedUserId) {
      let suMatch = null;
      if (resolvedEmployeeId) {
        const { data } = await supabase
          .from("staff_users")
          .select("id")
          .eq("employee_id", resolvedEmployeeId)
          .maybeSingle();
        suMatch = data;
      }
      if (!suMatch) {
        const { data } = await supabase
          .from("staff_users")
          .select("id")
          .ilike("name", staff_name.trim())
          .maybeSingle();
        suMatch = data;
      }
      resolvedUserId = suMatch?.id || null;
    }

    const { data, error } = await supabase
      .from("staff_checkins")
      .insert([{ event_id, staff_user_id: resolvedUserId, staff_name: staff_name.trim(), employee_id: resolvedEmployeeId, checked_in_at, note: note?.trim() || (admin_override ? "Check-in oleh Admin" : null) }])
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    // Ambil data pendukung
    const [eventRes, staffUserRes, allCheckinsRes, totalStaffRes, eventStaffRes] = await Promise.all([
      supabase.from("wedding_events").select("*").eq("id", event_id).single(),
      supabase.from("staff_users").select("discord_id, employee_id, jabatan, posisi").eq("id", resolvedUserId).single(),
      supabase.from("staff_checkins").select("staff_name, employee_id, checked_in_at").eq("event_id", event_id).order("checked_in_at", { ascending: true }),
      supabase.from("event_staff").select("id", { count: "exact" }).eq("event_id", event_id),
      supabase.from("event_staff").select("employee_id, jobdesk").eq("event_id", event_id),
    ]);

    const event       = eventRes.data;
    const staffUser   = staffUserRes.data;
    const jobdeskMap  = Object.fromEntries((eventStaffRes.data || []).filter(r=>r.employee_id && r.jobdesk).map(r=>[r.employee_id, r.jobdesk]));
    const allCheckins = (allCheckinsRes.data || []).map(c => ({ ...c, jobdesk: c.employee_id ? jobdeskMap[c.employee_id] : undefined }));
    const totalStaff  = totalStaffRes.count || 0;
    const discordId   = staffUser?.discord_id || null;
    const staffRole   = registered.role || [staffUser?.jabatan, staffUser?.posisi].filter(Boolean).join(" · ") || "Staff";
    const staffJobdesk = registered.jobdesk || null;

    if (event) {
      const wibDate     = new Date(new Date(checked_in_at).toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const pad         = (n) => String(n).padStart(2, "0");
      const jamMasuk    = `${pad(wibDate.getHours())}:${pad(wibDate.getMinutes())}`;
      const tanggal     = `${wibDate.getFullYear()}-${pad(wibDate.getMonth() + 1)}-${pad(wibDate.getDate())}`;
      const timestamp   = `${tanggal} ${jamMasuk}`;

      // Kirim Discord + Google Sheets secara paralel
      await Promise.all([
        sendCheckinNotification(staff_name.trim(), staffRole, staffJobdesk, discordId, event, checked_in_at, allCheckins, totalStaff),
        appendToSheet({
          timestamp,
          employeeId: staffUser?.employee_id || "",
          staffName:  staff_name.trim(),
          tanggal,
          jamMasuk,
          namaEvent:  event.couple,
        }),
      ]);
    }

    return res.status(201).json(data);
  }

  // DELETE
  if (req.method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "ID wajib diisi" });
    const { error } = await supabase.from("staff_checkins").delete().eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
