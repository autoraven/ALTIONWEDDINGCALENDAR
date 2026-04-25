import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

// ── BACKGROUND DECORATIONS ──
function BgDecor() {
  return (
    <>
      {/* Orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-orb bg-orb-4" />

      {/* Dot grid */}
      <div style={{ position:"fixed", inset:0, zIndex:0, pointerEvents:"none",
        backgroundImage:"radial-gradient(circle, rgba(30,96,213,0.13) 1px, transparent 1px)",
        backgroundSize:"36px 36px",
        maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)",
        WebkitMaskImage:"radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)",
      }} />

      {/* SVG decorations — top left */}
      <div className="float-shape-1" style={{ position:"fixed", top:80, left:40, zIndex:0, pointerEvents:"none", opacity:0.08 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" stroke="#1e60d5" strokeWidth="1.5" strokeDasharray="8 6" className="ring-spin"/>
          <circle cx="60" cy="60" r="38" stroke="#4080f0" strokeWidth="1" strokeDasharray="4 8" className="ring-spin-rev"/>
          <circle cx="60" cy="60" r="6" fill="#1e60d5"/>
        </svg>
      </div>

      {/* SVG — bottom right */}
      <div className="float-shape-2" style={{ position:"fixed", bottom:100, right:60, zIndex:0, pointerEvents:"none", opacity:0.07 }}>
        <svg width="160" height="160" viewBox="0 0 160 160" fill="none">
          <rect x="20" y="20" width="120" height="120" rx="24" stroke="#1535a0" strokeWidth="1.5" strokeDasharray="10 6" className="ring-spin-rev"/>
          <rect x="50" y="50" width="60" height="60" rx="12" stroke="#4080f0" strokeWidth="1" strokeDasharray="5 8" className="ring-spin"/>
        </svg>
      </div>

      {/* SVG — mid left */}
      <div className="float-shape-3" style={{ position:"fixed", top:"45%", left:20, zIndex:0, pointerEvents:"none", opacity:0.06 }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <polygon points="40,4 76,68 4,68" stroke="#1e60d5" strokeWidth="1.5" fill="none" strokeDasharray="6 5"/>
        </svg>
      </div>

      {/* SVG — top right */}
      <div className="float-shape-1" style={{ position:"fixed", top:160, right:40, zIndex:0, pointerEvents:"none", opacity:0.07, animationDelay:"3s" }}>
        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
          <circle cx="45" cy="45" r="40" stroke="#4080f0" strokeWidth="1" strokeDasharray="3 9" className="ring-spin"/>
          <line x1="5" y1="45" x2="85" y2="45" stroke="#1e60d5" strokeWidth="0.8" opacity="0.5"/>
          <line x1="45" y1="5" x2="45" y2="85" stroke="#1e60d5" strokeWidth="0.8" opacity="0.5"/>
        </svg>
      </div>

      {/* SVG — bottom left diamonds */}
      <div className="float-shape-2" style={{ position:"fixed", bottom:200, left:60, zIndex:0, pointerEvents:"none", opacity:0.07, animationDelay:"1.5s" }}>
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
          <rect x="10" y="10" width="50" height="50" rx="4" stroke="#1e60d5" strokeWidth="1.2" transform="rotate(45 35 35)" fill="none" strokeDasharray="4 6"/>
        </svg>
      </div>

      {/* Corner accent lines */}
      <div style={{ position:"fixed", top:0, left:0, zIndex:0, pointerEvents:"none", opacity:0.12 }}>
        <svg width="180" height="180"><path d="M0 90 L90 0" stroke="#1e60d5" strokeWidth="1"/><path d="M0 140 L140 0" stroke="#1e60d5" strokeWidth="0.5"/><path d="M0 40 L40 0" stroke="#1e60d5" strokeWidth="0.5"/></svg>
      </div>
      <div style={{ position:"fixed", bottom:0, right:0, zIndex:0, pointerEvents:"none", opacity:0.12, transform:"rotate(180deg)" }}>
        <svg width="180" height="180"><path d="M0 90 L90 0" stroke="#1e60d5" strokeWidth="1"/><path d="M0 140 L140 0" stroke="#1e60d5" strokeWidth="0.5"/></svg>
      </div>
    </>
  );
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [animDirection, setAnimDirection] = useState(0); // 1 = next, -1 = prev, 0 = none
  const { businessName } = CALENDAR_CONFIG;
  
  useEffect(() => {
    setMounted(true);
    fetch("/api/events").then(r => r.json()).then(d => { if (Array.isArray(d)) setEvents(d); });
  }, []);

  useEffect(() => {
    if (animDirection !== 0) {
      const timer = setTimeout(() => {
        setAnimDirection(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [animDirection]);

  function changeMonth(dir) {
    setAnimDirection(dir);
    setSelectedDay(null);
    setTimeout(() => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
    }, 50);
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

      <div style={{ minHeight:"100vh", position:"relative", overflow:"hidden" }}>
        <BgDecor />

        {/* HEADER */}
        <header style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)", padding:"0 40px", height:68, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 4px 32px rgba(10,22,40,0.4)", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize:"20px 20px", pointerEvents:"none" }} />
          <div style={{ display:"flex", alignItems:"center", gap:14, position:"relative" }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:5, border:"1.5px solid rgba(255,255,255,0.2)" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <div>
              <span style={{ color:"#fff", fontSize:17, fontWeight:800, letterSpacing:-0.5, display:"block", lineHeight:1.1 }}>{businessName}</span>
              <span style={{ color:"rgba(255,255,255,0.45)", fontSize:9, letterSpacing:2.5, textTransform:"uppercase", fontWeight:600 }}>Wedding Calendar</span>
            </div>
          </div>
          <Link href="/admin" className="btn btn-ghost" style={{ fontSize:12, padding:"8px 18px", position:"relative" }}>Admin</Link>
        </header>

        <main style={{ maxWidth:900, margin:"0 auto", padding:"40px 20px", position:"relative", zIndex:1 }}>

          {/* HERO */}
          <div className={mounted?"fade-up":""} style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--blue-1) 100%)", borderRadius:24, padding:"40px 44px", marginBottom:28, boxShadow:"0 16px 48px rgba(10,22,40,0.25)", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)", backgroundSize:"28px 28px", pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:-60, right:-40, width:220, height:220, borderRadius:"50%", background:"rgba(64,128,240,0.2)", filter:"blur(40px)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:-40, left:40, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.04)", filter:"blur(20px)", pointerEvents:"none" }} />
            {/* hero rings */}
            <div className="ring-spin" style={{ position:"absolute", top:-20, right:40, width:180, height:180, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.07)", pointerEvents:"none", transformOrigin:"center" }} />
            <div className="ring-spin-rev" style={{ position:"absolute", top:10, right:70, width:120, height:120, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.05)", pointerEvents:"none", transformOrigin:"center" }} />

            <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
              <div>
                <p style={{ color:"rgba(255,255,255,0.4)", fontSize:10, fontWeight:700, letterSpacing:3.5, textTransform:"uppercase", marginBottom:12, display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ display:"inline-block", width:28, height:1, background:"rgba(255,255,255,0.25)" }} />Jadwal Tersedia
                </p>
                <h2 style={{ color:"#fff", fontSize:32, fontWeight:800, letterSpacing:-1, marginBottom:10, lineHeight:1.1 }}>Cek Ketersediaan<br />Tanggal</h2>
                <p style={{ color:"rgba(255,255,255,0.5)", fontSize:13, lineHeight:1.7, maxWidth:340, fontWeight:400 }}>Untuk reservasi, konfirmasi terlebih dahulu bersama Staff Altion.</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  { color:"#10b981", label:"Weekend — Tersedia",    glow:"rgba(16,185,129,0.5)" },
                  { color:"#ef4444", label:"Hari Kerja — Bersyarat",glow:"rgba(239,68,68,0.5)" },
                  { color:"#4080f0", label:"Sudah Dipesan",         glow:"rgba(64,128,240,0.5)" },
                ].map(({ color, label, glow }) => (
                  <div key={label} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0, boxShadow:`0 0 10px ${glow}` }} />
                    <span style={{ color:"rgba(255,255,255,0.7)", fontSize:12, fontWeight:500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CALENDAR */}
          <div className={mounted?"card fade-up anim-delay-1":"card"} style={{ overflow:"hidden", marginBottom:24, boxShadow:"var(--shadow)" }}>
            {/* month header */}
            <div style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--blue-1) 100%)", padding:"22px 32px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)", backgroundSize:"20px 20px", pointerEvents:"none" }} />
              <button onClick={() => changeMonth(-1)}
                style={{ background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", color:"#fff", width:38, height:38, borderRadius:10, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", position:"relative", zIndex:1 }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.2)";e.currentTarget.style.transform="scale(1.1)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.transform="scale(1)";}}
              >‹</button>
              <div style={{ textAlign:"center", position:"relative", zIndex:1, overflow:"hidden", height:50 }}>
                <div style={{ transition:"transform 0.3s cubic-bezier(0.16,1,0.3,1)", transform: animDirection === 0 ? "translateX(0)" : animDirection === 1 ? "translateX(-25px)" : "translateX(25px)" }}>
                  <h2 style={{ color:"#fff", fontSize:26, fontWeight:800, letterSpacing:-0.5, marginBottom:2 }}>{MONTHS[month]}</h2>
                  <span style={{ color:"rgba(255,255,255,0.45)", fontSize:12, fontWeight:600, letterSpacing:2 }}>{year}</span>
                </div>
              </div>
              <button onClick={() => changeMonth(1)}
                style={{ background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", color:"#fff", width:38, height:38, borderRadius:10, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s", position:"relative", zIndex:1 }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.2)";e.currentTarget.style.transform="scale(1.1)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.transform="scale(1)";}}
              >›</button>
            </div>

            {/* day labels */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"var(--bg2)", borderBottom:"1px solid var(--border)" }}>
              {DAYS.map(d => <div key={d} style={{ textAlign:"center", padding:"12px 0", fontSize:10, fontWeight:700, letterSpacing:1.5, color:"var(--muted)", textTransform:"uppercase" }}>{d}</div>)}
            </div>

            {/* grid with slide animation */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", overflow:"hidden", position:"relative" }}>
              <div style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)",
                transform: animDirection === 0 ? "translateX(0)" : animDirection === 1 ? "translateX(-60px)" : "translateX(60px)"
              }}>
                {Array.from({ length:startOffset }).map((_,i) => (
                  <div key={`e-${i}`} style={{ minHeight:76, background:"rgba(250,252,255,0.6)", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }} />
                ))}
                {Array.from({ length:daysInMonth }, (_,i) => i+1).map(day => {
                const { status, event } = getDayStatus(day);
                const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isSelected = selectedDay === day;
                const isToday = new Date(dateStr).toDateString() === today.toDateString();
                const s = {
                  booked:      { bg:"rgba(238,244,255,0.9)", dot:"#4080f0", tc:"var(--dark)" },
                  conditional: { bg:"rgba(255,245,245,0.9)", dot:"#ef4444", tc:"#999" },
                  past:        { bg:"rgba(250,250,250,0.5)", dot:"#ddd",    tc:"#ccc" },
                  available:   { bg:"rgba(240,253,248,0.9)", dot:"#10b981", tc:"var(--dark)" },
                }[status];
                return (
                  <div key={day} className="day-cell"
                    onClick={() => status==="booked" ? setSelectedDay(isSelected?null:day) : null}
                    style={{ minHeight:76, background:isSelected?"rgba(219,238,255,0.95)":s.bg, borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)", padding:"10px 10px 8px", cursor:status==="booked"?"pointer":"default", display:"flex", flexDirection:"column", outline:isSelected?"2px solid var(--blue-2)":"none", outlineOffset:-2 }}
                  >
                    <div style={{ width:26, height:26, borderRadius:8, background:isToday?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:13, fontWeight:isToday?800:500, color:isToday?"#fff":s.tc }}>{day}</span>
                    </div>
                    <div style={{ marginTop:"auto" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:s.dot, boxShadow:status==="available"?"0 0 7px rgba(16,185,129,0.6)":status==="booked"?"0 0 7px rgba(64,128,240,0.6)":"none" }} />
                      {status==="booked"&&event&&<span style={{ fontSize:9, color:"var(--blue-1)", display:"block", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:700 }}>{event.event_type==="wedding"?"💍":"🎉"} {event.couple}</span>}
                      {status==="conditional"&&<span style={{ fontSize:7, color:"#ef4444", display:"block", marginTop:2, fontWeight:700 }}>Bersyarat</span>}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          {/* SELECTED EVENT */}
          {selectedDay && selectedEvents.length > 0 && (
            <div className="card scale-in" style={{ padding:"24px 28px", borderLeft:"4px solid var(--blue-2)", marginBottom:24, boxShadow:"var(--shadow)" }}>
              <h3 style={{ fontSize:20, fontWeight:800, marginBottom:14, color:"var(--navy)", letterSpacing:-0.5 }}>
                {selectedDay} {MONTHS[month]} {year}
              </h3>
              {selectedEvents.map((e, i) => (
                <div key={i}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, marginBottom:8 }}>{e.event_type==="wedding"?"💍":"🎉"} {e.couple}</p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:16 }}>
                    {e.venue && <span style={{ fontSize:13, color:"var(--muted)", fontWeight:500 }}>📍 {e.venue}</span>}
                    {e.time  && <span style={{ fontSize:13, color:"var(--muted)", fontWeight:500 }}>🕐 {e.time}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CONTACT */}
          <div className={mounted?"card fade-up anim-delay-2":"card"} style={{ padding:"24px 32px", boxShadow:"var(--shadow-sm)", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:0, right:0, width:130, height:130, borderRadius:"0 20px 0 100%", background:"linear-gradient(135deg,rgba(30,96,213,0.07),transparent)", pointerEvents:"none" }} />
            <div style={{ position:"absolute", bottom:0, left:0, width:80, height:80, borderRadius:"0 100% 0 20px", background:"linear-gradient(315deg,rgba(64,128,240,0.05),transparent)", pointerEvents:"none" }} />
            <p style={{ fontSize:13, color:"var(--mid)", lineHeight:1.8, marginBottom:18, fontWeight:500, position:"relative" }}>
              Diharapkan untuk mengkonfirmasi pendaftaran dikota terlebih dahulu bersama Staff Altion. Untuk booklet dan pendaftaran dapat diakses di tombol berikut.
            </p>
            <div style={{ display:"flex", justifyContent:"center", position:"relative" }}>
              <a href="https://forms.gle/zRcoKT4nPckRDT2s5" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize:13, padding:"10px 32px" }}>
                🌐 Daftar Sekarang
              </a>
            </div>
          </div>

        </main>
        <footer style={{ textAlign:"center", padding:"24px 0 16px", color:"var(--muted)", fontSize:11, opacity:0.4, position:"relative", zIndex:1 }}>
          Created by GG
        </footer>
      </div>
    </>
  );
}