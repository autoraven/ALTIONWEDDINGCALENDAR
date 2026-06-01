// pages/admin/performance.js
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../../lib/config";
import { ThemeToggle } from "../../lib/useTheme";
import { ADMIN_CREDENTIALS } from "../../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta"
  }) + " WIB";
}

function BgDecor() {
  return (
    <>
      <div className="bg-orb bg-orb-1"/><div className="bg-orb bg-orb-2"/>
      <div className="bg-orb bg-orb-3"/><div className="bg-orb bg-orb-4"/>
      <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        backgroundImage:"radial-gradient(circle,rgba(30,96,213,0.13) 1px,transparent 1px)",
        backgroundSize:"36px 36px",
        maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)",
        WebkitMaskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)",
      }}/>
    </>
  );
}

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:18,padding:"20px 24px",border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",display:"flex",alignItems:"center",gap:16 }}>
      <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${color}22,${color}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,border:`1px solid ${color}33` }}>{icon}</div>
      <div>
        <p style={{ fontSize:11,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2 }}>{label}</p>
        <p style={{ fontSize:28,fontWeight:800,color:"var(--dark)",letterSpacing:-1,lineHeight:1 }}>{value}</p>
        {sub && <p style={{ fontSize:11,color:"var(--muted)",marginTop:3 }}>{sub}</p>}
      </div>
    </div>
  );
}

function Medal({ rank }) {
  if (rank === 1) return <span style={{ fontSize:20 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize:20 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize:20 }}>🥉</span>;
  return <span style={{ width:24,height:24,borderRadius:"50%",background:"rgba(0,0,0,0.06)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"var(--muted)" }}>{rank}</span>;
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteModal({ isOpen, onClose, onConfirm, loading, title, description, itemName, itemSub }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9999,
      background:"rgba(10,22,40,0.65)", backdropFilter:"blur(6px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background:"#fff", borderRadius:24, width:"100%", maxWidth:420,
        boxShadow:"0 32px 80px rgba(10,22,40,0.4)",
        animation:"modalIn 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        overflow:"hidden",
      }}>
        {/* Header merah */}
        <div style={{
          background:"linear-gradient(135deg,#dc2626,#ef4444)",
          padding:"24px 28px 20px", textAlign:"center",
        }}>
          <div style={{
            width:52, height:52, borderRadius:16,
            background:"rgba(255,255,255,0.15)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26, margin:"0 auto 12px",
          }}>🗑️</div>
          <h3 style={{ color:"#fff", fontSize:18, fontWeight:800, margin:0 }}>{title}</h3>
          <p style={{ color:"rgba(255,255,255,0.7)", fontSize:12, marginTop:6 }}>{description}</p>
        </div>

        {/* Info item yang akan dihapus */}
        <div style={{ padding:"20px 28px 0" }}>
          <div style={{
            background:"rgba(239,68,68,0.06)", border:"1.5px solid rgba(239,68,68,0.15)",
            borderRadius:14, padding:"14px 18px", display:"flex", alignItems:"center", gap:12,
          }}>
            <div style={{
              width:38, height:38, borderRadius:10,
              background:"linear-gradient(135deg,#dc2626,#ef4444)",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0,
            }}>
              <span style={{ color:"#fff", fontSize:14, fontWeight:800 }}>
                {itemName?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
            <div>
              <p style={{ fontSize:14, fontWeight:800, color:"#1a1a1a", margin:0 }}>{itemName}</p>
              {itemSub && <p style={{ fontSize:11, color:"#666", marginTop:2 }}>{itemSub}</p>}
            </div>
          </div>

          <p style={{
            fontSize:12, color:"#999", textAlign:"center",
            margin:"16px 0 0", lineHeight:1.6,
          }}>
            Data yang dihapus <strong style={{ color:"#dc2626" }}>tidak dapat dikembalikan</strong>.
            Pastikan Anda yakin sebelum melanjutkan.
          </p>
        </div>

        {/* Tombol */}
        <div style={{ padding:"20px 28px 28px", display:"flex", gap:10 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex:1, padding:"12px", borderRadius:12,
              border:"1.5px solid var(--border,#e5e7eb)",
              background:"rgba(255,255,255,0.9)",
              fontSize:13, fontWeight:700, color:"#666",
              cursor:"pointer",
            }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex:1, padding:"12px", borderRadius:12, border:"none",
              background:loading
                ? "rgba(239,68,68,0.5)"
                : "linear-gradient(135deg,#dc2626,#ef4444)",
              fontSize:13, fontWeight:700, color:"#fff",
              cursor:loading?"not-allowed":"pointer",
              boxShadow:"0 4px 14px rgba(220,38,38,0.35)",
            }}
          >
            {loading ? "Menghapus..." : "Ya, Hapus"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity:0; transform:scale(0.88) translateY(16px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PerformancePage() {
  const [authed, setAuthed] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [mounted, setMounted] = useState(false);

  // Data
  const [staffUsers, setStaffUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [staffMap, setStaffMap] = useState({});   // event_id -> [staff]
  const [checkins, setCheckins] = useState([]);    // all checkin records
  const [loading, setLoading] = useState(false);

  // Filters
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState("leaderboard");
  const [selectedStaff, setSelectedStaff] = useState(null);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: null,       // "checkin" | "registration"
    id: null,
    itemName: "",
    itemSub: "",
    loading: false,
  });

  // ── Kelola Absensi state ─────────────────────────────────────────────────
  const [absensiSearch, setAbsensiSearch] = useState("");
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [absensiFilter, setAbsensiFilter] = useState("all"); // "all" | "today" | "upcoming" | "past"
  const [addStaffPanel, setAddStaffPanel] = useState(null); // event_id or null
  const [addStaffName, setAddStaffName] = useState("");
  const [addStaffLoading, setAddStaffLoading] = useState(false);
  const [addStaffErr, setAddStaffErr] = useState("");
  const [adminCheckinLoading, setAdminCheckinLoading] = useState({}); // { staffId: bool }
  const [adminCheckinErr, setAdminCheckinErr] = useState({}); // { staffId: string }
  const [loggedInAdminId, setLoggedInAdminId] = useState(null); // ID admin yang sedang login

  const { businessName } = CALENDAR_CONFIG;

  useEffect(() => {
    setMounted(true);
    const s = sessionStorage.getItem("admin_authed");
    if (s === "1") { setAuthed(true); fetchAll(); }
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    if (adminUser === ADMIN_CREDENTIALS.username && adminPass === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem("admin_authed", "1");
      setAuthed(true);
      fetchAll();
    } else {
      setLoginErr("Username atau password salah");
    }
  }

  async function fetchAll() {
    setLoading(true);
    const [uRes, eRes, stRes, ciRes] = await Promise.all([
      fetch("/api/staff-users"),
      fetch("/api/events"),
      fetch("/api/staff"),
      fetch("/api/checkin"),
    ]);
    const [uData, eData, stData, ciData] = await Promise.all([
      uRes.json(), eRes.json(), stRes.json(), ciRes.json()
    ]);
    if (Array.isArray(uData)) {
      setStaffUsers(uData);
      // Simpan ID admin pertama yang ditemukan — dipakai untuk admin_override checkin
      const firstAdmin = uData.find(u => u.is_admin === true);
      if (firstAdmin) setLoggedInAdminId(firstAdmin.id);
    }
    if (Array.isArray(eData)) setEvents(eData);
    if (Array.isArray(stData)) {
      const map = {};
      stData.forEach(s => {
        if (!map[s.event_id]) map[s.event_id] = [];
        map[s.event_id].push(s);
      });
      setStaffMap(map);
    }
    if (Array.isArray(ciData)) setCheckins(ciData);
    setLoading(false);
  }

  // ── Open delete modal ────────────────────────────────────────────────────────
  function openDeleteCheckin(ci) {
    const ev = events.find(e => String(e.id) === String(ci.event_id));
    setDeleteModal({
      isOpen: true,
      type: "checkin",
      id: ci.id,
      itemName: ci.staff_name,
      itemSub: `Check-in ${formatTime(ci.checked_in_at)} · ${ev?.couple || "-"}`,
      loading: false,
    });
  }

  function openDeleteRegistration(staffEntry) {
    // staffEntry = row from event_staff table (has id, name, role, event_id)
    const ev = events.find(e => String(e.id) === String(staffEntry.event_id));
    setDeleteModal({
      isOpen: true,
      type: "registration",
      id: staffEntry.id,
      itemName: staffEntry.name,
      itemSub: `Pendaftaran di: ${ev?.couple || "-"} · ${formatDate(ev?.date)}`,
      loading: false,
    });
  }

  function closeDeleteModal() {
    if (deleteModal.loading) return;
    setDeleteModal(prev => ({ ...prev, isOpen: false }));
  }

  async function confirmDelete() {
    setDeleteModal(prev => ({ ...prev, loading: true }));
    const { type, id } = deleteModal;

    if (type === "checkin") {
      const res = await fetch(`/api/checkin?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCheckins(prev => prev.filter(c => c.id !== id));
        // Jika sedang lihat detail staff, update userCheckins-nya
        if (selectedStaff) {
          setSelectedStaff(prev => prev
            ? { ...prev, userCheckins: prev.userCheckins.filter(c => c.id !== id) }
            : prev
          );
        }
      }
    }

    if (type === "registration") {
      const res = await fetch(`/api/staff?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        // Hapus dari staffMap
        setStaffMap(prev => {
          const next = { ...prev };
          for (const eventId in next) {
            next[eventId] = next[eventId].filter(s => s.id !== id);
          }
          return next;
        });
        // Jika sedang lihat detail staff, refresh selectedStaff nanti lewat perfData re-compute
      }
    }

    setDeleteModal(prev => ({ ...prev, loading: false, isOpen: false }));
  }

  // ── Add staff by admin (Kelola Absensi) ──────────────────────────────────
  async function handleAdminAddStaff(eventId) {
    const name = addStaffName.trim();
    if (!name) return;
    setAddStaffLoading(true); setAddStaffErr("");
    const matched = staffUsers.find(u => u.name.toLowerCase() === name.toLowerCase() && u.is_active);
    const role = matched ? ([matched.jabatan, matched.posisi].filter(Boolean).join(" · ") || "Staff") : "Staff";
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: eventId, name, role, user_id: matched?.id || null }),
    });
    const data = await res.json();
    setAddStaffLoading(false);
    if (data.error) { setAddStaffErr(data.error); return; }
    setStaffMap(prev => ({ ...prev, [eventId]: [...(prev[eventId]||[]), data] }));
    setAddStaffName(""); setAddStaffPanel(null);
  }

  // ── Admin check-in untuk staff (identik dengan staff/index.js) ───────────
  async function handleAdminCheckin(event, staff) {
    const key = staff.id;
    setAdminCheckinLoading(prev => ({ ...prev, [key]: true }));
    setAdminCheckinErr(prev => ({ ...prev, [key]: "" }));
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: event.id,
        staff_name: staff.name,
        admin_override: true,
        admin_user_id: loggedInAdminId,
      }),
    });
    const data = await res.json();
    setAdminCheckinLoading(prev => ({ ...prev, [key]: false }));
    if (data.error && !data.alreadyCheckedIn) {
      setAdminCheckinErr(prev => ({ ...prev, [key]: data.error }));
      return;
    }
    if (data.id || data.alreadyCheckedIn) {
      // Refresh semua checkins — identik dengan staff page
      const d = await fetch("/api/checkin").then(r => r.json());
      if (Array.isArray(d)) setCheckins(d);
    }
  }

  async function handleAdminDeleteCheckin(ciId) {
    if (!confirm("Hapus data check-in ini?")) return;
    const res = await fetch(`/api/checkin?id=${ciId}`, { method: "DELETE" });
    if (res.ok) setCheckins(prev => prev.filter(c => c.id !== ciId));
  }

  async function handleAdminDeleteRegistration(staffId, eventId) {
    if (!confirm("Hapus pendaftaran staff ini dari event?")) return;
    const res = await fetch(`/api/staff?id=${staffId}`, { method: "DELETE" });
    if (res.ok) setStaffMap(prev => ({ ...prev, [eventId]: (prev[eventId]||[]).filter(s => s.id !== staffId) }));
  }

  // ── Filter events by selected month/year ─────────────────────────────────
  const filteredEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
  });

  // ── Build performance data per staff ─────────────────────────────────────
  const perfData = staffUsers.filter(u => u.is_active).map(user => {
    const joinedEvents = filteredEvents.filter(ev => {
      const list = staffMap[ev.id] || [];
      return list.some(s => s.name.toLowerCase() === user.name.toLowerCase());
    });

    const userCheckins = checkins.filter(c => {
      // Match by staff_user_id (paksa string agar tidak gagal karena type mismatch uuid vs number)
      // Fallback: match by staff_name jika staff_user_id null (admin_override tanpa resolvedUserId)
      const matchById = c.staff_user_id != null && String(c.staff_user_id) === String(user.id);
      const matchByName = !c.staff_user_id && c.staff_name?.toLowerCase().trim() === user.name?.toLowerCase().trim();
      if (!matchById && !matchByName) return false;
      // FIX: Filter berdasarkan tanggal EVENT (bukan waktu check-in).
      // Check-in bisa terjadi jam 00:00-06:00 WIB keesokan harinya (window isMorningAfterEventDay),
      // sehingga jika difilter by checked_in_at akan masuk ke bulan yang salah.
      // Solusi: cari event yang di-checkin, lalu cek bulan/tahun dari event.date.
      const ev = events.find(e => String(e.id) === String(c.event_id));
      if (!ev) return false;
      const evDate = new Date(ev.date + "T00:00:00"); // Pakai tanggal event, bukan timestamp check-in
      return evDate.getFullYear() === filterYear && evDate.getMonth() === filterMonth;
    });

    const checkinRate = joinedEvents.length > 0
      ? Math.round((userCheckins.length / joinedEvents.length) * 100)
      : 0;

    return { user, joinedCount: joinedEvents.length, checkinCount: userCheckins.length, checkinRate, joinedEvents, userCheckins };
  }).sort((a, b) => {
    if (b.checkinCount !== a.checkinCount) return b.checkinCount - a.checkinCount;
    if (b.joinedCount !== a.joinedCount) return b.joinedCount - a.joinedCount;
    return a.user.name.localeCompare(b.user.name);
  });

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalJoins = perfData.reduce((s, p) => s + p.joinedCount, 0);
  const totalCheckins = perfData.reduce((s, p) => s + p.checkinCount, 0);
  const avgRate = perfData.length > 0
    ? Math.round(perfData.reduce((s, p) => s + p.checkinRate, 0) / perfData.length)
    : 0;

  // ── All checkins in this month for log ───────────────────────────────────
  // FIX: Filter log check-in berdasarkan tanggal EVENT, bukan waktu check-in.
  // Supaya check-in yang terjadi jam 00:00-06:00 WIB (window esok pagi) tetap masuk ke bulan event.
  const monthCheckins = checkins.filter(c => {
    const ev = events.find(e => String(e.id) === String(c.event_id));
    if (!ev) return false;
    const evDate = new Date(ev.date + "T00:00:00");
    return evDate.getFullYear() === filterYear && evDate.getMonth() === filterMonth;
  }).sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));

  // ── Available years ───────────────────────────────────────────────────────
  const years = [...new Set(events.map(e => new Date(e.date).getFullYear()))].sort((a,b)=>b-a);
  if (!years.includes(filterYear)) years.push(filterYear);

  // ─── Login ─────────────────────────────────────────────────────────────────
  if (!authed) return (
    <>
      <Head><title>Admin Performance — {businessName}</title></Head>
      <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden" }}>
        <div style={{ background:"rgba(255,255,255,0.97)",width:"100%",maxWidth:400,borderRadius:24,overflow:"hidden",boxShadow:"0 32px 80px rgba(10,22,40,0.5)" }}>
          <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"36px 36px 28px",textAlign:"center" }}>
            <div style={{ width:56,height:56,borderRadius:16,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",padding:8,overflow:"hidden" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <h1 style={{ color:"#fff",fontSize:22,fontWeight:800 }}>{businessName}</h1>
            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,letterSpacing:3,marginTop:6,textTransform:"uppercase",fontWeight:600 }}>Admin · Performa Staff</p>
          </div>
          <form onSubmit={handleLogin} style={{ padding:"32px 36px" }}>
            {loginErr && <div style={{ background:"#fff0f0",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:12,marginBottom:16,fontSize:13 }}>⚠️ {loginErr}</div>}
            <div style={{ marginBottom:14 }}>
              <label className="label">Username Admin</label>
              <input type="text" value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="input" required autoFocus autoCapitalize="none"/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label className="label">Password</label>
              <input type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} className="input" required/>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:"100%",padding:"13px" }}>Masuk</button>
            <div style={{ marginTop:16,textAlign:"center" }}>
              <Link href="/admin" style={{ fontSize:12,color:"var(--muted)",textDecoration:"none" }}>← Kembali ke Admin Panel</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  // ─── Main Dashboard ────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Performa Staff — {businessName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>

      {/* ── Delete Confirmation Modal ─────────────────────────── */}
      <DeleteModal
        isOpen={deleteModal.isOpen}
        loading={deleteModal.loading}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={deleteModal.type === "checkin" ? "Hapus Data Check-in?" : "Hapus Pendaftaran Staff?"}
        description={
          deleteModal.type === "checkin"
            ? "Data check-in staff ini akan dihapus dari sistem."
            : "Pendaftaran staff ke event ini akan dihapus dari sistem."
        }
        itemName={deleteModal.itemName}
        itemSub={deleteModal.itemSub}
      />

      <div style={{ minHeight:"100vh",position:"relative",overflow:"hidden" }}>
        <BgDecor/>

        {/* Header */}
        <header style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",padding:"0 24px",height:68,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 32px rgba(10,22,40,0.4)",position:"sticky",top:0,zIndex:100 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:5,border:"1.5px solid rgba(255,255,255,0.2)" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <div>
              <span style={{ color:"#fff",fontSize:17,fontWeight:800,letterSpacing:-0.5,display:"block",lineHeight:1.1 }}>{businessName}</span>
              <span style={{ color:"rgba(255,255,255,0.45)",fontSize:9,letterSpacing:2.5,textTransform:"uppercase",fontWeight:600 }}>Performa & Absensi Staff</span>
            </div>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <Link href="/admin" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px" }}>← Admin Panel</Link>
            <Link href="/" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px" }}>Kalender</Link>
          </div>
        </header>

        <main style={{ maxWidth:1200,margin:"0 auto",padding:"32px 20px",position:"relative",zIndex:1 }}>

          {/* Filter Bar */}
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:24,flexWrap:"wrap" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.9)",backdropFilter:"blur(8px)",border:"1.5px solid var(--border)",borderRadius:14,padding:"8px 16px" }}>
              <span style={{ fontSize:14 }}>📅</span>
              <select value={filterMonth} onChange={e=>setFilterMonth(+e.target.value)} style={{ border:"none",background:"transparent",fontSize:13,fontWeight:700,color:"var(--dark)",cursor:"pointer",outline:"none" }}>
                {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
              <select value={filterYear} onChange={e=>setFilterYear(+e.target.value)} style={{ border:"none",background:"transparent",fontSize:13,fontWeight:700,color:"var(--dark)",cursor:"pointer",outline:"none" }}>
                {years.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={fetchAll} style={{ background:"rgba(255,255,255,0.9)",border:"1.5px solid var(--border)",borderRadius:12,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",color:"var(--dark)" }}>
              🔄 Refresh
            </button>
            {loading && <span style={{ fontSize:12,color:"var(--muted)" }}>Memuat data...</span>}
            <ThemeToggle />
          </div>

          {/* Stat Cards */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:28 }}>
            <StatCard icon="📅" label="Event Bulan Ini" value={filteredEvents.length} sub={`${MONTHS[filterMonth]} ${filterYear}`} color="#1e60d5"/>
            <StatCard icon="👥" label="Staff Aktif" value={staffUsers.filter(u=>u.is_active).length} sub="total terdaftar" color="#7c3aed"/>
            <StatCard icon="📋" label="Total Pendaftaran" value={totalJoins} sub="event diikuti" color="#0891b2"/>
            <StatCard icon="✅" label="Total Check-in" value={totalCheckins} sub={`rata-rata ${avgRate}%`} color="#059669"/>
          </div>

          {/* Tab Nav */}
          <div style={{ display:"flex",gap:6,background:"rgba(255,255,255,0.85)",border:"1.5px solid var(--border)",borderRadius:16,padding:5,backdropFilter:"blur(8px)",marginBottom:24,width:"fit-content",flexWrap:"wrap" }}>
            {[
              { key:"leaderboard", label:"🏆 Leaderboard" },
              { key:"detail", label:"📊 Detail Staff" },
              { key:"checkin_log", label:"🕐 Log Check-in" },
              { key:"kelola_absensi", label:"🗂️ Kelola Absensi" },
            ].map(({key,label})=>(
              <button key={key} onClick={()=>{ setActiveTab(key); setSelectedStaff(null); }}
                style={{ padding:"8px 20px",borderRadius:12,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all 0.18s",border:"none",background:activeTab===key?(key==="kelola_absensi"?"linear-gradient(135deg,#7c3aed,#a855f7)":"linear-gradient(135deg,var(--blue-3),var(--blue-1))"):"transparent",color:activeTab===key?"#fff":"var(--muted)",boxShadow:activeTab===key?"0 2px 10px rgba(30,96,213,0.25)":"none" }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── LEADERBOARD ──────────────────────────────────────────────────────── */}
          {activeTab === "leaderboard" && (
            <div>
              <h2 style={{ fontSize:18,fontWeight:800,color:"var(--dark)",marginBottom:16,letterSpacing:-0.5 }}>
                🏆 Leaderboard — {MONTHS[filterMonth]} {filterYear}
              </h2>
              {perfData.length === 0 ? (
                <div style={{ textAlign:"center",padding:"48px 0",color:"var(--muted)" }}>
                  <p style={{ fontSize:32 }}>📊</p>
                  <p style={{ fontWeight:700,marginTop:8 }}>Belum ada data untuk periode ini</p>
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  {perfData.map((p, idx) => (
                    <div key={p.user.id} onClick={()=>{ setSelectedStaff(p); setActiveTab("detail"); }}
                      style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:16,padding:"16px 20px",border:idx===0?"2px solid rgba(251,191,36,0.5)":idx===1?"2px solid rgba(192,192,192,0.5)":idx===2?"2px solid rgba(205,127,50,0.5)":"1.5px solid var(--border)",boxShadow:"var(--shadow)",cursor:"pointer",transition:"transform 0.15s,box-shadow 0.15s",display:"flex",alignItems:"center",gap:16 }}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="var(--shadow-lg)";}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="var(--shadow)";}}>
                      <div style={{ width:36,textAlign:"center",flexShrink:0 }}><Medal rank={idx+1}/></div>
                      <div style={{ width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,var(--blue-3),var(--blue-1))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <span style={{ color:"#fff",fontSize:16,fontWeight:800 }}>{p.user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ fontSize:14,fontWeight:800,color:"var(--dark)",marginBottom:2 }}>{p.user.name}</p>
                        <p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>{[p.user.jabatan,p.user.posisi].filter(Boolean).join(" · ") || "Staff"}</p>
                      </div>
                      <div style={{ display:"flex",gap:20,flexShrink:0,flexWrap:"wrap" }}>
                        <div style={{ textAlign:"center" }}>
                          <p style={{ fontSize:20,fontWeight:800,color:"var(--blue-1)",lineHeight:1 }}>{p.joinedCount}</p>
                          <p style={{ fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8 }}>Daftar</p>
                        </div>
                        <div style={{ textAlign:"center" }}>
                          <p style={{ fontSize:20,fontWeight:800,color:"#059669",lineHeight:1 }}>{p.checkinCount}</p>
                          <p style={{ fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8 }}>Check-in</p>
                        </div>
                        <div style={{ textAlign:"center",minWidth:56 }}>
                          <div style={{ position:"relative",width:52,height:52,flexShrink:0,margin:"0 auto" }}>
                            <svg width="52" height="52" style={{ transform:"rotate(-90deg)" }}>
                              <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5"/>
                              <circle cx="26" cy="26" r="21" fill="none"
                                stroke={p.checkinRate>=80?"#059669":p.checkinRate>=50?"#f59e0b":"#ef4444"}
                                strokeWidth="5"
                                strokeDasharray={`${(p.checkinRate/100)*131.9} 131.9`}
                                strokeLinecap="round"/>
                            </svg>
                            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                              <span style={{ fontSize:11,fontWeight:800,color:p.checkinRate>=80?"#059669":p.checkinRate>=50?"#f59e0b":"#ef4444" }}>{p.checkinRate}%</span>
                            </div>
                          </div>
                          <p style={{ fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginTop:2 }}>Rate</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DETAIL STAFF ──────────────────────────────────────────────────────── */}
          {activeTab === "detail" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap" }}>
                <h2 style={{ fontSize:18,fontWeight:800,color:"var(--dark)",letterSpacing:-0.5,flex:1 }}>
                  📊 Detail Performa Staff — {MONTHS[filterMonth]} {filterYear}
                </h2>
                <select value={selectedStaff?.user?.id || ""} onChange={e=>{
                  const found = perfData.find(p=>p.user.id===e.target.value);
                  setSelectedStaff(found || null);
                }} style={{ border:"1.5px solid var(--border)",borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:600,color:"var(--dark)",background:"rgba(255,255,255,0.9)",cursor:"pointer",outline:"none" }}>
                  <option value="">— Pilih Staff —</option>
                  {perfData.map(p=><option key={p.user.id} value={p.user.id}>{p.user.name}</option>)}
                </select>
              </div>

              {!selectedStaff ? (
                // Summary table all staff
                <div style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:18,border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",overflow:"auto" }}>
                  <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"rgba(238,244,255,0.8)" }}>
                        {["#","Nama","Jabatan","Daftar","Check-in","Rate","Aksi"].map(h=>(
                          <th key={h} style={{ padding:"12px 16px",textAlign:"left",fontWeight:700,color:"var(--muted)",fontSize:10,textTransform:"uppercase",letterSpacing:1,borderBottom:"1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {perfData.map((p,i)=>(
                        <tr key={p.user.id} style={{ borderBottom:"1px solid var(--border)",transition:"background 0.15s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(238,244,255,0.5)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"12px 16px",fontWeight:800,color:"var(--muted)" }}><Medal rank={i+1}/></td>
                          <td style={{ padding:"12px 16px" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                              <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,var(--blue-3),var(--blue-1))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                <span style={{ color:"#fff",fontSize:12,fontWeight:800 }}>{p.user.name.charAt(0)}</span>
                              </div>
                              <span style={{ fontWeight:700,color:"var(--dark)" }}>{p.user.name}</span>
                            </div>
                          </td>
                          <td style={{ padding:"12px 16px",color:"var(--muted)",fontSize:12 }}>{[p.user.jabatan,p.user.posisi].filter(Boolean).join(" · ") || "-"}</td>
                          <td style={{ padding:"12px 16px",fontWeight:800,color:"var(--blue-1)",textAlign:"center" }}>{p.joinedCount}</td>
                          <td style={{ padding:"12px 16px",fontWeight:800,color:"#059669",textAlign:"center" }}>{p.checkinCount}</td>
                          <td style={{ padding:"12px 16px",textAlign:"center" }}>
                            <span style={{ background:p.checkinRate>=80?"rgba(16,185,129,0.12)":p.checkinRate>=50?"rgba(245,158,11,0.12)":"rgba(239,68,68,0.12)",color:p.checkinRate>=80?"#059669":p.checkinRate>=50?"#b45309":"#ef4444",padding:"3px 10px",borderRadius:20,fontWeight:800,fontSize:12 }}>{p.checkinRate}%</span>
                          </td>
                          <td style={{ padding:"12px 16px" }}>
                            <button onClick={()=>setSelectedStaff(p)} style={{ background:"rgba(30,96,213,0.08)",border:"1px solid rgba(30,96,213,0.2)",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,color:"var(--blue-1)",cursor:"pointer" }}>Detail</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {perfData.length === 0 && <p style={{ textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:13 }}>Belum ada data untuk bulan ini</p>}
                </div>
              ) : (
                // Detail satu staff
                <div>
                  <button onClick={()=>setSelectedStaff(null)} style={{ background:"rgba(255,255,255,0.9)",border:"1.5px solid var(--border)",borderRadius:10,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",color:"var(--muted)",marginBottom:20 }}>← Kembali ke tabel</button>
                  <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",borderRadius:20,padding:"28px 32px",marginBottom:20,position:"relative",overflow:"hidden" }}>
                    <div style={{ position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" }}>
                      <div style={{ width:64,height:64,borderRadius:18,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <span style={{ color:"#fff",fontSize:28,fontWeight:800 }}>{selectedStaff.user.name.charAt(0)}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:"rgba(255,255,255,0.5)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase" }}>Performa Staff</p>
                        <h3 style={{ color:"#fff",fontSize:22,fontWeight:800,marginTop:4,letterSpacing:-0.5 }}>{selectedStaff.user.name}</h3>
                        <p style={{ color:"rgba(255,255,255,0.5)",fontSize:12,marginTop:2 }}>{[selectedStaff.user.jabatan,selectedStaff.user.posisi].filter(Boolean).join(" · ") || "Staff"}</p>
                      </div>
                      <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
                        {[
                          {label:"Event Daftar",value:selectedStaff.joinedCount,color:"rgba(255,255,255,0.9)"},
                          {label:"Check-in",value:selectedStaff.checkinCount,color:"#6ee7b7"},
                          {label:"Rate",value:`${selectedStaff.checkinRate}%`,color:selectedStaff.checkinRate>=80?"#6ee7b7":selectedStaff.checkinRate>=50?"#fde68a":"#fca5a5"},
                        ].map(({label,value,color})=>(
                          <div key={label} style={{ background:"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",borderRadius:14,padding:"14px 20px",textAlign:"center",border:"1px solid rgba(255,255,255,0.15)" }}>
                            <p style={{ color,fontSize:26,fontWeight:800,lineHeight:1,letterSpacing:-1 }}>{value}</p>
                            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginTop:4 }}>{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Event list for this staff — DENGAN tombol Hapus Pendaftaran */}
                  <div style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:18,border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",overflow:"auto" }}>
                    <div style={{ padding:"16px 20px",borderBottom:"1px solid var(--border)" }}>
                      <p style={{ fontWeight:800,fontSize:14,color:"var(--dark)" }}>Daftar Event — {MONTHS[filterMonth]} {filterYear}</p>
                    </div>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                      <thead>
                        <tr style={{ background:"rgba(238,244,255,0.6)" }}>
                          {["Event","Tanggal","Tipe","Status Daftar","Status Check-in","Jam Check-in","Aksi Admin"].map(h=>(
                            <th key={h} style={{ padding:"10px 16px",textAlign:"left",fontWeight:700,color:"var(--muted)",fontSize:10,textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid var(--border)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStaff.joinedEvents.length === 0 && (
                          <tr><td colSpan={7} style={{ textAlign:"center",padding:"24px",color:"var(--muted)",fontStyle:"italic" }}>Tidak ada event di bulan ini</td></tr>
                        )}
                        {selectedStaff.joinedEvents.map(ev => {
                          const ci = selectedStaff.userCheckins.find(c => String(c.event_id) === String(ev.id));
                          // Cari entry di staffMap untuk mendapat id row event_staff
                          const staffEntry = (staffMap[ev.id] || []).find(
                            s => s.name.toLowerCase() === selectedStaff.user.name.toLowerCase()
                          );
                          return (
                            <tr key={ev.id} style={{ borderBottom:"1px solid var(--border)" }}>
                              <td style={{ padding:"12px 16px",fontWeight:700,color:"var(--dark)" }}>{ev.couple}</td>
                              <td style={{ padding:"12px 16px",color:"var(--muted)",fontSize:12 }}>{formatDate(ev.date)}</td>
                              <td style={{ padding:"12px 16px" }}><span style={{ background:"rgba(238,244,255,0.8)",color:"var(--blue-1)",padding:"2px 8px",borderRadius:8,fontSize:11,fontWeight:600 }}>{ev.event_type==="wedding"?"💍 Wedding":"🎉 Event"}</span></td>
                              <td style={{ padding:"12px 16px" }}><span style={{ background:"rgba(16,185,129,0.1)",color:"#059669",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700 }}>✓ Terdaftar</span></td>
                              <td style={{ padding:"12px 16px" }}>
                                {ci
                                  ? <span style={{ background:"rgba(16,185,129,0.1)",color:"#059669",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700 }}>✅ Check-in</span>
                                  : <span style={{ background:"rgba(239,68,68,0.08)",color:"#ef4444",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700 }}>⛔ Tidak</span>}
                              </td>
                              <td style={{ padding:"12px 16px",color:"var(--muted)",fontSize:12 }}>{ci ? formatTime(ci.checked_in_at) : "-"}</td>
                              <td style={{ padding:"12px 16px" }}>
                                <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                                  {/* Hapus check-in jika ada */}
                                  {ci && (
                                    <button
                                      onClick={() => openDeleteCheckin(ci)}
                                      title="Hapus Check-in"
                                      style={{ background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:8,padding:"5px 10px",fontSize:10,fontWeight:700,color:"#059669",cursor:"pointer",whiteSpace:"nowrap" }}>
                                      ✅ Hapus CI
                                    </button>
                                  )}
                                  {/* Hapus pendaftaran */}
                                  {staffEntry && (
                                    <button
                                      onClick={() => openDeleteRegistration(staffEntry)}
                                      title="Hapus Pendaftaran"
                                      style={{ background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"5px 10px",fontSize:10,fontWeight:700,color:"#ef4444",cursor:"pointer",whiteSpace:"nowrap" }}>
                                      🗑️ Hapus Daftar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LOG CHECK-IN ──────────────────────────────────────────────────────── */}
          {activeTab === "checkin_log" && (
            <div>
              <h2 style={{ fontSize:18,fontWeight:800,color:"var(--dark)",marginBottom:16,letterSpacing:-0.5 }}>
                🕐 Log Check-in — {MONTHS[filterMonth]} {filterYear}
              </h2>
              <div style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:18,border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",overflow:"auto" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"rgba(238,244,255,0.8)" }}>
                      {["Nama Staff","Event","Tgl Event","Waktu Check-in","Hapus"].map(h=>(
                        <th key={h} style={{ padding:"12px 16px",textAlign:"left",fontWeight:700,color:"var(--muted)",fontSize:10,textTransform:"uppercase",letterSpacing:1,borderBottom:"1px solid var(--border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthCheckins.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign:"center",padding:"32px",color:"var(--muted)",fontStyle:"italic" }}>Tidak ada check-in di bulan ini</td></tr>
                    )}
                    {monthCheckins.map(ci => {
                      const ev = events.find(e => String(e.id) === String(ci.event_id));
                      return (
                        <tr key={ci.id} style={{ borderBottom:"1px solid var(--border)",transition:"background 0.15s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(238,244,255,0.4)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"12px 16px" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                              <div style={{ width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#059669,#10b981)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                <span style={{ color:"#fff",fontSize:11,fontWeight:800 }}>{ci.staff_name.charAt(0)}</span>
                              </div>
                              <span style={{ fontWeight:700,color:"var(--dark)" }}>{ci.staff_name}</span>
                            </div>
                          </td>
                          <td style={{ padding:"12px 16px",fontWeight:600,color:"var(--dark)" }}>{ev?.couple || "-"}</td>
                          <td style={{ padding:"12px 16px",color:"var(--muted)",fontSize:12 }}>{ev ? formatDate(ev.date) : "-"}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <span style={{ background:"rgba(16,185,129,0.1)",color:"#059669",padding:"4px 10px",borderRadius:8,fontWeight:700,fontSize:12 }}>✅ {formatTime(ci.checked_in_at)}</span>
                          </td>
                          <td style={{ padding:"12px 16px" }}>
                            <button
                              onClick={() => openDeleteCheckin(ci)}
                              style={{ background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"6px 14px",fontSize:11,fontWeight:700,color:"#ef4444",cursor:"pointer",display:"flex",alignItems:"center",gap:5 }}>
                              🗑️ Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── KELOLA ABSENSI ──────────────────────────────────────────────────────── */}
          {activeTab === "kelola_absensi" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12 }}>
                <div>
                  <h2 style={{ fontSize:18,fontWeight:800,color:"var(--dark)",letterSpacing:-0.5,marginBottom:4 }}>🗂️ Kelola Absensi Staff</h2>
                  <p style={{ fontSize:12,color:"var(--muted)" }}>Tambah, hapus pendaftaran dan check-in staff untuk setiap event.</p>
                </div>
                <div style={{ display:"flex",gap:8,flexWrap:"wrap",alignItems:"center" }}>
                  <button onClick={()=>{
                    fetch("/api/checkin").then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setCheckins(d); });
                    fetch("/api/staff").then(r=>r.json()).then(d=>{ if(Array.isArray(d)){ const map={}; d.forEach(s=>{ if(!map[s.event_id]) map[s.event_id]=[]; map[s.event_id].push(s); }); setStaffMap(map); }});
                  }} style={{ padding:"7px 14px",borderRadius:10,border:"1.5px solid var(--border)",background:"rgba(255,255,255,0.9)",fontSize:11,fontWeight:700,cursor:"pointer",color:"var(--muted)",display:"flex",alignItems:"center",gap:5 }}>
                    🔄 Refresh
                  </button>
                  {["all","upcoming","past"].map(f => (
                    <button key={f} onClick={()=>setAbsensiFilter(f)}
                      style={{ padding:"7px 16px",borderRadius:10,border:"1.5px solid",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.15s",
                        borderColor: absensiFilter===f ? "transparent" : "var(--border)",
                        background:  absensiFilter===f ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "rgba(255,255,255,0.9)",
                        color:       absensiFilter===f ? "#fff" : "var(--muted)",
                        boxShadow:   absensiFilter===f ? "0 2px 8px rgba(124,58,237,0.3)" : "none",
                      }}>
                      {f==="all"?"Semua Event":f==="upcoming"?"Mendatang":"Sudah Lewat"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ position:"relative",marginBottom:16 }}>
                <span style={{ position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none" }}>🔍</span>
                <input type="text" placeholder="Cari event atau nama staff..." value={absensiSearch} onChange={e=>setAbsensiSearch(e.target.value)}
                  style={{ width:"100%",boxSizing:"border-box",padding:"11px 16px 11px 40px",borderRadius:14,border:"1.5px solid var(--border)",background:"rgba(255,255,255,0.95)",fontSize:13,fontWeight:500,color:"var(--dark)",outline:"none" }}/>
              </div>

              {(() => {
                const nowWIB = new Date(new Date().getTime() + 7*60*60*1000);
                const todayStr = nowWIB.toISOString().split("T")[0];
                const q2 = absensiSearch.trim().toLowerCase();
                const filtEvs = events.filter(ev => {
                  if (absensiFilter === "upcoming" && (ev.date_end||ev.date) < todayStr) return false;
                  if (absensiFilter === "past"     && (ev.date_end||ev.date) >= todayStr) return false;
                  if (!q2) return true;
                  const sl = staffMap[ev.id] || [];
                  return ev.couple?.toLowerCase().includes(q2) || ev.venue?.toLowerCase().includes(q2) ||
                    sl.some(s => s.name.toLowerCase().includes(q2));
                }).sort((a,b) => {
                  const aIsPast = (a.date_end||a.date) < todayStr;
                  const bIsPast = (b.date_end||b.date) < todayStr;
                  if (aIsPast !== bIsPast) return aIsPast ? 1 : -1;
                  return new Date(a.date) - new Date(b.date);
                });

                if (filtEvs.length === 0) return (
                  <div style={{ textAlign:"center",padding:"48px 0",color:"var(--muted)" }}>
                    <p style={{ fontSize:32 }}>🗂️</p>
                    <p style={{ fontWeight:700,marginTop:8 }}>Tidak ada event ditemukan</p>
                  </div>
                );

                return (
                  <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                    {filtEvs.map(ev => {
                      const staffList   = staffMap[ev.id] || [];
                      const evCheckins  = checkins.filter(c => String(c.event_id) === String(ev.id));
                      const isExpanded  = expandedEventId === ev.id;
                      const isPast      = (ev.date_end||ev.date) < todayStr;
                      const isEvToday   = ev.date <= todayStr && (ev.date_end||ev.date) >= todayStr;
                      const statusColor = isEvToday ? "#f59e0b" : isPast ? "#6b7280" : "#059669";
                      const statusLabel = isEvToday ? "🟡 Hari Ini" : isPast ? "⚫ Selesai" : "🟢 Mendatang";
                      return (
                        <div key={ev.id} style={{ background:"rgba(255,255,255,0.93)",backdropFilter:"blur(12px)",borderRadius:18,border:`1.5px solid ${isExpanded?"rgba(124,58,237,0.4)":"var(--border)"}`,boxShadow:isExpanded?"0 8px 32px rgba(124,58,237,0.12)":"var(--shadow)",transition:"all 0.2s",overflow:"hidden" }}>
                          <div onClick={()=>setExpandedEventId(isExpanded?null:ev.id)} style={{ padding:"16px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
                            <div style={{ width:44,height:44,borderRadius:13,background:isEvToday?"linear-gradient(135deg,#f59e0b,#fbbf24)":isPast?"linear-gradient(135deg,#6b7280,#9ca3af)":"linear-gradient(135deg,#7c3aed,#a855f7)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,boxShadow:"0 4px 12px rgba(0,0,0,0.12)" }}>
                              {ev.event_type==="wedding"?"💍":"🎉"}
                            </div>
                            <div style={{ flex:1,minWidth:0 }}>
                              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:3,flexWrap:"wrap" }}>
                                <p style={{ fontSize:15,fontWeight:800,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{ev.couple}</p>
                                <span style={{ fontSize:10,fontWeight:700,color:statusColor,background:`${statusColor}18`,padding:"2px 8px",borderRadius:8,whiteSpace:"nowrap",flexShrink:0 }}>{statusLabel}</span>
                              </div>
                              <p style={{ fontSize:11,color:"var(--muted)" }}>📅 {formatDate(ev.date)}{ev.date_end && ev.date_end!==ev.date?` – ${formatDate(ev.date_end)}`:""} {ev.venue?`· 📍 ${ev.venue}`:""}</p>
                            </div>
                            <div style={{ display:"flex",gap:12,flexShrink:0 }}>
                              <div style={{ textAlign:"center" }}><p style={{ fontSize:18,fontWeight:800,color:"var(--blue-1)",lineHeight:1 }}>{staffList.length}</p><p style={{ fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase" }}>Daftar</p></div>
                              <div style={{ textAlign:"center" }}><p style={{ fontSize:18,fontWeight:800,color:"#059669",lineHeight:1 }}>{evCheckins.length}</p><p style={{ fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase" }}>Check-in</p></div>
                            </div>
                            <span style={{ fontSize:18,color:"var(--muted)",flexShrink:0,transition:"transform 0.2s",transform:isExpanded?"rotate(180deg)":"rotate(0)" }}>⌄</span>
                          </div>

                          {isExpanded && (
                            <div style={{ borderTop:"1px solid var(--border)",padding:"0 20px 20px" }}>
                              <div style={{ marginTop:16 }}>
                                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                                  <p style={{ fontSize:11,fontWeight:800,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1 }}>Daftar Staff ({staffList.length})</p>
                                  <button onClick={()=>{ setAddStaffPanel(addStaffPanel===ev.id?null:ev.id); setAddStaffName(""); setAddStaffErr(""); }}
                                    style={{ background:"linear-gradient(135deg,#7c3aed,#a855f7)",border:"none",borderRadius:10,padding:"6px 14px",fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer",boxShadow:"0 2px 8px rgba(124,58,237,0.3)" }}>
                                    {addStaffPanel===ev.id?"✕ Batal":"+ Tambah Staff"}
                                  </button>
                                </div>

                                {addStaffPanel===ev.id && (
                                  <div style={{ background:"rgba(124,58,237,0.06)",border:"1.5px solid rgba(124,58,237,0.2)",borderRadius:14,padding:"14px 16px",marginBottom:12 }}>
                                    <p style={{ fontSize:11,fontWeight:700,color:"#7c3aed",marginBottom:10 }}>➕ Tambah Staff oleh Admin</p>
                                    <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                                      <select value={addStaffName} onChange={e=>setAddStaffName(e.target.value)}
                                        style={{ flex:1,minWidth:160,padding:"9px 12px",borderRadius:10,border:"1.5px solid rgba(124,58,237,0.3)",fontSize:13,fontWeight:600,color:"var(--dark)",background:"#fff",outline:"none",cursor:"pointer" }}>
                                        <option value="">— Pilih Staff —</option>
                                        {staffUsers.filter(u=>u.is_active && !staffList.some(s=>s.name.toLowerCase()===u.name.toLowerCase())).map(u=>(
                                          <option key={u.id} value={u.name}>{u.name}{u.jabatan?` (${u.jabatan})`:""}</option>
                                        ))}
                                      </select>
                                      <button onClick={()=>handleAdminAddStaff(ev.id)} disabled={addStaffLoading||!addStaffName}
                                        style={{ padding:"9px 18px",borderRadius:10,border:"none",background:addStaffLoading||!addStaffName?"rgba(124,58,237,0.3)":"linear-gradient(135deg,#7c3aed,#a855f7)",color:"#fff",fontSize:12,fontWeight:800,cursor:addStaffLoading||!addStaffName?"not-allowed":"pointer",whiteSpace:"nowrap" }}>
                                        {addStaffLoading?"Menambah...":"✓ Tambah"}
                                      </button>
                                    </div>
                                    {addStaffErr && <p style={{ fontSize:11,color:"#dc2626",marginTop:8 }}>⚠️ {addStaffErr}</p>}
                                  </div>
                                )}

                                {staffList.length === 0 ? (
                                  <p style={{ fontSize:12,color:"var(--muted)",fontStyle:"italic",textAlign:"center",padding:"16px 0" }}>Belum ada staff terdaftar</p>
                                ) : (
                                  <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                                    {staffList.map(s => {
                                      const ci = evCheckins.find(c =>
                                        (s.user_id && c.staff_user_id && String(c.staff_user_id) === String(s.user_id)) ||
                                        (c.staff_name?.toLowerCase().trim() === s.name?.toLowerCase().trim())
                                      );
                                      return (
                                        <div key={s.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,background:ci?"rgba(16,185,129,0.07)":"rgba(238,244,255,0.6)",border:ci?"1px solid rgba(16,185,129,0.25)":"1px solid rgba(209,221,247,0.5)" }}>
                                          <div style={{ width:34,height:34,borderRadius:10,background:ci?"linear-gradient(135deg,#059669,#10b981)":"linear-gradient(135deg,var(--blue-3),var(--blue-1))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                            <span style={{ color:"#fff",fontSize:13,fontWeight:800 }}>{s.name.charAt(0).toUpperCase()}</span>
                                          </div>
                                          <div style={{ flex:1,minWidth:0 }}>
                                            <p style={{ fontSize:13,fontWeight:700,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</p>
                                            <p style={{ fontSize:10,color:"var(--muted)" }}>{s.role||"Staff"}</p>
                                          </div>
                                          <div style={{ flexShrink:0,textAlign:"right" }}>
                                            {ci
                                              ? <span style={{ fontSize:10,fontWeight:700,color:"#059669",background:"rgba(16,185,129,0.1)",padding:"3px 8px",borderRadius:8,display:"block",marginBottom:4 }}>✅ {formatTime(ci.checked_in_at)}</span>
                                              : <span style={{ fontSize:10,fontWeight:700,color:"#ef4444",background:"rgba(239,68,68,0.08)",padding:"3px 8px",borderRadius:8,display:"block",marginBottom:4 }}>⛔ Belum CI</span>
                                            }
                                          </div>
                                          <div style={{ display:"flex",flexDirection:"column",gap:4,flexShrink:0,alignItems:"flex-end" }}>
                                            <div style={{ display:"flex",gap:5 }}>
                                              {!ci && (
                                                <button
                                                  onClick={()=>handleAdminCheckin(ev, s)}
                                                  disabled={!!adminCheckinLoading[s.id]}
                                                  title="Check-in staff ini sebagai admin"
                                                  style={{ padding:"5px 10px",borderRadius:8,border:"1px solid rgba(245,158,11,0.35)",background:adminCheckinLoading[s.id]?"rgba(245,158,11,0.05)":"rgba(245,158,11,0.1)",fontSize:10,fontWeight:700,color:"#b45309",cursor:adminCheckinLoading[s.id]?"not-allowed":"pointer",whiteSpace:"nowrap",opacity:adminCheckinLoading[s.id]?0.6:1 }}>
                                                  {adminCheckinLoading[s.id] ? "⏳..." : "⚡ CI"}
                                                </button>
                                              )}
                                              {ci && (
                                                <button onClick={()=>handleAdminDeleteCheckin(ci.id)}
                                                  style={{ padding:"5px 10px",borderRadius:8,border:"1px solid rgba(16,185,129,0.25)",background:"rgba(16,185,129,0.08)",fontSize:10,fontWeight:700,color:"#059669",cursor:"pointer",whiteSpace:"nowrap" }}>
                                                  🗑️ CI
                                                </button>
                                              )}
                                              <button onClick={()=>handleAdminDeleteRegistration(s.id, ev.id)}
                                                style={{ padding:"5px 10px",borderRadius:8,border:"1px solid rgba(239,68,68,0.2)",background:"rgba(239,68,68,0.07)",fontSize:10,fontWeight:700,color:"#ef4444",cursor:"pointer",whiteSpace:"nowrap" }}>
                                                🗑️ Daftar
                                              </button>
                                            </div>
                                            {adminCheckinErr[s.id] && (
                                              <span style={{ fontSize:9,color:"#dc2626",maxWidth:120,textAlign:"right",lineHeight:1.3 }}>⚠️ {adminCheckinErr[s.id]}</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

        </main>
        <footer style={{ textAlign:"center",padding:"24px 0 16px",color:"var(--muted)",fontSize:11,opacity:0.4,position:"relative",zIndex:1 }}>Created by GG & Caramolly</footer>
      </div>
    </>
  );
}
