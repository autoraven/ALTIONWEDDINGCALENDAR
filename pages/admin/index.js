import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().split("T")[0];
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [form, setForm] = useState({ couple:"", venue:"", time:"", notes:"" });
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const { maxWeddingsPerWeek, businessName } = CALENDAR_CONFIG;

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch (err) {
      console.error("Gagal fetch events:", err);
    }
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      setIsLoggedIn(true);
      fetchEvents();
    }
  }, [fetchEvents]);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      sessionStorage.setItem("admin_auth", "true");
      setIsLoggedIn(true);
      fetchEvents();
    } else {
      setLoginError(data.message);
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    setFormError("");
    if (!form.couple.trim()) return setFormError("Nama pasangan wajib diisi");

    const weekKey = getWeekKey(selectedDate);
    const count = events.filter(ev => getWeekKey(ev.date) === weekKey).length;
    if (count >= maxWeddingsPerWeek) return setFormError(`Minggu ini sudah penuh (maks. ${maxWeddingsPerWeek})`);
    if (events.find(ev => ev.date === selectedDate)) return setFormError("Tanggal ini sudah ada event");

    setLoading(true);
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, date: selectedDate }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) return setFormError(data.error);

    setEvents(prev => [...prev, data]);
    setForm({ couple:"", venue:"", time:"", notes:"" });
    setShowForm(false);
    setSuccess("✅ Event berhasil ditambahkan & notif Discord terkirim!");
    setTimeout(() => setSuccess(""), 4000);
  }

  async function handleDelete(id) {
    if (!confirm("Hapus event ini?")) return;
    setLoading(true);
    const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) {
      setEvents(prev => prev.filter(e => e.id !== id));
      setSuccess("🗑️ Event dihapus, notif Discord terkirim.");
      setTimeout(() => setSuccess(""), 3000);
    }
  }

  function logout() {
    sessionStorage.removeItem("admin_auth");
    setIsLoggedIn(false);
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date();
  today.setHours(0,0,0,0);

  function getDayStatus(day) {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const hasEvent = events.find(e => e.date === dateStr);
    if (hasEvent) return { status: "booked", event: hasEvent };
    const weekKey = getWeekKey(dateStr);
    const count = events.filter(ev => getWeekKey(ev.date) === weekKey).length;
    if (count >= maxWeddingsPerWeek) return { status: "full" };
    const d = new Date(dateStr);
    if (d < today) return { status: "past" };
    return { status: "available" };
  }

  function handleDayClick(day) {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const { status } = getDayStatus(day);
    if (status === "available") {
      setSelectedDate(dateStr);
      setForm({ couple:"", venue:"", time:"", notes:"" });
      setFormError("");
      setShowForm(true);
    }
  }

  // ── LOGIN SCREEN ──────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <>
        <Head>
          <title>Admin Login — {businessName}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div className="card" style={{ width:"100%", maxWidth:400, padding:40 }}>
            <div style={{ textAlign:"center", marginBottom:32 }}>
              <h1 style={{ fontSize:28, fontWeight:400, letterSpacing:1 }}>{businessName}</h1>
              <p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>Admin Panel</p>
            </div>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom:16 }}>
                <label className="label">Username</label>
                <input className="input" value={username} onChange={e=>setUsername(e.target.value)} required autoFocus />
              </div>
              <div style={{ marginBottom:16 }}>
                <label className="label">Password</label>
                <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
              </div>
              {loginError && <p style={{ color:"var(--red)", fontSize:13, marginBottom:12 }}>{loginError}</p>}
              <button type="submit" className="btn btn-primary" style={{ width:"100%" }} disabled={loading}>
                {loading ? "Masuk..." : "Masuk"}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ── ADMIN DASHBOARD ───────────────────────────────────────
  return (
    <>
      <Head>
        <title>Admin — {businessName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
        {/* Header */}
        <header style={{
          background:"linear-gradient(135deg, #0d6ecc 0%, #1a8fff 60%, #42b0ff 100%)",
          padding:"0 32px", height:72,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          boxShadow:"0 4px 24px rgba(13,110,204,0.35)",
          position:"sticky", top:0, zIndex:100,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <h1 style={{ fontSize:20, fontWeight:600, color:"#fff", letterSpacing:0.5 }}>{businessName}</h1>
            <span style={{ background:"rgba(255,255,255,0.2)", color:"#fff", fontSize:11, fontWeight:600,
              padding:"3px 10px", borderRadius:20, letterSpacing:1 }}>ADMIN</span>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <Link href="/" className="btn btn-ghost" style={{ fontSize:13 }}>Lihat Kalender</Link>
            <button onClick={logout} className="btn btn-ghost" style={{ fontSize:13 }}>Logout</button>
          </div>
        </header>

        <main style={{ maxWidth:900, margin:"0 auto", padding:"32px 16px" }}>
          {success && (
            <div style={{
              background:"rgba(15,184,122,0.1)", border:"1px solid var(--green)",
              borderRadius:8, padding:"12px 18px", marginBottom:20,
              color:"var(--green)", fontSize:14, fontWeight:500,
            }}>{success}</div>
          )}

          {/* Kalender */}
          <div className="card" style={{ padding:28, marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <button onClick={()=>setCurrentDate(new Date(year, month-1, 1))} className="btn btn-outline" style={{ padding:"6px 16px" }}>‹</button>
              <h2 style={{ fontSize:20, fontWeight:400 }}>{MONTHS[month]} {year}</h2>
              <button onClick={()=>setCurrentDate(new Date(year, month+1, 1))} className="btn btn-outline" style={{ padding:"6px 16px" }}>›</button>
            </div>

            {/* Legend */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:18, fontSize:12, color:"var(--muted)" }}>
              {[
                { color:"var(--green)", label:"Tersedia (klik untuk tambah)" },
                { color:"#f59e0b", label:"Sudah dipesan" },
                { color:"var(--red)", label:"Minggu penuh" },
                { color:"#cbd5e1", label:"Lewat/tidak tersedia" },
              ].map(({color,label}) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:600,
                  color:"var(--muted)", padding:"6px 0", letterSpacing:0.5 }}>{d}</div>
              ))}
              {Array.from({length: startOffset}).map((_,i) => <div key={`e${i}`} />)}
              {Array.from({length: daysInMonth}, (_,i) => i+1).map(day => {
                const { status, event } = getDayStatus(day);
                const isToday = new Date(year,month,day).toDateString() === today.toDateString();
                const bg = {
                  available: "rgba(15,184,122,0.12)",
                  booked:    "rgba(245,158,11,0.15)",
                  full:      "rgba(229,62,62,0.10)",
                  past:      "rgba(203,213,225,0.3)",
                }[status];
                const textColor = {
                  available: "var(--green)",
                  booked:    "#92400e",
                  full:      "var(--red)",
                  past:      "#94a3b8",
                }[status];
                return (
                  <div key={day} onClick={() => handleDayClick(day)}
                    title={event ? `${event.couple} — ${event.venue}` : ""}
                    style={{
                      background: bg, color: textColor,
                      borderRadius:8, padding:"10px 4px", textAlign:"center",
                      cursor: status === "available" ? "pointer" : "default",
                      border: isToday ? "2px solid var(--blue-2)" : "2px solid transparent",
                      fontWeight: isToday ? 700 : 500,
                      fontSize:14, transition:"all 0.15s",
                      position:"relative",
                    }}>
                    {day}
                    {status === "booked" && (
                      <div style={{ position:"absolute", bottom:3, left:"50%", transform:"translateX(-50%)",
                        width:5, height:5, borderRadius:"50%", background:"#f59e0b" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Tambah Event */}
          {showForm && (
            <div className="card" style={{ padding:28, marginBottom:28, borderLeft:"4px solid var(--blue-2)" }}>
              <h3 style={{ fontSize:16, fontWeight:600, marginBottom:20 }}>
                ➕ Tambah Wedding — {new Date(selectedDate).toLocaleDateString("id-ID",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
              </h3>
              <form onSubmit={handleAddEvent}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  <div>
                    <label className="label">Nama Pasangan *</label>
                    <input className="input" placeholder="Budi & Ani" value={form.couple} onChange={e=>setForm({...form,couple:e.target.value})} required />
                  </div>
                  <div>
                    <label className="label">Venue</label>
                    <input className="input" placeholder="The Grand Ballroom" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Waktu</label>
                    <input className="input" type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Catatan</label>
                    <input className="input" placeholder="Catatan tambahan..." value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
                  </div>
                </div>
                {formError && <p style={{ color:"var(--red)", fontSize:13, marginTop:10 }}>{formError}</p>}
                <div style={{ display:"flex", gap:10, marginTop:18 }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Menyimpan..." : "💾 Simpan & Kirim ke Discord"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={()=>setShowForm(false)}>Batal</button>
                </div>
              </form>
            </div>
          )}

          {/* Daftar Events */}
          <div className="card" style={{ padding:28 }}>
            <h3 style={{ fontSize:16, fontWeight:600, marginBottom:20 }}>
              📋 Semua Wedding ({events.length})
            </h3>
            {events.length === 0 ? (
              <p style={{ color:"var(--muted)", textAlign:"center", padding:"24px 0" }}>
                Belum ada wedding. Klik tanggal hijau di kalender untuk menambahkan.
              </p>
            ) : (
              <div style={{ display:"grid", gap:10 }}>
                {events.sort((a,b) => a.date.localeCompare(b.date)).map(ev => (
                  <div key={ev.id} style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"14px 18px", borderRadius:8, background:"var(--bg2)",
                    border:"1px solid var(--border)",
                  }}>
                    <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
                      <span style={{ fontWeight:600, fontSize:14 }}>{ev.couple}</span>
                      <span style={{ color:"var(--muted)", fontSize:13 }}>
                        📅 {new Date(ev.date).toLocaleDateString("id-ID",{weekday:"short",year:"numeric",month:"short",day:"numeric"})}
                      </span>
                      {ev.venue && <span style={{ color:"var(--muted)", fontSize:13 }}>🏛️ {ev.venue}</span>}
                      {ev.time && <span style={{ color:"var(--muted)", fontSize:13 }}>🕐 {ev.time}</span>}
                    </div>
                    <button onClick={()=>handleDelete(ev.id)} className="btn btn-danger" disabled={loading}>Hapus</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}
