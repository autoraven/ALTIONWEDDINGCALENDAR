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
      <div style={{ minHeight:"100vh", background:"linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--blue-1) 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-100, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-80, left:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.03)", pointerEvents:"none" }} />

        <div style={{ background:"#fff", width:"100%", maxWidth:420, borderRadius:24, overflow:"hidden", boxShadow:"0 32px 80px rgba(10,22,40,0.5)" }}>
          <div style={{ background:"linear-gradient(135deg, var(--navy), var(--blue-1))", padding:"40px 40px 32px", textAlign:"center" }}>
            <div style={{ width:68, height:68, borderRadius:18, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", border:"2px solid rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 18px", padding:8, overflow:"hidden" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <h1 style={{ color:"#fff", fontSize:28, fontWeight:800, letterSpacing:-0.5 }}>{businessName}</h1>
            <p style={{ color:"rgba(255,255,255,0.5)", fontSize:11, letterSpacing:3, marginTop:6, textTransform:"uppercase", fontWeight:600 }}>Admin Panel</p>
          </div>
          <form onSubmit={handleLogin} style={{ padding:"36px 40px" }}>
            {loginError && (
              <div style={{ background:"#fff0f0", border:"1px solid #fecaca", color:"#dc2626", padding:"10px 14px", borderRadius:12, marginBottom:20, fontSize:13, fontWeight:500 }}>
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
            <button type="submit" className="btn btn-primary" style={{ width:"100%", marginTop:6, padding:"13px", fontSize:14 }}>
              Masuk ke Dashboard
            </button>
            <div style={{ marginTop:20, textAlign:"center" }}>
              <Link href="/" style={{ fontSize:12, color:"var(--muted)", textDecoration:"none", fontWeight:500 }}>← Kembali ke Kalender</Link>
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
      <div style={{ minHeight:"100vh", background:"var(--bg)" }}>

        {/* Header */}
        <header style={{
          background: "linear-gradient(135deg, var(--navy) 0%, var(--navy-mid) 50%, var(--blue-1) 100%)",
          padding: "0 40px", height: 68,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 4px 32px rgba(10,22,40,0.4)",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:5, border:"1.5px solid rgba(255,255,255,0.2)" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <div>
              <span style={{ color:"#fff", fontSize:17, fontWeight:800, letterSpacing:-0.5, display:"block", lineHeight:1.1 }}>{businessName}</span>
              <span style={{ color:"rgba(255,255,255,0.45)", fontSize:9, letterSpacing:2.5, textTransform:"uppercase", fontWeight:600 }}>Dashboard Admin</span>
            </div>
          </div>
          <div style={{ display:"flex", gap:10 }}>
            <Link href="/" className="btn btn-ghost" style={{ fontSize:12, padding:"8px 18px" }}>Lihat Kalender</Link>
            <button onClick={logout} className="btn btn-danger" style={{ fontSize:12, padding:"8px 18px" }}>Logout</button>
          </div>
        </header>

        <main style={{ maxWidth:1080, margin:"0 auto", padding:"32px 20px" }}>
          {success && (
            <div style={{ background:"#f0fdf4", border:"1px solid #86efac", color:"#15803d", padding:"12px 20px", borderRadius:14, marginBottom:24, fontSize:13, fontWeight:600 }}>
              ✅ {success}
            </div>
          )}

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:16, marginBottom:28 }}>
            {[
              { label:"Total Event", value:events.length, icon:"📅", color:"var(--blue-2)" },
              { label:"Bulan Ini",   value:thisMonthEvents.length, icon:"🗓️", color:"var(--blue-1)" },
              { label:"Wedding",     value:events.filter(e=>e.event_type==="wedding").length, icon:"💍", color:"#7c3aed" },
              { label:"Event Biasa", value:events.filter(e=>e.event_type==="event").length, icon:"🎉", color:"#059669" },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="card" style={{ padding:"22px 24px", textAlign:"center", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ fontSize:22, marginBottom:10 }}>{icon}</div>
                <div style={{ fontSize:38, fontWeight:800, color, lineHeight:1, letterSpacing:-1, marginBottom:6 }}>{value}</div>
                <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:1.5, textTransform:"uppercase", fontWeight:700 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 380px", gap:24, alignItems:"start" }}>
            {/* Calendar */}
            <div className="card" style={{ overflow:"hidden", boxShadow:"var(--shadow)" }}>
              <div style={{ background:"linear-gradient(135deg, var(--navy), var(--blue-1))", padding:"20px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <button onClick={() => setCurrentDate(new Date(year,month-1,1))}
                  style={{ background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", color:"#fff", width:36, height:36, borderRadius:10, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                <div style={{ textAlign:"center" }}>
                  <h2 style={{ color:"#fff", fontSize:22, fontWeight:800, letterSpacing:-0.5 }}>{MONTHS[month]}</h2>
                  <span style={{ color:"rgba(255,255,255,0.45)", fontSize:11, fontWeight:600, letterSpacing:2 }}>{year}</span>
                </div>
                <button onClick={() => setCurrentDate(new Date(year,month+1,1))}
                  style={{ background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", color:"#fff", width:36, height:36, borderRadius:10, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"var(--bg2)", borderBottom:"1px solid var(--border)" }}>
                {DAYS.map(d => <div key={d} style={{ textAlign:"center", padding:"10px 0", fontSize:9, fontWeight:700, letterSpacing:1.5, color:"var(--muted)", textTransform:"uppercase" }}>{d}</div>)}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
                {Array.from({ length:startOffset }).map((_,i) => (
                  <div key={i} style={{ minHeight:64, background:"#fafcff", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }} />
                ))}
                {Array.from({ length:daysInMonth }, (_,i) => i+1).map(day => {
                  const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                  const { status, event } = getDayStatus(day);
                  const isSelected = selectedDate === dateStr;
                  const isToday = new Date(dateStr).toDateString() === today.toDateString();
                  const canClick = status !== "past";

                  const dotColor = { booked:"#4080f0", conditional:"#ef4444", past:"#ddd", available:"#10b981" }[status];
                  const bg = isSelected ? "#dbeeff"
                    : status === "booked" ? "#eef4ff"
                    : status === "conditional" ? "#fff5f5"
                    : status === "past" ? "#fafafa"
                    : "#f0fdf8";

                  return (
                    <div key={day} onClick={() => handleDayClick(dateStr, status)}
                      style={{ minHeight:64, background:bg, padding:"8px 8px 6px", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)", cursor:canClick?"pointer":"default", display:"flex", flexDirection:"column", outline:isSelected?"2px solid var(--blue-2)":"none", outlineOffset:-2, transition:"background 0.12s" }}
                    >
                      <div style={{ width:24, height:24, borderRadius:7, background:isToday?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontSize:12, fontWeight:isToday?800:500, color:isToday?"#fff":status==="past"?"#ccc":"var(--dark)" }}>{day}</span>
                      </div>
                      <div style={{ marginTop:"auto" }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:dotColor }} />
                        {status==="booked"&&event&&(
                          <span style={{ fontSize:8, color:"var(--blue-1)", display:"block", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:700 }}>
                            {event.event_type==="wedding"?"💍":"🎉"} {event.couple}
                          </span>
                        )}
                        {status==="conditional"&&(
                          <span style={{ fontSize:7, color:"#ef4444", display:"block", marginTop:2, fontWeight:700, lineHeight:1.2 }}>Bersyarat</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div style={{ padding:"10px 16px", background:"var(--bg2)", borderTop:"1px solid var(--border)", display:"flex", gap:16, flexWrap:"wrap" }}>
                {[
                  { color:"#10b981", label:"Weekend" },
                  { color:"#ef4444", label:"Bersyarat" },
                  { color:"#4080f0", label:"Dipesan" },
                ].map(({color,label}) => (
                  <p key={label} style={{ fontSize:10, color:"var(--muted)", display:"flex", alignItems:"center", gap:5, fontWeight:600 }}>
                    <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:color }} />{label}
                  </p>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {showForm && (
                <div className="card" style={{ padding:24, borderTop:"3px solid var(--blue-2)", boxShadow:"var(--shadow)" }}>
                  <h3 style={{ fontSize:18, fontWeight:800, marginBottom:4, color:"var(--navy)", letterSpacing:-0.5 }}>Tambah Event</h3>
                  <p style={{ fontSize:12, color:"var(--muted)", marginBottom:16, fontWeight:500 }}>
                    📅 {selectedDate}
                    {!isWeekend(selectedDate) && (
                      <span style={{ marginLeft:8, background:"#fff5f5", color:"#ef4444", fontSize:10, padding:"2px 8px", borderRadius:10, fontWeight:700 }}>
                        ⚠️ Bersyarat
                      </span>
                    )}
                  </p>

                  {!eventType && (
                    <div>
                      <label className="label" style={{ marginBottom:12 }}>Pilih Tipe Event</label>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                        {[
                          { type:"wedding", icon:"💍", label:"Wedding" },
                          { type:"event",   icon:"🎉", label:"Event Biasa" },
                        ].map(({ type, icon, label }) => (
                          <button key={type} type="button" onClick={() => setEventType(type)}
                            style={{ padding:"18px 10px", border:"2px solid var(--border)", borderRadius:14, background:"#fafcff", cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor="var(--blue-2)"; e.currentTarget.style.background="#eef4ff"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.background="#fafcff"; }}
                          >
                            <div style={{ fontSize:26, marginBottom:8 }}>{icon}</div>
                            <div style={{ fontSize:13, fontWeight:700, color:"var(--dark)" }}>{label}</div>
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={() => setShowForm(false)} className="btn btn-outline" style={{ width:"100%", marginTop:12 }}>Batal</button>
                    </div>
                  )}

                  {eventType && (
                    <>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
                        <span style={{ background: eventType==="wedding" ? "#eef4ff" : "#f0fdf4", color: eventType==="wedding" ? "var(--blue-1)" : "#059669", fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20 }}>
                          {eventType==="wedding" ? "💍 Wedding" : "🎉 Event Biasa"}
                        </span>
                        <button type="button" onClick={() => setEventType("")} style={{ fontSize:11, color:"var(--muted)", background:"none", border:"none", cursor:"pointer", textDecoration:"underline", fontWeight:600 }}>Ganti</button>
                      </div>

                      {formError && (
                        <div style={{ background:"#fff5f5", color:"#dc2626", padding:"8px 12px", fontSize:12, borderRadius:10, marginBottom:14, border:"1px solid #fecaca", fontWeight:500 }}>
                          ⚠️ {formError}
                        </div>
                      )}

                      <form onSubmit={handleAddEvent}>
                        <div style={{ marginBottom:14 }}>
                          <label className="label">{eventType==="wedding" ? "Nama Pasangan *" : "Nama Event *"}</label>
                          <input value={form.couple} onChange={e => setForm({...form, couple:e.target.value})}
                            placeholder={eventType==="wedding" ? "Budi & Siti" : "Nama event..."} className="input" />
                        </div>
                        {[
                          { label:"Venue / Lokasi", key:"venue", placeholder:"Grand Ballroom Hotel XYZ" },
                          { label:"Jam Acara",      key:"time",  placeholder:"10:00 WIB" },
                          { label:"Catatan",        key:"notes", placeholder:"Info tambahan..." },
                          { label:"Add On",         key:"addon", placeholder:"Dekorasi, Catering, dll..." },
                        ].map(({ label, key, placeholder }) => (
                          <div key={key} style={{ marginBottom:14 }}>
                            <label className="label">{label}</label>
                            <input value={form[key]} onChange={e => setForm({...form, [key]:e.target.value})} placeholder={placeholder} className="input" />
                          </div>
                        ))}
                        <div style={{ display:"flex", gap:10, marginTop:10 }}>
                          <button type="submit" className="btn btn-primary" style={{ flex:1 }}>Simpan</button>
                          <button type="button" onClick={() => { setShowForm(false); setEventType(""); }} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* Event list */}
              <div className="card" style={{ overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", background:"var(--bg2)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <h3 style={{ fontSize:16, fontWeight:800, color:"var(--navy)", letterSpacing:-0.5 }}>Semua Event</h3>
                  <span style={{ background:"linear-gradient(135deg,var(--blue-2),var(--blue-1))", color:"#fff", fontSize:12, fontWeight:700, padding:"3px 12px", borderRadius:20 }}>{events.length}</span>
                </div>
                <div style={{ maxHeight:460, overflowY:"auto" }}>
                  {events.length === 0 && (
                    <div style={{ padding:"32px", textAlign:"center" }}>
                      <p style={{ fontSize:28, marginBottom:8 }}>📅</p>
                      <p style={{ fontSize:13, color:"var(--muted)", fontWeight:500 }}>Belum ada event</p>
                    </div>
                  )}
                  {[...events].sort((a,b) => a.date.localeCompare(b.date)).map(event => (
                    <div key={event.id} style={{ padding:"14px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
                          <span style={{ fontSize:10, background: event.event_type==="wedding" ? "#eef4ff" : "#f0fdf4", color: event.event_type==="wedding" ? "var(--blue-1)" : "#059669", padding:"2px 8px", borderRadius:10, fontWeight:700 }}>
                            {event.event_type==="wedding" ? "💍 Wedding" : "🎉 Event"}
                          </span>
                        </div>
                        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:17, color:"var(--dark)", marginBottom:2 }}>{event.couple}</p>
                        <p style={{ fontSize:11, color:"var(--blue-2)", fontWeight:700, marginBottom:2 }}>{event.date}</p>
                        {event.venue && <p style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>📍 {event.venue}</p>}
                        {event.time  && <p style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>🕐 {event.time}</p>}
                        {event.addon && <p style={{ fontSize:11, color:"var(--muted)", fontWeight:500 }}>✨ {event.addon}</p>}
                      </div>
                      <button onClick={() => handleDelete(event.id)} className="btn btn-danger" style={{ flexShrink:0 }}>Hapus</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer style={{ textAlign:"center", padding:"24px 0 16px", color:"var(--muted)", fontSize:11, opacity:0.45 }}>
          Created by GG
        </footer>
      </div>
    </>
  );
}
