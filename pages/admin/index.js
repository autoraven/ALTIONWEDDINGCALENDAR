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

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
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
  const [eventType, setEventType] = useState("");
  const [form, setForm] = useState({ couple:"", venue:"", time:"", notes:"", addon:"" });
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [monthDir, setMonthDir] = useState(null);
  const [monthKey, setMonthKey] = useState(0);
  const { businessName } = CALENDAR_CONFIG;

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    if (Array.isArray(data)) setEvents(data);
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
    const res = await fetch("/api/auth", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem("admin_auth","true");
      setIsLoggedIn(true);
      fetchEvents();
    } else {
      setLoginError(data.message);
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault();
    setFormError("");
    if (!form.couple.trim()) return setFormError(eventType === "wedding" ? "Nama pasangan wajib diisi" : "Nama event wajib diisi");
    if (events.find(ev => ev.date === selectedDate)) return setFormError("Tanggal ini sudah ada event");

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, date: selectedDate, event_type: eventType }),
    });
    const data = await res.json();
    if (data.error) return setFormError(data.error);

    setEvents(prev => [...prev, data]);
    setForm({ couple:"", venue:"", time:"", notes:"", addon:"" });
    setEventType("");
    setShowForm(false);
    setSuccess("Event berhasil ditambahkan!");
    setTimeout(() => setSuccess(""), 3500);
  }

  async function handleDelete(id) {
    if (!confirm("Hapus event ini?")) return;
    const res = await fetch(`/api/events?id=${id}`, { method: "DELETE" });
    if (res.ok) setEvents(prev => prev.filter(e => e.id !== id));
  }

  function handleDayClick(dateStr, status) {
    if (status === "past") return;
    setSelectedDate(dateStr);
    setEventType("");
    setForm({ couple:"", venue:"", time:"", notes:"", addon:"" });
    setFormError("");
    setShowForm(true);
  }

  function logout() { sessionStorage.removeItem("admin_auth"); setIsLoggedIn(false); }

  function goMonth(direction) {
    setMonthDir(direction > 0 ? 'right' : 'left');
    setMonthKey(k => k + 1);
    setCurrentDate(new Date(year, month + direction, 1));
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date(); today.setHours(0,0,0,0);

  function getDayStatus(day) {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const event = events.find(e => e.date === dateStr);
    if (event) return { status:"booked", event };
    if (new Date(dateStr) < today) return { status:"past" };
    if (isWeekend(dateStr)) return { status:"available" };
    return { status:"conditional" };
  }

  // ─── LOGIN ───
  if (!isLoggedIn) return (
    <>
      <Head><title>Admin Login — {businessName}</title><link rel="icon" href="/favicon.ico" /></Head>
      <div style={{
        minHeight:"100vh",
        background:"linear-gradient(135deg, #0a4f9a 0%, #1a8fff 50%, #42b0ff 100%)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:20,
        position:"relative", overflow:"hidden",
      }}>
        {/* Animated background orbs for login */}
        <div style={{
          position:"fixed", top:-120, right:-80, width:400, height:400,
          borderRadius:"50%", background:"rgba(255,255,255,0.06)",
          pointerEvents:"none",
          animation:"orbDrift1 18s ease-in-out infinite",
        }} />
        <div style={{
          position:"fixed", bottom:-100, left:-60, width:300, height:300,
          borderRadius:"50%", background:"rgba(255,255,255,0.05)",
          pointerEvents:"none",
          animation:"orbDrift2 22s ease-in-out infinite",
        }} />
        <div style={{
          position:"fixed", top:"40%", left:"30%", width:200, height:200,
          borderRadius:"50%", background:"rgba(255,255,255,0.04)",
          pointerEvents:"none",
          animation:"orbDrift3 15s ease-in-out infinite",
        }} />

        {/* Ring decorations */}
        <div style={{
          position:"fixed", top:"10%", left:"5%",
          width:180, height:180, borderRadius:"50%",
          border:"1px solid rgba(255,255,255,0.12)",
          pointerEvents:"none",
          animation:"loginRing 12s ease-in-out infinite",
        }} />
        <div style={{
          position:"fixed", bottom:"15%", right:"8%",
          width:120, height:120, borderRadius:"50%",
          border:"1px solid rgba(255,255,255,0.1)",
          pointerEvents:"none",
          animation:"loginRing 9s ease-in-out infinite 2s",
        }} />

        {/* Sparkles */}
        <div className="sparkle-container">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="sparkle" style={{ background:"rgba(255,255,255,0.6)" }} />
          ))}
        </div>

        <div
          className="anim-calendar"
          style={{ background:"#fff", width:"100%", maxWidth:420, borderRadius:20, overflow:"hidden", boxShadow:"0 24px 80px rgba(10,79,154,0.4)", position:"relative", zIndex:1 }}
        >
          <div style={{ background:"linear-gradient(135deg, #0d6ecc, #1a8fff)", padding:"36px 36px 28px", textAlign:"center", position:"relative", overflow:"hidden" }}>
            {/* Inner glow */}
            <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }} />
            <div
              style={{
                width:64, height:64, borderRadius:16, background:"rgba(255,255,255,0.2)",
                backdropFilter:"blur(8px)", border:"2px solid rgba(255,255,255,0.4)",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 16px", padding:8, overflow:"hidden",
                transition:"transform 0.4s ease",
                position:"relative", zIndex:1,
              }}
              onMouseEnter={e => e.currentTarget.style.transform="rotate(8deg) scale(1.08)"}
              onMouseLeave={e => e.currentTarget.style.transform=""}
            >
              <img src="/logo.png" alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <h1 style={{ color:"#fff", fontSize:26, fontWeight:400, letterSpacing:1, position:"relative", zIndex:1 }}>{businessName}</h1>
            <p style={{ color:"rgba(255,255,255,0.75)", fontSize:11, letterSpacing:2, marginTop:4, textTransform:"uppercase", fontFamily:"Plus Jakarta Sans,sans-serif", position:"relative", zIndex:1 }}>Admin Panel</p>
          </div>
          <form onSubmit={handleLogin} style={{ padding:"32px 36px" }}>
            {loginError && (
              <div className="notif-enter" style={{ background:"#fff0f0", border:"1px solid #fed7d7", color:"#c53030", padding:"10px 14px", borderRadius:8, marginBottom:20, fontSize:13 }}>
                ⚠️ {loginError}
              </div>
            )}
            {[
              { label:"Username", value:username, setter:setUsername, type:"text", placeholder:"Masukkan username" },
              { label:"Password", value:password, setter:setPassword, type:"password", placeholder:"Masukkan password" },
            ].map(({ label, value, setter, type, placeholder }) => (
              <div key={label} style={{ marginBottom:18 }}>
                <label className="label">{label}</label>
                <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder} className="input" required />
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ width:"100%", marginTop:4, padding:"12px", fontSize:14 }}>
              Masuk ke Dashboard
            </button>
            <div style={{ marginTop:20, textAlign:"center" }}>
              <Link href="/" style={{ fontSize:12, color:"var(--muted)", textDecoration:"none" }}>← Kembali ke Kalender Publik</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  // ─── DASHBOARD ───
  const thisMonthEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <>
      <Head><title>Admin Dashboard — {businessName}</title><link rel="icon" href="/favicon.ico" /></Head>

      {/* Background decorations */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="ring-deco ring-deco-1" />
      <div className="ring-deco ring-deco-4" />

      <div style={{ minHeight:"100vh", background:"var(--bg)", position:"relative", zIndex:1 }}>

        {/* Header */}
        <header
          className="anim-header"
          style={{
            background:"linear-gradient(135deg, #0d6ecc 0%, #1a8fff 60%, #42b0ff 100%)",
            padding:"0 32px", height:72,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            boxShadow:"0 4px 24px rgba(13,110,204,0.35)",
            position:"sticky", top:0, zIndex:100,
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div
              style={{
                width:42, height:42, borderRadius:10,
                background:"rgba(255,255,255,0.2)", backdropFilter:"blur(8px)",
                display:"flex", alignItems:"center", justifyContent:"center",
                overflow:"hidden", padding:4, border:"1.5px solid rgba(255,255,255,0.35)",
                transition:"transform 0.3s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.transform="rotate(-8deg) scale(1.08)"}
              onMouseLeave={e => e.currentTarget.style.transform=""}
            >
              <img src="/logo.png" alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <div>
              <h1 style={{ color:"#fff", fontSize:18, fontWeight:400, letterSpacing:0.5, lineHeight:1.1 }}>{businessName}</h1>
              <p style={{ color:"rgba(255,255,255,0.7)", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"Plus Jakarta Sans,sans-serif" }}>Dashboard Admin</p>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Link href="/" className="btn btn-ghost" style={{ fontSize:12 }}>Lihat Kalender</Link>
            <button onClick={logout} className="btn btn-danger" style={{ fontSize:12 }}>Logout</button>
          </div>
        </header>

        <main style={{ maxWidth:1080, margin:"0 auto", padding:"32px 20px" }}>
          {success && (
            <div className="notif-enter" style={{ background:"#f0fff4", border:"1px solid #9ae6b4", color:"#276749", padding:"12px 20px", borderRadius:10, marginBottom:24, fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
              ✅ {success}
            </div>
          )}

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16, marginBottom:32 }}>
            {[
              { label:"Total Event", value:events.length, icon:"📅" },
              { label:"Bulan Ini", value:thisMonthEvents.length, icon:"🗓️" },
              { label:"Wedding", value:events.filter(e=>e.event_type==="wedding").length, icon:"💍" },
              { label:"Event Biasa", value:events.filter(e=>e.event_type==="event").length, icon:"🎉" },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="card anim-stat"
                style={{ padding:"20px 24px", textAlign:"center", transition:"transform 0.2s ease, box-shadow 0.2s ease" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-4px)"; e.currentTarget.style.boxShadow="var(--shadow)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="var(--shadow-sm)"; }}
              >
                <div style={{ fontSize:24, marginBottom:8 }}>{icon}</div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:40, background:"linear-gradient(135deg,#1a8fff,#0d6ecc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:1.5, textTransform:"uppercase", marginTop:6, fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:24, alignItems:"start" }}>
            {/* Calendar */}
            <div className="card anim-calendar" style={{ overflow:"hidden" }}>
              <div style={{
                background:"linear-gradient(135deg, #0a4f9a, #1a8fff)",
                padding:"18px 24px",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                position:"relative", overflow:"hidden",
              }}>
                <div style={{ position:"absolute", inset:0, background:"linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.05) 60%, transparent 80%)", pointerEvents:"none" }} />

                <button
                  onClick={() => goMonth(-1)}
                  style={{
                    background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)",
                    color:"#fff", width:34, height:34, borderRadius:8, fontSize:16, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.18s", position:"relative", zIndex:1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.28)"; e.currentTarget.style.transform="scale(1.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.15)"; e.currentTarget.style.transform=""; }}
                >‹</button>

                <h2
                  key={monthKey}
                  className={monthDir === 'right' ? 'month-enter' : monthDir === 'left' ? 'month-enter-left' : ''}
                  style={{ color:"#fff", fontSize:22, fontWeight:300, letterSpacing:2, position:"relative", zIndex:1 }}
                >
                  {MONTHS[month]} {year}
                </h2>

                <button
                  onClick={() => goMonth(1)}
                  style={{
                    background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)",
                    color:"#fff", width:34, height:34, borderRadius:8, fontSize:16, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.18s", position:"relative", zIndex:1,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.28)"; e.currentTarget.style.transform="scale(1.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.15)"; e.currentTarget.style.transform=""; }}
                >›</button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"var(--bg2)", borderBottom:"1px solid var(--border)" }}>
                {DAYS.map(d => <div key={d} style={{ textAlign:"center", padding:"10px 0", fontSize:9, fontWeight:700, letterSpacing:1.5, color:"var(--muted)", textTransform:"uppercase" }}>{d}</div>)}
              </div>

              <div
                key={`grid-${monthKey}`}
                className={monthDir ? (monthDir === 'right' ? 'month-enter' : 'month-enter-left') : ''}
                style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}
              >
                {Array.from({ length:startOffset }).map((_,i) => (
                  <div key={i} style={{ minHeight:64, background:"#fafcff", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }} />
                ))}
                {Array.from({ length:daysInMonth }, (_,i) => i+1).map(day => {
                  const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const { status, event } = getDayStatus(day);
                  const isSelected = selectedDate === dateStr;
                  const isToday = new Date(dateStr).toDateString() === today.toDateString();
                  const canClick = status !== "past";

                  const dotColor = { booked:"#1a8fff", conditional:"#e53e3e", past:"#ddd", available:"#0fb87a" }[status];
                  const bg = isSelected ? "#dbeeff"
                    : status === "booked" ? "#e8f4ff"
                    : status === "conditional" ? "#fff0f0"
                    : status === "past" ? "#fafafa"
                    : "#fff";

                  return (
                    <div
                      key={day}
                      onClick={() => handleDayClick(dateStr, status)}
                      className={canClick ? "cal-day-interactive" : ""}
                      style={{
                        minHeight:64, background:bg, padding:"8px 8px 6px",
                        borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)",
                        cursor: canClick ? "pointer" : "default",
                        display:"flex", flexDirection:"column",
                        outline:isSelected?"2px solid var(--blue-2)":"none", outlineOffset:-2,
                      }}
                    >
                      <div
                        className={isToday ? "today-badge" : ""}
                        style={{
                          width:24, height:24, borderRadius:6,
                          background:isToday?"linear-gradient(135deg,#1a8fff,#0d6ecc)":"transparent",
                          display:"flex", alignItems:"center", justifyContent:"center",
                        }}
                      >
                        <span style={{ fontSize:12, fontWeight:isToday?700:400, color:isToday?"#fff":status==="past"?"#ccc":"var(--dark)", fontFamily:"Plus Jakarta Sans,sans-serif" }}>
                          {day}
                        </span>
                      </div>
                      <div style={{ marginTop:"auto" }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:dotColor }} />
                        {status==="booked"&&event&&(
                          <span style={{ fontSize:8, color:"var(--blue-dark)", display:"block", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600 }}>
                            {event.event_type==="wedding" ? "💍" : "🎉"} {event.couple}
                          </span>
                        )}
                        {status==="conditional"&&(
                          <span style={{ fontSize:7, color:"#e53e3e", display:"block", marginTop:2, fontWeight:600, lineHeight:1.2 }}>Bersyarat</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ padding:"10px 16px", background:"var(--bg2)", borderTop:"1px solid var(--border)", display:"flex", gap:16, flexWrap:"wrap" }}>
                {[
                  { color:"#0fb87a", label:"Weekend (tersedia)" },
                  { color:"#e53e3e", label:"Pendaftaran bersyarat" },
                  { color:"#1a8fff", label:"Sudah dipesan" },
                ].map(({color,label}) => (
                  <p key={label} style={{ fontSize:10, color:"var(--muted)", display:"flex", alignItems:"center", gap:5 }}>
                    <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:color }} />
                    {label}
                  </p>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {/* Add form */}
              {showForm && (
                <div className="card detail-enter" style={{ padding:24, borderTop:"3px solid var(--blue-2)" }}>
                  <h3 style={{ fontSize:20, fontWeight:400, marginBottom:4, color:"var(--blue-dark)" }}>Tambah Event</h3>
                  <p style={{ fontSize:12, color:"var(--muted)", marginBottom:16, fontFamily:"Plus Jakarta Sans,sans-serif" }}>
                    📅 {selectedDate}
                    {!isWeekend(selectedDate) && (
                      <span style={{ marginLeft:8, background:"#fff0f0", color:"#e53e3e", fontSize:10, padding:"2px 8px", borderRadius:10, fontWeight:600 }}>
                        ⚠️ Hari kerja — pendaftaran bersyarat
                      </span>
                    )}
                  </p>

                  {!eventType && (
                    <div>
                      <label className="label" style={{ marginBottom:12 }}>Pilih Tipe Event</label>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {[
                          { type:"wedding", icon:"💍", label:"Wedding" },
                          { type:"event", icon:"🎉", label:"Event Biasa" },
                        ].map(({ type, icon, label }) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setEventType(type)}
                            style={{
                              padding:"16px 10px", border:"2px solid var(--border)", borderRadius:10,
                              background:"#fff", cursor:"pointer", textAlign:"center",
                              transition:"all 0.18s ease",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor="#1a8fff"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="var(--shadow-sm)"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform=""; e.currentTarget.style.boxShadow="none"; }}
                          >
                            <div style={{ fontSize:24, marginBottom:6 }}>{icon}</div>
                            <div style={{ fontSize:13, fontWeight:600, color:"var(--dark)" }}>{label}</div>
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ width:"100%", marginTop:12 }}>Batal</button>
                    </div>
                  )}

                  {eventType && (
                    <>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                        <span style={{ background: eventType==="wedding" ? "rgba(26,143,255,0.1)" : "rgba(15,184,122,0.1)", color: eventType==="wedding" ? "var(--blue-dark)" : "#0a6b50", fontSize:12, fontWeight:600, padding:"4px 12px", borderRadius:20 }}>
                          {eventType==="wedding" ? "💍 Wedding" : "🎉 Event Biasa"}
                        </span>
                        <button type="button" onClick={() => setEventType("")} style={{ fontSize:11, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                          Ganti
                        </button>
                      </div>

                      {formError && (
                        <div className="notif-enter" style={{ background:"#fff0f0", color:"#c53030", padding:"8px 12px", fontSize:12, borderRadius:8, marginBottom:14, border:"1px solid #fed7d7" }}>
                          ⚠️ {formError}
                        </div>
                      )}

                      <form onSubmit={handleAddEvent}>
                        <div style={{ marginBottom:14 }}>
                          <label className="label">{eventType==="wedding" ? "Nama Pasangan *" : "Nama Event *"}</label>
                          <input value={form.couple} onChange={e => setForm({...form, couple:e.target.value})}
                            placeholder={eventType==="wedding" ? "Budi & Siti" : "Nama event..."}
                            className="input" />
                        </div>
                        {[
                          { label:"Venue / Lokasi", key:"venue", placeholder:"Grand Ballroom Hotel XYZ" },
                          { label:"Jam Acara", key:"time", placeholder:"10:00 WIB" },
                          { label:"Catatan", key:"notes", placeholder:"Info tambahan..." },
                          { label:"Add On", key:"addon", placeholder:"Dekorasi, Catering, dll..." },
                        ].map(({ label, key, placeholder }) => (
                          <div key={key} style={{ marginBottom:14 }}>
                            <label className="label">{label}</label>
                            <input value={form[key]} onChange={e => setForm({...form, [key]:e.target.value})}
                              placeholder={placeholder} className="input" />
                          </div>
                        ))}
                        <div style={{ display:"flex", gap:10, marginTop:8 }}>
                          <button type="submit" className="btn btn-primary" style={{ flex:1 }}>Simpan</button>
                          <button type="button" onClick={() => { setShowForm(false); setEventType(""); }} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* Event list */}
              <div className="card anim-contact" style={{ overflow:"hidden" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", background:"var(--bg2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <h3 style={{ fontSize:18, fontWeight:400, color:"var(--mid)" }}>Semua Event</h3>
                  <span style={{ background:"linear-gradient(135deg,#1a8fff,#0d6ecc)", color:"#fff", fontSize:12, fontWeight:600, padding:"2px 10px", borderRadius:20, fontFamily:"Plus Jakarta Sans,sans-serif" }}>{events.length}</span>
                </div>
                <div style={{ maxHeight:460, overflowY:"auto" }}>
                  {events.length === 0 && (
                    <div style={{ padding:"32px", textAlign:"center" }}>
                      <p style={{ fontSize:28, marginBottom:8 }}>📅</p>
                      <p style={{ fontSize:13, color:"var(--muted)" }}>Belum ada event</p>
                    </div>
                  )}
                  {[...events].sort((a,b) => a.date.localeCompare(b.date)).map(event => (
                    <div
                      key={event.id}
                      style={{
                        padding:"14px 20px", borderBottom:"1px solid var(--border)",
                        display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12,
                        transition:"background 0.15s ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background="#f8fbff"}
                      onMouseLeave={e => e.currentTarget.style.background=""}
                    >
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                          <span style={{ fontSize:10, background: event.event_type==="wedding" ? "rgba(26,143,255,0.1)" : "rgba(15,184,122,0.1)", color: event.event_type==="wedding" ? "var(--blue-dark)" : "#0a6b50", padding:"1px 7px", borderRadius:10, fontWeight:600 }}>
                            {event.event_type==="wedding" ? "💍 Wedding" : "🎉 Event"}
                          </span>
                        </div>
                        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"var(--dark)", marginBottom:2 }}>{event.couple}</p>
                        <p style={{ fontSize:11, color:"var(--blue-2)", fontWeight:600, marginBottom:2 }}>{event.date}</p>
                        {event.venue && <p style={{ fontSize:11, color:"var(--muted)" }}>📍 {event.venue}</p>}
                        {event.time  && <p style={{ fontSize:11, color:"var(--muted)" }}>🕐 {event.time}</p>}
                        {event.addon && <p style={{ fontSize:11, color:"var(--muted)" }}>✨ {event.addon}</p>}
                      </div>
                      <button onClick={() => handleDelete(event.id)} className="btn btn-danger" style={{ flexShrink:0 }}>Hapus</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer style={{ textAlign:"center", padding:"24px 0 16px", color:"var(--muted)", fontSize:11, opacity:0.5, position:"relative", zIndex:1 }}>
          Created by GG
        </footer>
      </div>
    </>
  );
}
