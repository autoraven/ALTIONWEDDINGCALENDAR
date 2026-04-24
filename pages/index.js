import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6;
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const { businessName } = CALENDAR_CONFIG;

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch("/api/events");
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    }
    fetchEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date(); today.setHours(0,0,0,0);

  function getDayStatus(day) {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const hasEvent = events.find(e => e.date === dateStr);
    if (hasEvent) return { status: "booked", event: hasEvent };
    const d = new Date(dateStr);
    if (d < today) return { status: "past" };
    if (isWeekend(dateStr)) return { status: "available" };
    return { status: "conditional" };
  }

  const selectedDateStr = selectedDay
    ? `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`
    : null;
  const selectedEvents = selectedDateStr ? events.filter(e => e.date === selectedDateStr) : [];

  return (
    <>
      <Head>
        <title>{businessName} — Kalender Jadwal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      <div style={{ minHeight:"100vh", background:"var(--bg)" }}>

        {/* ── HEADER ── */}
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
              <span style={{ color:"rgba(255,255,255,0.5)", fontSize:9, letterSpacing:2.5, textTransform:"uppercase", fontWeight:600 }}>Wedding Calendar</span>
            </div>
          </div>
          <Link href="/admin" className="btn btn-ghost" style={{ fontSize:12, padding:"8px 18px" }}>Admin</Link>
        </header>

        <main style={{ maxWidth:900, margin:"0 auto", padding:"40px 20px" }}>

          {/* ── HERO ── */}
          <div style={{
            background: "linear-gradient(135deg, var(--navy) 0%, var(--blue-1) 100%)",
            borderRadius: 24, padding: "40px 44px", marginBottom: 28,
            boxShadow: "0 16px 48px rgba(10,22,40,0.25)",
            position: "relative", overflow: "hidden",
          }}>
            {/* decorative circles */}
            <div style={{ position:"absolute", top:-60, right:-40, width:220, height:220, borderRadius:"50%", background:"rgba(255,255,255,0.04)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:-40, right:80, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.03)", pointerEvents:"none" }} />

            <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
              <div>
                <p style={{ color:"rgba(255,255,255,0.55)", fontSize:11, fontWeight:700, letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>Jadwal Tersedia</p>
                <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, letterSpacing:-1, marginBottom:10, lineHeight:1.1 }}>
                  Cek Ketersediaan<br />Tanggal
                </h2>
                <p style={{ color:"rgba(255,255,255,0.65)", fontSize:13, lineHeight:1.7, maxWidth:380 }}>
                  Untuk reservasi, konfirmasi terlebih dahulu bersama Staff Altion.
                </p>
              </div>
              {/* Legend */}
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { color:"#10b981", label:"Weekend — Tersedia" },
                  { color:"#ef4444", label:"Hari Kerja — Bersyarat" },
                  { color:"#4080f0", label:"Sudah Dipesan" },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:9, height:9, borderRadius:"50%", background:color, flexShrink:0, boxShadow:`0 0 8px ${color}` }} />
                    <span style={{ color:"rgba(255,255,255,0.8)", fontSize:12, fontWeight:500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CALENDAR ── */}
          <div className="card" style={{ overflow:"hidden", marginBottom:24, boxShadow:"var(--shadow)" }}>
            {/* Month nav */}
            <div style={{ background:"linear-gradient(135deg, var(--navy) 0%, var(--blue-1) 100%)", padding:"22px 32px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <button onClick={() => setCurrentDate(new Date(year, month-1, 1))}
                style={{ background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", color:"#fff", width:38, height:38, borderRadius:10, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s" }}>‹</button>
              <div style={{ textAlign:"center" }}>
                <h2 style={{ color:"#fff", fontSize:26, fontWeight:800, letterSpacing:-0.5 }}>{MONTHS[month]}</h2>
                <span style={{ color:"rgba(255,255,255,0.5)", fontSize:12, fontWeight:600, letterSpacing:2 }}>{year}</span>
              </div>
              <button onClick={() => setCurrentDate(new Date(year, month+1, 1))}
                style={{ background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", color:"#fff", width:38, height:38, borderRadius:10, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"background 0.15s" }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"var(--bg2)", borderBottom:"1px solid var(--border)" }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign:"center", padding:"12px 0", fontSize:10, fontWeight:700, letterSpacing:1.5, color:"var(--muted)", textTransform:"uppercase" }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`e-${i}`} style={{ minHeight:76, background:"#fafcff", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const { status, event } = getDayStatus(day);
                const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isSelected = selectedDay === day;
                const isToday = new Date(dateStr).toDateString() === today.toDateString();

                const statusStyles = {
                  booked:      { bg:"#eef4ff", dot:"#4080f0", textColor:"var(--dark)" },
                  conditional: { bg:"#fff5f5", dot:"#ef4444", textColor:"#999" },
                  past:        { bg:"#fafafa", dot:"#ddd",    textColor:"#ccc" },
                  available:   { bg:"#f0fdf8", dot:"#10b981", textColor:"var(--dark)" },
                }[status];

                return (
                  <div key={day}
                    onClick={() => status === "booked" ? setSelectedDay(isSelected ? null : day) : null}
                    style={{
                      minHeight: 76, background: isSelected ? "#dbeeff" : statusStyles.bg,
                      borderRight: "1px solid var(--border)", borderBottom: "1px solid var(--border)",
                      padding: "10px 10px 8px", cursor: status === "booked" ? "pointer" : "default",
                      display: "flex", flexDirection:"column",
                      outline: isSelected ? "2px solid var(--blue-2)" : "none", outlineOffset: -2,
                      transition: "background 0.15s",
                    }}
                  >
                    <div style={{ width:26, height:26, borderRadius:8, background:isToday?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:13, fontWeight:isToday?800:500, color:isToday?"#fff":statusStyles.textColor }}>
                        {day}
                      </span>
                    </div>
                    <div style={{ marginTop:"auto" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:statusStyles.dot }} />
                      {status === "booked" && event && (
                        <span style={{ fontSize:9, color:"var(--blue-1)", display:"block", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:700 }}>
                          {event.event_type === "wedding" ? "💍" : "🎉"} {event.couple}
                        </span>
                      )}
                      {status === "conditional" && (
                        <span style={{ fontSize:7, color:"#ef4444", display:"block", marginTop:2, fontWeight:700, lineHeight:1.2 }}>Bersyarat</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── SELECTED EVENT DETAIL ── */}
          {selectedDay && selectedEvents.length > 0 && (
            <div className="card" style={{ padding:"24px 28px", borderLeft:"4px solid var(--blue-2)", marginBottom:24, boxShadow:"var(--shadow)" }}>
              <h3 style={{ fontSize:20, fontWeight:800, marginBottom:14, color:"var(--navy)", letterSpacing:-0.5 }}>
                {selectedDay} {MONTHS[month]} {year}
              </h3>
              {selectedEvents.map((e, i) => (
                <div key={i} style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none", paddingTop: i > 0 ? 14 : 0 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, marginBottom:8, color:"var(--dark)" }}>
                    {e.event_type === "wedding" ? "💍" : "🎉"} {e.couple}
                  </p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:16 }}>
                    {e.venue && <span style={{ fontSize:13, color:"var(--muted)", fontWeight:500 }}>📍 {e.venue}</span>}
                    {e.time  && <span style={{ fontSize:13, color:"var(--muted)", fontWeight:500 }}>🕐 {e.time}</span>}
                  </div>
                  {e.notes && <p style={{ fontSize:12, color:"var(--muted)", marginTop:8, fontStyle:"italic" }}>{e.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── CONTACT STRIP ── */}
          <div style={{ background:"var(--white)", borderRadius:20, padding:"24px 32px", border:"1px solid var(--border)", boxShadow:"var(--shadow-sm)" }}>
            <p style={{ fontSize:13, color:"var(--mid)", lineHeight:1.8, marginBottom:18, fontWeight:500 }}>
              Diharapkan untuk mengkonfirmasi pendaftaran dikota terlebih dahulu bersama Staff Altion. Untuk booklet dan pendaftaran dapat diakses di tombol berikut.
            </p>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <a href="https://forms.gle/zRcoKT4nPckRDT2s5" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize:13, padding:"10px 28px" }}>
                🌐 Daftar Sekarang
              </a>
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
