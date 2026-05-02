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

function BgDecor() {
  return (
    <>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
      <div className="bg-orb bg-orb-4" />

      {/* dot grid */}
      <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        backgroundImage:"radial-gradient(circle,rgba(30,96,213,0.13) 1px,transparent 1px)",
        backgroundSize:"36px 36px",
        maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)",
        WebkitMaskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)",
      }}/>

      {/* top-left: spinning dashed circle + crosshair */}
      <div className="float-shape-1" style={{ position:"fixed",top:70,left:36,zIndex:0,pointerEvents:"none",opacity:0.09 }}>
        <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
          <circle cx="65" cy="65" r="60" stroke="#1e60d5" strokeWidth="1.4" strokeDasharray="9 7" className="ring-spin"/>
          <circle cx="65" cy="65" r="40" stroke="#4080f0" strokeWidth="0.8" strokeDasharray="4 9" className="ring-spin-rev"/>
          <line x1="5" y1="65" x2="125" y2="65" stroke="#1e60d5" strokeWidth="0.6" opacity="0.5"/>
          <line x1="65" y1="5" x2="65" y2="125" stroke="#1e60d5" strokeWidth="0.6" opacity="0.5"/>
          <circle cx="65" cy="65" r="4" fill="#1e60d5" opacity="0.6"/>
        </svg>
      </div>

      {/* top-right: rounded square + inner square */}
      <div className="float-shape-2" style={{ position:"fixed",top:140,right:44,zIndex:0,pointerEvents:"none",opacity:0.07,animationDelay:"1.5s" }}>
        <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
          <rect x="10" y="10" width="90" height="90" rx="20" stroke="#1535a0" strokeWidth="1.4" strokeDasharray="10 7" className="ring-spin-rev"/>
          <rect x="32" y="32" width="46" height="46" rx="10" stroke="#4080f0" strokeWidth="0.8" strokeDasharray="5 8" className="ring-spin"/>
        </svg>
      </div>

      {/* mid-left: triangle */}
      <div className="float-shape-3" style={{ position:"fixed",top:"42%",left:22,zIndex:0,pointerEvents:"none",opacity:0.07,animationDelay:"0.8s" }}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <polygon points="36,4 70,66 2,66" stroke="#4080f0" strokeWidth="1.3" fill="none" strokeDasharray="6 5" className="dash-anim"/>
        </svg>
      </div>

      {/* mid-right: diamond */}
      <div className="float-shape-1" style={{ position:"fixed",top:"38%",right:28,zIndex:0,pointerEvents:"none",opacity:0.07,animationDelay:"3s" }}>
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
          <rect x="8" y="8" width="52" height="52" rx="4" stroke="#1e60d5" strokeWidth="1.2" transform="rotate(45 34 34)" fill="none" strokeDasharray="5 6" className="dash-anim-slow"/>
        </svg>
      </div>

      {/* bottom-right: nested circles */}
      <div className="float-shape-2" style={{ position:"fixed",bottom:110,right:52,zIndex:0,pointerEvents:"none",opacity:0.08,animationDelay:"2s" }}>
        <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
          <circle cx="75" cy="75" r="68" stroke="#1535a0" strokeWidth="1.2" strokeDasharray="10 8" className="ring-spin-rev"/>
          <circle cx="75" cy="75" r="48" stroke="#4080f0" strokeWidth="0.8" strokeDasharray="6 10" className="ring-spin"/>
          <circle cx="75" cy="75" r="28" stroke="#1e60d5" strokeWidth="0.6" strokeDasharray="3 9" className="ring-spin-rev"/>
        </svg>
      </div>

      {/* bottom-left: hexagon-ish */}
      <div className="float-shape-3" style={{ position:"fixed",bottom:180,left:48,zIndex:0,pointerEvents:"none",opacity:0.07,animationDelay:"1s" }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <polygon points="40,4 74,22 74,58 40,76 6,58 6,22" stroke="#1e60d5" strokeWidth="1.2" fill="none" strokeDasharray="7 6" className="dash-anim"/>
        </svg>
      </div>

      {/* twinkling dots scattered */}
      {[
        {x:"15%",y:"25%"},{x:"82%",y:"18%"},{x:"70%",y:"55%"},
        {x:"8%",y:"68%"},{x:"90%",y:"75%"},{x:"45%",y:"88%"},
      ].map(({x,y},i)=>(
        <div key={i} className={["dot-twinkle","dot-twinkle-2","dot-twinkle-3"][i%3]}
          style={{ position:"fixed",left:x,top:y,width:4,height:4,borderRadius:"50%",background:"#1e60d5",zIndex:0,pointerEvents:"none" }}/>
      ))}

      {/* corner accent lines */}
      <div style={{ position:"fixed",top:0,left:0,zIndex:0,pointerEvents:"none",opacity:0.1 }}>
        <svg width="180" height="180"><path d="M0 90 L90 0" stroke="#1e60d5" strokeWidth="1"/><path d="M0 150 L150 0" stroke="#1e60d5" strokeWidth="0.4"/><path d="M0 40 L40 0" stroke="#1e60d5" strokeWidth="0.5"/></svg>
      </div>
      <div style={{ position:"fixed",bottom:0,right:0,zIndex:0,pointerEvents:"none",opacity:0.1,transform:"rotate(180deg)" }}>
        <svg width="180" height="180"><path d="M0 90 L90 0" stroke="#1e60d5" strokeWidth="1"/><path d="M0 150 L150 0" stroke="#1e60d5" strokeWidth="0.4"/></svg>
      </div>
    </>
  );
}

// ── CALENDAR GRID ──
function CalendarGrid({ year, month, events, selectedDay, onSelectDay, today }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  function getDayStatus(day) {
    const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const event = events.find(e => e.date === dateStr);
    if (event) return { status:"booked", event };
    if (new Date(dateStr) < today) return { status:"past" };
    if (isWeekend(dateStr)) return { status:"available" };
    return { status:"conditional" };
  }

  // Hitung jumlah baris yang dibutuhkan
  const totalCells = startOffset + daysInMonth;
  const numRows = Math.ceil(totalCells / 7);

  // Buat semua cells dalam array terurut (offset + hari)
  const cells = [
    ...Array.from({length:startOffset}, (_,i) => ({ type:"empty", key:`e-${i}` })),
    ...Array.from({length:daysInMonth}, (_,i) => ({ type:"day", day:i+1 })),
    // padding cells akhir agar grid penuh
    ...Array.from({length: numRows*7 - totalCells}, (_,i) => ({ type:"empty", key:`t-${i}` })),
  ];

  return (
    <div style={{
      display:"grid",
      gridTemplateColumns:"repeat(7,1fr)",
      gridTemplateRows:`repeat(${numRows}, 1fr)`,
    }}>
      {cells.map((cell) => {
        if (cell.type === "empty") return (
          <div key={cell.key} style={{ background:"rgba(250,252,255,0.6)",borderRight:"1px solid var(--border)",borderBottom:"1px solid var(--border)",minHeight:76 }}/>
        );

        const { day } = cell;
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
            onClick={() => status==="booked" ? onSelectDay(isSelected?null:day) : null}
            style={{
              background:isSelected?"rgba(219,238,255,0.95)":s.bg,
              borderRight:"1px solid var(--border)",
              borderBottom:"1px solid var(--border)",
              padding:"10px 10px 8px",
              cursor:status==="booked"?"pointer":"default",
              display:"flex", flexDirection:"column",
              minHeight:76,
              outline:isSelected?"2px solid var(--blue-2)":"none",
              outlineOffset:-2,
            }}
          >
            <div style={{ width:26,height:26,borderRadius:8,background:isToday?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <span style={{ fontSize:13,fontWeight:isToday?800:500,color:isToday?"#fff":s.tc }}>{day}</span>
            </div>
            <div style={{ marginTop:"auto",minWidth:0 }}>
              <div style={{ width:6,height:6,borderRadius:"50%",background:s.dot,flexShrink:0,boxShadow:status==="available"?"0 0 7px rgba(16,185,129,0.6)":status==="booked"?"0 0 7px rgba(64,128,240,0.6)":"none" }}/>
              {status==="booked"&&event&&(
                <div style={{ fontSize:9,color:"var(--blue-1)",marginTop:2,fontWeight:700,lineHeight:1.3,
                  display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",
                  overflow:"hidden",wordBreak:"break-word" }}>
                  {event.event_type==="wedding"?"💍":"🎉"} {event.couple}
                </div>
              )}
              {status==="conditional"&&<span style={{ fontSize:7,color:"#ef4444",display:"block",marginTop:2,fontWeight:700 }}>Bersyarat</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [displayDate, setDisplayDate] = useState(new Date());
  const [pendingDate, setPendingDate] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [direction, setDirection] = useState(null); // "next"|"prev"|null
  const [isAnimating, setIsAnimating] = useState(false);
  const [labelKey, setLabelKey] = useState(0);
  const { businessName } = CALENDAR_CONFIG;
  const today = useRef(new Date()); today.current.setHours(0,0,0,0);

  useEffect(() => {
    setMounted(true);
    fetch("/api/events").then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setEvents(d); });
  }, []);

  function changeMonth(dir) {
    if (isAnimating) return;
    const next = new Date(displayDate.getFullYear(), displayDate.getMonth() + dir, 1);
    setDirection(dir === 1 ? "next" : "prev");
    setPendingDate(next);
    setIsAnimating(true);
    setSelectedDay(null);
    setLabelKey(k => k+1);
    setTimeout(() => {
      setDisplayDate(next);
      setPendingDate(null);
      setDirection(null);
      setIsAnimating(false);
    }, 420);
  }

  const year = displayDate.getFullYear();
  const month = displayDate.getMonth();

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
      <div style={{ minHeight:"100vh",position:"relative",overflow:"hidden" }}>
        <BgDecor />

        {/* HEADER */}
        <header style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",padding:"0 40px",height:68,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 32px rgba(10,22,40,0.4)",position:"sticky",top:0,zIndex:100 }}>
          <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none" }}/>
          <div style={{ display:"flex",alignItems:"center",gap:14,position:"relative" }}>
            <div style={{ width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:5,border:"1.5px solid rgba(255,255,255,0.2)" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <div>
              <span style={{ color:"#fff",fontSize:17,fontWeight:800,letterSpacing:-0.5,display:"block",lineHeight:1.1 }}>{businessName}</span>
              <span style={{ color:"rgba(255,255,255,0.45)",fontSize:9,letterSpacing:2.5,textTransform:"uppercase",fontWeight:600 }}>Event & Wedding Calendar</span>
            </div>
          </div>
          <Link href="/admin" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px",position:"relative" }}>Admin</Link>
        </header>

        <main style={{ maxWidth:900,margin:"0 auto",padding:"40px 20px",position:"relative",zIndex:1 }}>

          {/* HERO */}
          <div className={mounted?"fade-up":""} style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--blue-1) 100%)",borderRadius:24,padding:"40px 44px",marginBottom:28,boxShadow:"0 16px 48px rgba(10,22,40,0.25)",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none" }}/>
            <div style={{ position:"absolute",top:-60,right:-40,width:220,height:220,borderRadius:"50%",background:"rgba(64,128,240,0.2)",filter:"blur(40px)",pointerEvents:"none" }}/>
            <div className="ring-spin" style={{ position:"absolute",top:-20,right:40,width:180,height:180,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.07)",pointerEvents:"none",transformOrigin:"center" }}/>
            <div className="ring-spin-rev" style={{ position:"absolute",top:10,right:70,width:120,height:120,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.05)",pointerEvents:"none",transformOrigin:"center" }}/>
            <div style={{ position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:20 }}>
              <div>
                <p style={{ color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:3.5,textTransform:"uppercase",marginBottom:12,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ display:"inline-block",width:28,height:1,background:"rgba(255,255,255,0.25)" }}/>Jadwal Tersedia
                </p>
                <h2 style={{ color:"#fff",fontSize:32,fontWeight:800,letterSpacing:-1,marginBottom:10,lineHeight:1.1 }}>Cek Ketersediaan<br/>Tanggal</h2>
                <p style={{ color:"rgba(255,255,255,0.5)",fontSize:13,lineHeight:1.7,maxWidth:340,fontWeight:400 }}>Untuk reservasi, konfirmasi terlebih dahulu bersama Staff Altion.</p>
              </div>

              {/* Legend + logo watermark di belakangnya */}
              <div style={{ position:"relative",display:"flex",flexDirection:"column",gap:12 }}>
                {/* logo watermark tepat di belakang legend */}
                <img src="/logo.png" alt="" aria-hidden="true" style={{
                  position:"absolute",
                  right:-28, top:"50%", transform:"translateY(-50%)",
                  width:260, height:260,
                  objectFit:"contain",
                  opacity:0.3,
                  pointerEvents:"none",
                  userSelect:"none",
                  filter:"brightness(0) invert(1)",
                  zIndex:0,
                }}/>
                {[
                  {color:"#10b981",label:"Weekend — Tersedia",glow:"rgba(16,185,129,0.5)"},
                  {color:"#ef4444",label:"Hari Kerja — Bersyarat",glow:"rgba(239,68,68,0.5)"},
                  {color:"#4080f0",label:"Sudah Dipesan",glow:"rgba(64,128,240,0.5)"},
                ].map(({color,label,glow})=>(
                  <div key={label} style={{ display:"flex",alignItems:"center",gap:10,position:"relative",zIndex:1 }}>
                    <div style={{ width:8,height:8,borderRadius:"50%",background:color,flexShrink:0,boxShadow:`0 0 10px ${glow}` }}/>
                    <span style={{ color:"rgba(255,255,255,0.7)",fontSize:12,fontWeight:500 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CALENDAR */}
          <div className={mounted?"card fade-up anim-delay-1":"card"} style={{ overflow:"hidden",marginBottom:24,boxShadow:"var(--shadow)" }}>

            {/* Month header with smooth label transition */}
            <div style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--blue-1) 100%)",padding:"22px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none" }}/>

              <button onClick={()=>changeMonth(-1)} disabled={isAnimating}
                style={{ background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.2)",color:"#fff",width:38,height:38,borderRadius:10,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",position:"relative",zIndex:1 }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.22)";e.currentTarget.style.transform="scale(1.12)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.transform="scale(1)";}}
              >‹</button>

              {/* Label with horizontal overlay */}
              <div style={{ textAlign:"center",position:"relative",zIndex:1,minWidth:160,height:52,overflow:"hidden" }}>
                {/* exiting label */}
                {isAnimating && (
                  <div className={direction==="next"?"label-exit-next":"label-exit-prev"}
                    style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                    <h2 style={{ color:"#fff",fontSize:26,fontWeight:800,letterSpacing:-0.5,lineHeight:1.1 }}>{MONTHS[month]}</h2>
                    <span style={{ color:"rgba(255,255,255,0.45)",fontSize:12,fontWeight:600,letterSpacing:2 }}>{year}</span>
                  </div>
                )}
                {/* entering label */}
                {pendingDate && (
                  <div className={direction==="next"?"label-enter-next":"label-enter-prev"}
                    style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                    <h2 style={{ color:"#fff",fontSize:26,fontWeight:800,letterSpacing:-0.5,lineHeight:1.1 }}>{MONTHS[pendingDate.getMonth()]}</h2>
                    <span style={{ color:"rgba(255,255,255,0.45)",fontSize:12,fontWeight:600,letterSpacing:2 }}>{pendingDate.getFullYear()}</span>
                  </div>
                )}
                {/* static label when not animating */}
                {!isAnimating && !pendingDate && (
                  <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                    <h2 style={{ color:"#fff",fontSize:26,fontWeight:800,letterSpacing:-0.5,lineHeight:1.1 }}>{MONTHS[month]}</h2>
                    <span style={{ color:"rgba(255,255,255,0.45)",fontSize:12,fontWeight:600,letterSpacing:2 }}>{year}</span>
                  </div>
                )}
              </div>

              <button onClick={()=>changeMonth(1)} disabled={isAnimating}
                style={{ background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.2)",color:"#fff",width:38,height:38,borderRadius:10,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",position:"relative",zIndex:1 }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.22)";e.currentTarget.style.transform="scale(1.12)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.transform="scale(1)";}}
              >›</button>
            </div>

            {/* Day headers */}
            <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"var(--bg2)",borderBottom:"1px solid var(--border)" }}>
              {DAYS.map(d=><div key={d} style={{ textAlign:"center",padding:"12px 0",fontSize:10,fontWeight:700,letterSpacing:1.5,color:"var(--muted)",textTransform:"uppercase" }}>{d}</div>)}
            </div>

            {/* Grid with overlay transition */}
            <div className="cal-wrapper">
              {/* exiting grid */}
              {isAnimating && pendingDate && (
                <div className={direction==="next"?"cal-exit-left":"cal-exit-right"}>
                  <CalendarGrid year={year} month={month} events={events} selectedDay={null} onSelectDay={()=>{}} today={today.current}/>
                </div>
              )}
              {/* entering grid */}
              {pendingDate ? (
                <div className={direction==="next"?"cal-enter-next":"cal-enter-prev"}>
                  <CalendarGrid year={pendingDate.getFullYear()} month={pendingDate.getMonth()} events={events} selectedDay={null} onSelectDay={()=>{}} today={today.current}/>
                </div>
              ) : (
                <CalendarGrid year={year} month={month} events={events} selectedDay={selectedDay} onSelectDay={setSelectedDay} today={today.current}/>
              )}
            </div>
          </div>

          {/* SELECTED EVENT */}
          {selectedDay && selectedEvents.length > 0 && (
            <div className="card scale-in" style={{ padding:"24px 28px",borderLeft:"4px solid var(--blue-2)",marginBottom:24,boxShadow:"var(--shadow)" }}>
              <h3 style={{ fontSize:20,fontWeight:800,marginBottom:14,color:"var(--navy)",letterSpacing:-0.5 }}>{selectedDay} {MONTHS[month]} {year}</h3>
              {selectedEvents.map((e,i)=>(
                <div key={i}>
                  <p style={{ fontFamily:"'Plus Jakarta Sans',serif",fontSize:24,marginBottom:8 }}>{e.event_type==="wedding"?"💍":"🎉"} {e.couple}</p>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:16 }}>
                    {e.venue&&<span style={{ fontSize:13,color:"var(--muted)",fontWeight:500 }}>📍 {e.venue}</span>}
                    {e.time&&<span style={{ fontSize:13,color:"var(--muted)",fontWeight:500 }}>🕐 {e.time}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CONTACT */}
          <div className={mounted?"card fade-up anim-delay-2":"card"} style={{ padding:"24px 32px",boxShadow:"var(--shadow-sm)",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",top:0,right:0,width:130,height:130,borderRadius:"0 20px 0 100%",background:"linear-gradient(135deg,rgba(30,96,213,0.07),transparent)",pointerEvents:"none" }}/>
            <div style={{ position:"absolute",bottom:0,left:0,width:80,height:80,borderRadius:"0 100% 0 20px",background:"linear-gradient(315deg,rgba(64,128,240,0.05),transparent)",pointerEvents:"none" }}/>
            <p style={{ fontSize:13,color:"var(--mid)",lineHeight:1.8,marginBottom:18,fontWeight:500,position:"relative" }}>
              Diharapkan untuk mengkonfirmasi pendaftaran dikota terlebih dahulu bersama Staff Altion. Untuk booklet dan pendaftaran dapat diakses di tombol berikut.
            </p>
            <div style={{ display:"flex",justifyContent:"center",position:"relative" }}>
              <a href="https://forms.gle/zRcoKT4nPckRDT2s5" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize:13,padding:"10px 32px" }}>
                🌐 Daftar Sekarang
              </a>
            </div>
          </div>
        </main>

        <footer style={{ textAlign:"center",padding:"24px 0 16px",color:"var(--muted)",fontSize:11,opacity:0.4,position:"relative",zIndex:1 }}>Created by GG & Caramolly</footer>
      </div>
    </>
  );
}
