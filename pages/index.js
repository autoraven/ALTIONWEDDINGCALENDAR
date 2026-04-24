import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../lib/config";

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

function countWeddingsInWeek(events, weekKey) {
  return events.filter(e => getWeekKey(e.date) === weekKey).length;
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [monthDir, setMonthDir] = useState(null); // 'left' | 'right'
  const [monthKey, setMonthKey] = useState(0);
  const { maxWeddingsPerWeek, businessName, contactPhone, contactEmail } = CALENDAR_CONFIG;

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

  const today = new Date();
  today.setHours(0,0,0,0);

  function goMonth(direction) {
    setMonthDir(direction > 0 ? 'right' : 'left');
    setMonthKey(k => k + 1);
    setSelectedDay(null);
    setCurrentDate(new Date(year, month + direction, 1));
  }

  function getDayStatus(day) {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const hasEvent = events.find(e => e.date === dateStr);
    if (hasEvent) return { status: "booked", event: hasEvent };
    const weekKey = getWeekKey(dateStr);
    const count = countWeddingsInWeek(events, weekKey);
    if (count >= maxWeddingsPerWeek) return { status: "full" };
    const d = new Date(dateStr);
    if (d < today) return { status: "past" };
    return { status: "available" };
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
      </Head>

      {/* ── Background decorations ── */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      {/* Floating sparkles */}
      <div className="sparkle-container">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="sparkle" />
        ))}
      </div>

      {/* Ring decorations */}
      <div className="ring-deco ring-deco-1" />
      <div className="ring-deco ring-deco-2" />
      <div className="ring-deco ring-deco-3" />
      <div className="ring-deco ring-deco-4" />

      <div style={{ minHeight:"100vh", background:"var(--bg)", position:"relative", zIndex:1 }}>
        {/* Header */}
        <header
          className="anim-header"
          style={{
            background: "linear-gradient(135deg, #0d6ecc 0%, #1a8fff 60%, #42b0ff 100%)",
            padding: "0 32px",
            height: 72,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            boxShadow: "0 4px 24px rgba(13,110,204,0.35)",
            position: "sticky", top: 0, zIndex: 100,
          }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden", padding: 4,
              border: "1.5px solid rgba(255,255,255,0.35)",
              transition: "transform 0.3s ease",
            }}
              onMouseEnter={e => e.currentTarget.style.transform = "rotate(-8deg) scale(1.08)"}
              onMouseLeave={e => e.currentTarget.style.transform = ""}
            >
              <img src="/logo.png" alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <div>
              <h1 style={{ color:"#fff", fontSize:20, fontWeight:400, letterSpacing:1, lineHeight:1.1 }}>
                {businessName}
              </h1>
              <p style={{ color:"rgba(255,255,255,0.75)", fontSize:10, letterSpacing:2, textTransform:"uppercase", fontFamily:"Plus Jakarta Sans,sans-serif" }}>Wedding Calendar</p>
            </div>
          </div>
          <Link href="/admin" className="btn btn-ghost" style={{ fontSize:12 }}>
            Admin Login
          </Link>
        </header>

        <main style={{ maxWidth:960, margin:"0 auto", padding:"36px 20px" }}>

          {/* Hero strip */}
          <div
            className="anim-hero"
            style={{
              background: "linear-gradient(135deg, #1a8fff 0%, #0d6ecc 100%)",
              borderRadius: 16, padding: "28px 36px", marginBottom: 32,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              boxShadow: "var(--shadow-lg)", flexWrap: "wrap", gap: 16,
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Hero inner shimmer decoration */}
            <div style={{
              position: "absolute", top: -60, right: -60,
              width: 200, height: 200, borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", bottom: -40, left: "40%",
              width: 120, height: 120, borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }} />

            <div style={{ position:"relative", zIndex:1 }}>
              <h2 style={{ color:"#fff", fontSize:28, fontWeight:300, letterSpacing:1, marginBottom:6 }}>
                Cek Ketersediaan Tanggal
              </h2>
              <p style={{ color:"rgba(255,255,255,0.8)", fontSize:13, lineHeight:1.6 }}>
                Kami melayani maks. <strong>{maxWeddingsPerWeek} pernikahan per minggu</strong> untuk reservasi hubungi staff Altion.
              </p>
            </div>
            <div style={{ display:"flex", gap:20, position:"relative", zIndex:1 }}>
              {[
                { color:"#0fb87a", label:"Tersedia" },
                { color:"rgba(255,255,255,0.9)", label:"Dipesan", border:"1px solid rgba(255,255,255,0.5)" },
                { color:"#ff6b6b", label:"Penuh" },
              ].map(({ color, label, border }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:color, border: border || "none", flexShrink:0 }} />
                  <span style={{ color:"rgba(255,255,255,0.9)", fontSize:12, fontWeight:500 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar card */}
          <div className="card anim-calendar" style={{ overflow:"hidden", marginBottom:24 }}>
            {/* Month nav */}
            <div style={{
              background: "linear-gradient(135deg, #0a4f9a, #1a8fff)",
              padding: "20px 32px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              position: "relative", overflow: "hidden",
            }}>
              {/* Header inner glow */}
              <div style={{ position:"absolute", inset:0, background:"linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.06) 60%, transparent 80%)", pointerEvents:"none" }} />

              <button
                onClick={() => goMonth(-1)}
                style={{
                  background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)",
                  color:"#fff", width:36, height:36, borderRadius:8, fontSize:18, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.18s", position:"relative", zIndex:1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.28)"; e.currentTarget.style.transform="scale(1.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.15)"; e.currentTarget.style.transform=""; }}
              >
                ‹
              </button>

              <div
                key={monthKey}
                className={monthDir === 'right' ? 'month-enter' : monthDir === 'left' ? 'month-enter-left' : ''}
                style={{ textAlign:"center", position:"relative", zIndex:1 }}
              >
                <h2 style={{ color:"#fff", fontSize:28, fontWeight:300, letterSpacing:3 }}>{MONTHS[month]}</h2>
                <span style={{ color:"rgba(255,255,255,0.7)", fontSize:12, letterSpacing:3 }}>{year}</span>
              </div>

              <button
                onClick={() => goMonth(1)}
                style={{
                  background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)",
                  color:"#fff", width:36, height:36, borderRadius:8, fontSize:18, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all 0.18s", position:"relative", zIndex:1,
                }}
                onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.28)"; e.currentTarget.style.transform="scale(1.1)"; }}
                onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.15)"; e.currentTarget.style.transform=""; }}
              >
                ›
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"var(--bg2)", borderBottom:"1px solid var(--border)" }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign:"center", padding:"12px 0", fontSize:10, fontWeight:700, letterSpacing:1.5, color:"var(--muted)", textTransform:"uppercase" }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div
              key={`grid-${monthKey}`}
              className={monthDir ? (monthDir === 'right' ? 'month-enter' : 'month-enter-left') : ''}
              style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}
            >
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`e-${i}`} style={{ minHeight:76, background:"#fafcff", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const { status, event } = getDayStatus(day);
                const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isSelected = selectedDay === day;
                const isToday = new Date(dateStr).toDateString() === today.toDateString();
                const isClickable = status === "booked";

                const statusStyles = {
                  booked:    { bg:"#e8f4ff", dot:"#1a8fff", textColor:"var(--dark)" },
                  full:      { bg:"#fff0f0", dot:"#e53e3e", textColor:"#999" },
                  past:      { bg:"#fafafa", dot:"#ddd",    textColor:"#ccc" },
                  available: { bg:"#fff",    dot:"#0fb87a", textColor:"var(--dark)" },
                }[status];

                return (
                  <div
                    key={day}
                    onClick={() => isClickable ? setSelectedDay(isSelected ? null : day) : null}
                    className={isClickable ? "cal-day-interactive" : ""}
                    style={{
                      minHeight: 76,
                      background: isSelected ? "#dbeeff" : statusStyles.bg,
                      borderRight: "1px solid var(--border)",
                      borderBottom: "1px solid var(--border)",
                      padding: "10px 10px 8px",
                      cursor: isClickable ? "pointer" : "default",
                      display: "flex", flexDirection:"column",
                      outline: isSelected ? "2px solid var(--blue-2)" : "none",
                      outlineOffset: -2,
                      position: "relative",
                    }}
                  >
                    <div
                      className={isToday ? "today-badge" : ""}
                      style={{
                        width: 26, height: 26, borderRadius: 6,
                        background: isToday ? "linear-gradient(135deg,#1a8fff,#0d6ecc)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize:13, fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : statusStyles.textColor, fontFamily:"Plus Jakarta Sans,sans-serif" }}>
                        {day}
                      </span>
                    </div>

                    <div style={{ marginTop:"auto" }}>
                      <div style={{ width:7, height:7, borderRadius:"50%", background:statusStyles.dot }} />
                      {status === "booked" && event && (
                        <span style={{ fontSize:9, color:"var(--blue-dark)", display:"block", marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600 }}>
                          {event.couple}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected event detail */}
          {selectedDay && selectedEvents.length > 0 && (
            <div
              className="card detail-enter"
              style={{ padding:"24px 28px", borderLeft:"4px solid var(--blue-2)", marginBottom:24 }}
            >
              <h3 style={{ fontSize:22, fontWeight:400, marginBottom:16, color:"var(--blue-dark)" }}>
                {selectedDay} {MONTHS[month]} {year}
              </h3>
              {selectedEvents.map((e, i) => (
                <div key={i} style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none", paddingTop: i > 0 ? 14 : 0 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, marginBottom:8, color:"var(--dark)" }}>💍 {e.couple}</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:16 }}>
                    {e.venue && <span style={{ fontSize:13, color:"var(--muted)", display:"flex", alignItems:"center", gap:5 }}>📍 {e.venue}</span>}
                    {e.time && <span style={{ fontSize:13, color:"var(--muted)", display:"flex", alignItems:"center", gap:5 }}>🕐 {e.time}</span>}
                  </div>
                  {e.notes && <p style={{ fontSize:12, color:"var(--muted)", marginTop:8, fontStyle:"italic" }}>{e.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Contact strip */}
          <div
            className="anim-contact"
            style={{
              background:"var(--white)", borderRadius:12, padding:"20px 28px",
              border:"1px solid var(--border)",
            }}
          >
            <p style={{ fontSize:13, color:"var(--mid)", lineHeight:1.7, marginBottom:16 }}>
              Diharapkan untuk mengkonfirmasi pendaftaran dikota terlebih dahulu bersama Staff Altion. Untuk booklet dan pendaftaran dapat diakses di tombol dibawah ini.
            </p>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <a href="https://forms.gle/zRcoKT4nPckRDT2s5" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize:12 }}>
                🌐 BOOKLET & FORM PENDAFTARAN 🌐
              </a>
            </div>
          </div>
        </main>

        <footer style={{ textAlign:"center", padding:"24px 0 16px", color:"var(--muted)", fontSize:11, opacity:0.5, position:"relative", zIndex:1 }}>
          Created by GG. All rights reserved.
        </footer>
      </div>
    </>
  );
}
