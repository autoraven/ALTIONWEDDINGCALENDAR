import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

function formatDateShort(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" });
}

function BgDecor() {
  return (
    <>
      <div className="bg-orb bg-orb-1"/><div className="bg-orb bg-orb-2"/><div className="bg-orb bg-orb-3"/><div className="bg-orb bg-orb-4"/>
      <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",backgroundImage:"radial-gradient(circle,rgba(30,96,213,0.13) 1px,transparent 1px)",backgroundSize:"36px 36px",maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)",WebkitMaskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)"}}/>
      <div className="float-shape-1" style={{ position:"fixed",top:90,right:48,zIndex:0,pointerEvents:"none",opacity:0.08 }}>
        <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
          <circle cx="65" cy="65" r="60" stroke="#1e60d5" strokeWidth="1.4" strokeDasharray="9 7" className="ring-spin"/>
          <circle cx="65" cy="65" r="40" stroke="#4080f0" strokeWidth="0.8" strokeDasharray="4 9" className="ring-spin-rev"/>
          <line x1="5" y1="65" x2="125" y2="65" stroke="#1e60d5" strokeWidth="0.6" opacity="0.5"/>
          <line x1="65" y1="5" x2="65" y2="125" stroke="#1e60d5" strokeWidth="0.6" opacity="0.5"/>
          <circle cx="65" cy="65" r="4" fill="#1e60d5" opacity="0.5"/>
        </svg>
      </div>
      {[{x:"12%",y:"22%"},{x:"85%",y:"15%"},{x:"72%",y:"58%"},{x:"6%",y:"70%"},{x:"92%",y:"78%"},{x:"48%",y:"90%"}].map(({x,y},i)=>(
        <div key={i} className={["dot-twinkle","dot-twinkle-2","dot-twinkle-3"][i%3]} style={{ position:"fixed",left:x,top:y,width:4,height:4,borderRadius:"50%",background:"#1e60d5",zIndex:0,pointerEvents:"none" }}/>
      ))}
    </>
  );
}

// Cek apakah sebuah tanggal masuk dalam range event (date s/d date_end)
function dateInRange(dateStr, event) {
  const d = dateStr;
  const start = event.date;
  const end = event.date_end || event.date;
  return d >= start && d <= end;
}

function CalendarGrid({ year, month, events, selectedRange, onDayClick, today, pickingEnd, rangeStart }) {
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const startOffset = firstDay===0?6:firstDay-1;

  function getDayInfo(day) {
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const event = events.find(e => dateInRange(dateStr, e));
    const isPast = new Date(dateStr) < today;
    if (event) return { status:"booked", event, dateStr };
    if (isPast) return { status:"past", dateStr };
    if (isWeekend(dateStr)) return { status:"available", dateStr };
    return { status:"conditional", dateStr };
  }

  const totalCells = startOffset + daysInMonth;
  const numRows = Math.ceil(totalCells / 7);
  const cells = [
    ...Array.from({length:startOffset}, (_,i) => ({ type:"empty", key:`e-${i}` })),
    ...Array.from({length:daysInMonth}, (_,i) => ({ type:"day", day:i+1 })),
    ...Array.from({length: numRows*7 - totalCells}, (_,i) => ({ type:"empty", key:`t-${i}` })),
  ];

  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",gridTemplateRows:`repeat(${numRows},1fr)` }}>
      {cells.map((cell) => {
        if (cell.type==="empty") return (
          <div key={cell.key} style={{ minHeight:64,background:"rgba(250,252,255,0.6)",borderRight:"1px solid var(--border)",borderBottom:"1px solid var(--border)" }}/>
        );
        const {day}=cell;
        const {status,event,dateStr}=getDayInfo(day);
        const isToday=new Date(dateStr).toDateString()===today.toDateString();

        // Range highlight
        const inSelectedRange = selectedRange.start && selectedRange.end &&
          dateStr >= selectedRange.start && dateStr <= selectedRange.end;
        const isRangeStart = dateStr === selectedRange.start;
        const isRangeEnd = dateStr === selectedRange.end;
        const isSelected = isRangeStart || isRangeEnd;

        // Preview range while picking end
        const inPreview = pickingEnd && rangeStart && dateStr >= rangeStart && dateStr <= pickingEnd;

        const s={
          booked:{bg:"rgba(238,244,255,0.9)",dot:"#4080f0"},
          conditional:{bg:"rgba(255,245,245,0.9)",dot:"#ef4444"},
          past:{bg:"rgba(250,250,250,0.5)",dot:"#ddd"},
          available:{bg:"rgba(240,253,248,0.9)",dot:"#10b981"}
        }[status];

        let bg = s.bg;
        if (inPreview) bg = "rgba(200,225,255,0.7)";
        if (inSelectedRange) bg = "rgba(208,228,255,0.85)";
        if (isSelected) bg = "rgba(200,222,255,0.98)";

        return(
          <div key={day} className="day-cell" onClick={()=>onDayClick(dateStr,status)}
            style={{ minHeight:64,background:bg,padding:"8px 8px 6px",
              borderRight:"1px solid var(--border)",borderBottom:"1px solid var(--border)",
              cursor:status!=="past"?"pointer":"default",display:"flex",flexDirection:"column",
              outline:isSelected?"2px solid var(--blue-2)":"none",outlineOffset:-2,
              borderRadius:isRangeStart?"4px 0 0 4px":isRangeEnd?"0 4px 4px 0":"none"
            }}
          >
            <div style={{ width:24,height:24,borderRadius:7,
              background:isToday?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":isSelected?"var(--blue-2)":"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <span style={{ fontSize:12,fontWeight:isToday||isSelected?800:500,color:isToday||isSelected?"#fff":status==="past"?"#ccc":"var(--dark)" }}>{day}</span>
            </div>
            <div style={{ marginTop:"auto",minWidth:0 }}>
              <div style={{ width:6,height:6,borderRadius:"50%",background:s.dot,boxShadow:status==="available"?"0 0 7px rgba(16,185,129,0.6)":status==="booked"?"0 0 7px rgba(64,128,240,0.6)":"none" }}/>
              {status==="booked"&&event&&(
                <div style={{ fontSize:8,color:"var(--blue-1)",marginTop:2,fontWeight:700,lineHeight:1.3,
                  display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",
                  overflow:"hidden",wordBreak:"break-word" }}>
                  {event.event_type==="wedding"?"💍":"🎉"} {event.couple}
                  {event.date_end && event.date_end !== event.date && <span style={{ display:"block",fontSize:7,opacity:0.7 }}>multi-hari</span>}
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

export default function AdminPanel() {
  const [isLoggedIn,setIsLoggedIn]=useState(false);
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [loginError,setLoginError]=useState("");
  const [events,setEvents]=useState([]);
  const [displayDate,setDisplayDate]=useState(new Date());
  const [pendingDate,setPendingDate]=useState(null);
  const [direction,setDirection]=useState(null);
  const [isAnimating,setIsAnimating]=useState(false);
  const [showForm,setShowForm]=useState(false);
  const [eventType,setEventType]=useState("");
  const [form,setForm]=useState({couple:"",venue:"",time:"",notes:"",addon:"",max_staff:""});
  const [formError,setFormError]=useState("");
  const [success,setSuccess]=useState("");
  const [mounted,setMounted]=useState(false);

  // Multi-day range selection
  const [selectedRange,setSelectedRange]=useState({start:"",end:""});
  const [pickingStep,setPickingStep]=useState(0); // 0=idle, 1=picked start, waiting end
  const [hoverDate,setHoverDate]=useState(null);

  // Event list: search + tab
  const [eventSearch,setEventSearch]=useState("");
  const [eventTab,setEventTab]=useState("upcoming"); // "upcoming" | "past"

  const today=useRef(new Date()); today.current.setHours(0,0,0,0);
  const todayStr = today.current.toISOString().split("T")[0];
  const {businessName}=CALENDAR_CONFIG;

  const fetchEvents=useCallback(async()=>{
    const res=await fetch("/api/events"); const data=await res.json();
    if(Array.isArray(data)) setEvents(data);
  },[]);

  useEffect(()=>{ setMounted(true); if(sessionStorage.getItem("admin_auth")==="true"){setIsLoggedIn(true);fetchEvents();} },[fetchEvents]);

  function changeMonth(dir) {
    if(isAnimating) return;
    const next=new Date(displayDate.getFullYear(),displayDate.getMonth()+dir,1);
    setDirection(dir===1?"next":"prev"); setPendingDate(next); setIsAnimating(true);
    setTimeout(()=>{ setDisplayDate(next); setPendingDate(null); setDirection(null); setIsAnimating(false); },420);
  }

  async function handleLogin(e) {
    e.preventDefault(); setLoginError("");
    const res=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});
    const data=await res.json();
    if(data.success){sessionStorage.setItem("admin_auth","true");setIsLoggedIn(true);fetchEvents();}
    else setLoginError(data.message);
  }

  function handleDayClick(dateStr, status) {
    if (status==="past") return;
    if (pickingStep===0) {
      // Check if clicked on booked day → don't open if already booked
      const booked = events.find(e => dateInRange(dateStr, e));
      if (booked) return;
      setSelectedRange({start:dateStr, end:dateStr});
      setPickingStep(1);
      setEventType(""); setForm({couple:"",venue:"",time:"",notes:"",addon:"",max_staff:""}); setFormError(""); setShowForm(true);
    } else if (pickingStep===1) {
      if (dateStr < selectedRange.start) {
        setSelectedRange({start:dateStr, end:selectedRange.start});
      } else {
        setSelectedRange(prev=>({...prev, end:dateStr}));
      }
      setPickingStep(0);
    }
  }

  async function handleAddEvent(e) {
    e.preventDefault(); setFormError("");
    if(!form.couple.trim()) return setFormError(eventType==="wedding"?"Nama pasangan wajib diisi":"Nama event wajib diisi");
    if(!selectedRange.start) return setFormError("Pilih tanggal event di kalender");

    // Check overlap dengan event lain
    const start = selectedRange.start;
    const end = selectedRange.end || selectedRange.start;
    const overlap = events.find(ev => {
      const evStart = ev.date;
      const evEnd = ev.date_end || ev.date;
      return start <= evEnd && end >= evStart;
    });
    if (overlap) return setFormError(`Tanggal bentrok dengan event: ${overlap.couple}`);

    const res=await fetch("/api/events",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({...form, date:start, date_end:end, event_type:eventType})});
    const data=await res.json();
    if(data.error) return setFormError(data.error);
    setEvents(prev=>[...prev,data]);
    setForm({couple:"",venue:"",time:"",notes:"",addon:"",max_staff:""});
    setEventType(""); setShowForm(false); setSelectedRange({start:"",end:""}); setPickingStep(0);
    setSuccess("Event berhasil ditambahkan!"); setTimeout(()=>setSuccess(""),3500);
  }

  async function handleDelete(id) {
    if(!confirm("Hapus event ini?")) return;
    const res=await fetch(`/api/events?id=${id}`,{method:"DELETE"});
    if(res.ok) setEvents(prev=>prev.filter(e=>e.id!==id));
  }

  function cancelForm() {
    setShowForm(false); setEventType(""); setSelectedRange({start:"",end:""}); setPickingStep(0);
  }

  function logout(){sessionStorage.removeItem("admin_auth");setIsLoggedIn(false);}

  const year=displayDate.getFullYear(); const month=displayDate.getMonth();
  const thisMonthEvents=events.filter(e=>{const d=new Date(e.date);return d.getMonth()===month&&d.getFullYear()===year;});

  // Event list filters
  const upcomingEvents = events.filter(e => (e.date_end || e.date) >= todayStr);
  const pastEvents     = events.filter(e => (e.date_end || e.date) <  todayStr);
  const baseList = eventTab==="upcoming" ? upcomingEvents : pastEvents;
  const q = eventSearch.trim().toLowerCase();
  const filteredEvents = q
    ? baseList.filter(e =>
        e.couple?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.event_type?.toLowerCase().includes(q) ||
        e.addon?.toLowerCase().includes(q)
      )
    : baseList;

  if(!isLoggedIn) return(
    <>
      <Head><title>Admin Login — {businessName}</title><link rel="icon" href="/favicon.ico"/></Head>
      <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none" }}/>
        <div className={mounted?"scale-in":""} style={{ background:"rgba(255,255,255,0.97)",width:"100%",maxWidth:420,borderRadius:24,overflow:"hidden",boxShadow:"0 32px 80px rgba(10,22,40,0.5)",position:"relative",zIndex:1 }}>
          <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"40px 40px 32px",textAlign:"center",position:"relative",overflow:"hidden" }}>
            <div style={{ width:68,height:68,borderRadius:18,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",padding:8,overflow:"hidden",position:"relative",zIndex:1 }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <h1 style={{ color:"#fff",fontSize:28,fontWeight:800,letterSpacing:-0.5,position:"relative",zIndex:1 }}>{businessName}</h1>
            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,letterSpacing:3,marginTop:6,textTransform:"uppercase",fontWeight:600,position:"relative",zIndex:1 }}>Admin Panel</p>
          </div>
          <form onSubmit={handleLogin} style={{ padding:"36px 40px" }}>
            {loginError&&<div style={{ background:"#fff0f0",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:12,marginBottom:20,fontSize:13,fontWeight:500 }}>⚠️ {loginError}</div>}
            {[{label:"Username",value:username,setter:setUsername,type:"text",placeholder:"Masukkan username"},{label:"Password",value:password,setter:setPassword,type:"password",placeholder:"Masukkan password"}].map(({label,value,setter,type,placeholder})=>(
              <div key={label} style={{ marginBottom:18 }}>
                <label className="label">{label}</label>
                <input type={type} value={value} onChange={e=>setter(e.target.value)} placeholder={placeholder} className="input" required/>
              </div>
            ))}
            <button type="submit" className="btn btn-primary" style={{ width:"100%",marginTop:6,padding:"13px",fontSize:14 }}>Masuk ke Dashboard</button>
            <div style={{ marginTop:20,textAlign:"center" }}>
              <Link href="/" style={{ fontSize:12,color:"var(--muted)",textDecoration:"none",fontWeight:500 }}>← Kembali ke Kalender</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return(
    <>
      <Head><title>Admin Dashboard — {businessName}</title><link rel="icon" href="/favicon.ico"/></Head>
      <div style={{ minHeight:"100vh",position:"relative",overflow:"hidden" }}>
        <BgDecor/>
        <header style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",padding:"0 40px",height:68,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 32px rgba(10,22,40,0.4)",position:"sticky",top:0,zIndex:100 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14,position:"relative" }}>
            <div style={{ width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:5,border:"1.5px solid rgba(255,255,255,0.2)" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <div>
              <span style={{ color:"#fff",fontSize:17,fontWeight:800,letterSpacing:-0.5,display:"block",lineHeight:1.1 }}>{businessName}</span>
              <span style={{ color:"rgba(255,255,255,0.45)",fontSize:9,letterSpacing:2.5,textTransform:"uppercase",fontWeight:600 }}>Dashboard Admin</span>
            </div>
          </div>
          <div style={{ display:"flex",gap:10,position:"relative" }}>
            <Link href="/" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px" }}>Lihat Kalender</Link>
            <button onClick={logout} className="btn btn-danger" style={{ fontSize:12,padding:"8px 18px" }}>Logout</button>
          </div>
        </header>

        <main style={{ maxWidth:1080,margin:"0 auto",padding:"32px 20px",position:"relative",zIndex:1 }}>
          {success&&<div className="scale-in" style={{ background:"rgba(240,253,244,0.95)",border:"1px solid #86efac",color:"#15803d",padding:"12px 20px",borderRadius:14,marginBottom:24,fontSize:13,fontWeight:600,backdropFilter:"blur(8px)" }}>✅ {success}</div>}

          {/* Stats */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:28 }}>
            {[{label:"Total Event",value:events.length,icon:"📅",color:"var(--blue-2)"},{label:"Bulan Ini",value:thisMonthEvents.length,icon:"🗓️",color:"var(--blue-1)"},{label:"Wedding",value:events.filter(e=>e.event_type==="wedding").length,icon:"💍",color:"#7c3aed"},{label:"Event Biasa",value:events.filter(e=>e.event_type==="event").length,icon:"🎉",color:"#059669"}].map(({label,value,icon,color},idx)=>(
              <div key={label} className={mounted?`card fade-up anim-delay-${idx+1}`:"card"} style={{ padding:"22px 24px",textAlign:"center",position:"relative",overflow:"hidden" }}>
                <div style={{ position:"absolute",top:-10,right:-10,width:70,height:70,borderRadius:"50%",background:`${color}12`,pointerEvents:"none" }}/>
                <div style={{ fontSize:22,marginBottom:10 }}>{icon}</div>
                <div style={{ fontSize:38,fontWeight:800,color,lineHeight:1,letterSpacing:-1,marginBottom:6 }}>{value}</div>
                <div style={{ fontSize:10,color:"var(--muted)",letterSpacing:1.5,textTransform:"uppercase",fontWeight:700 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"1fr 400px",gap:24,alignItems:"start" }}>
            {/* Calendar */}
            <div className="card" style={{ overflow:"hidden",boxShadow:"var(--shadow)" }}>
              <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"20px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",overflow:"hidden" }}>
                <button onClick={()=>changeMonth(-1)} disabled={isAnimating}
                  style={{ background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.2)",color:"#fff",width:36,height:36,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",position:"relative",zIndex:1 }}>‹</button>
                <div style={{ textAlign:"center",position:"relative",zIndex:1,minWidth:150,height:46,overflow:"hidden" }}>
                  {!isAnimating && !pendingDate && (
                    <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                      <h2 style={{ color:"#fff",fontSize:22,fontWeight:800,letterSpacing:-0.5,lineHeight:1.1 }}>{MONTHS[month]}</h2>
                      <span style={{ color:"rgba(255,255,255,0.45)",fontSize:11,fontWeight:600,letterSpacing:2 }}>{year}</span>
                    </div>
                  )}
                  {isAnimating && pendingDate && (
                    <>
                      <div className={direction==="next"?"label-exit-next":"label-exit-prev"} style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                        <h2 style={{ color:"#fff",fontSize:22,fontWeight:800 }}>{MONTHS[month]}</h2>
                        <span style={{ color:"rgba(255,255,255,0.45)",fontSize:11,letterSpacing:2 }}>{year}</span>
                      </div>
                      <div className={direction==="next"?"label-enter-next":"label-enter-prev"} style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                        <h2 style={{ color:"#fff",fontSize:22,fontWeight:800 }}>{MONTHS[pendingDate.getMonth()]}</h2>
                        <span style={{ color:"rgba(255,255,255,0.45)",fontSize:11,letterSpacing:2 }}>{pendingDate.getFullYear()}</span>
                      </div>
                    </>
                  )}
                </div>
                <button onClick={()=>changeMonth(1)} disabled={isAnimating}
                  style={{ background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.2)",color:"#fff",width:36,height:36,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",position:"relative",zIndex:1 }}>›</button>
              </div>

              {/* Instruksi range picking */}
              {pickingStep===1 && (
                <div style={{ padding:"8px 16px",background:"rgba(30,96,213,0.08)",borderBottom:"1px solid rgba(30,96,213,0.15)",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                  <span style={{ fontSize:12,color:"var(--blue-1)",fontWeight:700 }}>
                    🗓️ Klik tanggal akhir event <span style={{ opacity:0.7,fontWeight:500 }}>(mulai: {formatDateShort(selectedRange.start)})</span>
                  </span>
                  <button onClick={cancelForm} style={{ fontSize:11,color:"var(--muted)",background:"none",border:"none",cursor:"pointer",fontWeight:600,textDecoration:"underline" }}>Batal</button>
                </div>
              )}

              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"var(--bg2)",borderBottom:"1px solid var(--border)" }}>
                {DAYS.map(d=><div key={d} style={{ textAlign:"center",padding:"10px 0",fontSize:9,fontWeight:700,letterSpacing:1.5,color:"var(--muted)",textTransform:"uppercase" }}>{d}</div>)}
              </div>

              <div className="cal-wrapper">
                {isAnimating&&pendingDate?(
                  <>
                    <div className={direction==="next"?"cal-exit-left":"cal-exit-right"}>
                      <CalendarGrid year={year} month={month} events={events} selectedRange={{start:"",end:""}} onDayClick={()=>{}} today={today.current} pickingEnd={null} rangeStart={null}/>
                    </div>
                    <div className={direction==="next"?"cal-enter-next":"cal-enter-prev"}>
                      <CalendarGrid year={pendingDate.getFullYear()} month={pendingDate.getMonth()} events={events} selectedRange={{start:"",end:""}} onDayClick={()=>{}} today={today.current} pickingEnd={null} rangeStart={null}/>
                    </div>
                  </>
                ):(
                  <CalendarGrid year={year} month={month} events={events} selectedRange={selectedRange} onDayClick={handleDayClick} today={today.current} pickingEnd={hoverDate} rangeStart={pickingStep===1?selectedRange.start:null}/>
                )}
              </div>

              <div style={{ padding:"10px 16px",background:"rgba(232,238,247,0.8)",borderTop:"1px solid var(--border)",display:"flex",gap:16,flexWrap:"wrap",backdropFilter:"blur(4px)" }}>
                {[{color:"#10b981",label:"Weekend"},{color:"#ef4444",label:"Bersyarat"},{color:"#4080f0",label:"Dipesan"}].map(({color,label})=>(
                  <p key={label} style={{ fontSize:10,color:"var(--muted)",display:"flex",alignItems:"center",gap:5,fontWeight:600 }}>
                    <span style={{ display:"inline-block",width:7,height:7,borderRadius:"50%",background:color,boxShadow:`0 0 5px ${color}` }}/>{label}
                  </p>
                ))}
                <p style={{ fontSize:10,color:"var(--blue-1)",fontWeight:700,marginLeft:"auto" }}>
                  {pickingStep===0?"Klik hari untuk mulai pilih tanggal":"Klik hari kedua untuk range multi-hari"}
                </p>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
              {/* Form tambah event */}
              {showForm&&(
                <div className="card slide-right" style={{ padding:24,borderTop:"3px solid var(--blue-2)",boxShadow:"var(--shadow)" }}>
                  <h3 style={{ fontSize:18,fontWeight:800,marginBottom:4,color:"var(--navy)",letterSpacing:-0.5 }}>Tambah Event</h3>
                  <div style={{ marginBottom:14 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(30,96,213,0.06)",borderRadius:10,padding:"8px 12px",border:"1px solid rgba(30,96,213,0.12)" }}>
                      <span style={{ fontSize:13 }}>📅</span>
                      <div>
                        <p style={{ fontSize:12,fontWeight:700,color:"var(--blue-1)",lineHeight:1.2 }}>
                          {selectedRange.start}
                          {selectedRange.end && selectedRange.end !== selectedRange.start && (
                            <span style={{ color:"var(--muted)",fontWeight:500 }}> → {selectedRange.end}</span>
                          )}
                        </p>
                        {selectedRange.end && selectedRange.end !== selectedRange.start && (
                          <p style={{ fontSize:10,color:"var(--muted)",marginTop:1 }}>
                            {Math.round((new Date(selectedRange.end)-new Date(selectedRange.start))/(1000*60*60*24)+1)} hari
                          </p>
                        )}
                      </div>
                    </div>
                    {pickingStep===1 && (
                      <p style={{ fontSize:11,color:"var(--blue-1)",marginTop:6,fontWeight:600 }}>👆 Klik tanggal akhir di kalender untuk set durasi</p>
                    )}
                  </div>

                  {!eventType&&(
                    <div>
                      <label className="label" style={{ marginBottom:12 }}>Pilih Tipe Event</label>
                      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
                        {[{type:"wedding",icon:"💍",label:"Wedding"},{type:"event",icon:"🎉",label:"Event Biasa"}].map(({type,icon,label})=>(
                          <button key={type} type="button" onClick={()=>setEventType(type)}
                            style={{ padding:"18px 10px",border:"2px solid var(--border)",borderRadius:14,background:"rgba(248,250,255,0.8)",cursor:"pointer",textAlign:"center",transition:"all 0.2s" }}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--blue-2)";e.currentTarget.style.background="#eef4ff";e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(30,96,213,0.15)";}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.background="rgba(248,250,255,0.8)";e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}
                          >
                            <div style={{ fontSize:26,marginBottom:8 }}>{icon}</div>
                            <div style={{ fontSize:13,fontWeight:700,color:"var(--dark)" }}>{label}</div>
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={cancelForm} className="btn btn-outline" style={{ width:"100%",marginTop:12 }}>Batal</button>
                    </div>
                  )}

                  {eventType&&(
                    <>
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:14 }}>
                        <span style={{ background:eventType==="wedding"?"rgba(30,96,213,0.1)":"rgba(5,150,105,0.1)",color:eventType==="wedding"?"var(--blue-1)":"#059669",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20 }}>
                          {eventType==="wedding"?"💍 Wedding":"🎉 Event Biasa"}
                        </span>
                        <button type="button" onClick={()=>setEventType("")} style={{ fontSize:11,color:"var(--muted)",background:"none",border:"none",cursor:"pointer",textDecoration:"underline",fontWeight:600 }}>Ganti</button>
                      </div>
                      {formError&&<div style={{ background:"rgba(255,245,245,0.9)",color:"#dc2626",padding:"8px 12px",fontSize:12,borderRadius:10,marginBottom:14,border:"1px solid #fecaca",fontWeight:500 }}>⚠️ {formError}</div>}
                      <form onSubmit={handleAddEvent}>
                        <div style={{ marginBottom:14 }}>
                          <label className="label">{eventType==="wedding"?"Nama Pasangan *":"Nama Event *"}</label>
                          <input value={form.couple} onChange={e=>setForm({...form,couple:e.target.value})} placeholder={eventType==="wedding"?"Budi & Siti":"Nama event..."} className="input"/>
                        </div>
                        {[{label:"Venue / Lokasi",key:"venue",placeholder:"Grand Ballroom"},{label:"Jam Acara",key:"time",placeholder:"10:00 WIB"},{label:"Catatan",key:"notes",placeholder:"Info tambahan..."},{label:"Add On",key:"addon",placeholder:"Dekorasi, Catering, dll..."}].map(({label,key,placeholder})=>(
                          <div key={key} style={{ marginBottom:14 }}>
                            <label className="label">{label}</label>
                            <input value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder} className="input"/>
                          </div>
                        ))}
                        <div style={{ marginBottom:14 }}>
                          <label className="label" style={{ display:"flex",alignItems:"center",gap:6 }}>
                            <span>👥 Maks. Slot Staff</span>
                            <span style={{ fontSize:10,color:"var(--muted)",fontWeight:500,background:"rgba(30,96,213,0.08)",padding:"2px 8px",borderRadius:20 }}>opsional</span>
                          </label>
                          <div style={{ position:"relative" }}>
                            <input type="number" min="1" max="99" value={form.max_staff}
                              onChange={e=>setForm({...form,max_staff:e.target.value})}
                              placeholder="Kosongkan = tidak dibatasi" className="input" style={{ paddingRight:80 }}/>
                            {form.max_staff&&<span style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"var(--blue-1)",fontWeight:700,pointerEvents:"none" }}>orang</span>}
                          </div>
                          {form.max_staff&&<p style={{ fontSize:11,color:"var(--muted)",marginTop:4,fontWeight:500 }}>💡 Staff hanya bisa daftar hingga <strong>{form.max_staff} orang</strong>. Slot penuh = pendaftaran otomatis ditutup.</p>}
                        </div>
                        <div style={{ display:"flex",gap:10,marginTop:10 }}>
                          <button type="submit" className="btn btn-primary" style={{ flex:1 }}>Simpan</button>
                          <button type="button" onClick={cancelForm} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}

              {/* Event list dengan search + tab */}
              <div className="card" style={{ overflow:"hidden",boxShadow:"var(--shadow-sm)" }}>
                <div style={{ padding:"16px 20px",borderBottom:"1px solid var(--border)",background:"rgba(232,238,247,0.8)",backdropFilter:"blur(4px)" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                    <h3 style={{ fontSize:16,fontWeight:800,color:"var(--navy)",letterSpacing:-0.5 }}>Kelola Event</h3>
                    <span style={{ background:"linear-gradient(135deg,var(--blue-2),var(--blue-1))",color:"#fff",fontSize:12,fontWeight:700,padding:"3px 12px",borderRadius:20 }}>{events.length} total</span>
                  </div>

                  {/* Tab */}
                  <div style={{ display:"flex",gap:6,background:"rgba(255,255,255,0.7)",border:"1.5px solid var(--border)",borderRadius:12,padding:4,marginBottom:10 }}>
                    {[{key:"upcoming",label:"Mendatang",count:upcomingEvents.length},{key:"past",label:"Sudah Lewat",count:pastEvents.length}].map(({key,label,count})=>(
                      <button key={key} onClick={()=>setEventTab(key)}
                        style={{ flex:1,padding:"6px 10px",borderRadius:9,fontWeight:700,fontSize:11,cursor:"pointer",border:"none",transition:"all 0.15s",
                          background:eventTab===key?"linear-gradient(135deg,var(--blue-3),var(--blue-1))":"transparent",
                          color:eventTab===key?"#fff":"var(--muted)",
                          boxShadow:eventTab===key?"0 2px 8px rgba(30,96,213,0.2)":"none" }}>
                        {label} <span style={{ background:eventTab===key?"rgba(255,255,255,0.25)":"rgba(30,96,213,0.1)",color:eventTab===key?"#fff":"var(--blue-1)",borderRadius:99,padding:"1px 6px",fontSize:10,marginLeft:4,fontWeight:800 }}>{count}</span>
                      </button>
                    ))}
                  </div>

                  {/* Search */}
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,pointerEvents:"none",color:"var(--muted)" }}>🔍</span>
                    <input value={eventSearch} onChange={e=>setEventSearch(e.target.value)}
                      placeholder="Cari nama, venue, tipe event…"
                      style={{ width:"100%",paddingLeft:32,paddingRight:eventSearch?32:12,paddingTop:8,paddingBottom:8,border:"1.5px solid var(--border)",borderRadius:10,fontSize:12,fontWeight:500,background:"rgba(255,255,255,0.9)",outline:"none",color:"var(--dark)",boxSizing:"border-box",transition:"border-color 0.15s" }}
                      onFocus={e=>{e.target.style.borderColor="var(--blue-2)";}}
                      onBlur={e=>{e.target.style.borderColor="var(--border)";}}
                    />
                    {eventSearch&&(
                      <button onClick={()=>setEventSearch("")}
                        style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.08)",border:"none",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,color:"var(--muted)" }}>✕</button>
                    )}
                  </div>
                  {q&&<p style={{ fontSize:11,color:"var(--muted)",marginTop:6,fontWeight:600 }}>{filteredEvents.length===0?"Tidak ditemukan":`${filteredEvents.length} hasil`}</p>}
                </div>

                <div style={{ maxHeight:500,overflowY:"auto" }}>
                  {filteredEvents.length===0&&(
                    <div style={{ padding:"32px",textAlign:"center" }}>
                      <p style={{ fontSize:28,marginBottom:8 }}>{q?"🔍":"📅"}</p>
                      <p style={{ fontSize:13,color:"var(--muted)",fontWeight:500 }}>
                        {q?`Tidak ada hasil untuk "${eventSearch}"`:`Tidak ada event ${eventTab==="upcoming"?"mendatang":"yang sudah lewat"}`}
                      </p>
                      {q&&<button onClick={()=>setEventSearch("")} style={{ marginTop:10,fontSize:12,padding:"6px 16px",borderRadius:10,border:"1.5px solid var(--border)",background:"#fff",cursor:"pointer",fontWeight:600,color:"var(--blue-1)" }}>Hapus pencarian</button>}
                    </div>
                  )}
                  {[...filteredEvents].sort((a,b)=>eventTab==="past"?b.date.localeCompare(a.date):a.date.localeCompare(b.date)).map(event=>{
                    const isMultiDay = event.date_end && event.date_end !== event.date;
                    return (
                      <div key={event.id} style={{ padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,transition:"background 0.15s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(238,244,255,0.5)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:"flex",gap:6,marginBottom:4,flexWrap:"wrap" }}>
                            <span style={{ fontSize:10,background:event.event_type==="wedding"?"rgba(30,96,213,0.1)":"rgba(5,150,105,0.1)",color:event.event_type==="wedding"?"var(--blue-1)":"#059669",padding:"2px 8px",borderRadius:10,fontWeight:700 }}>
                              {event.event_type==="wedding"?"💍 Wedding":"🎉 Event"}
                            </span>
                            {isMultiDay&&<span style={{ fontSize:10,background:"rgba(124,58,237,0.1)",color:"#7c3aed",padding:"2px 8px",borderRadius:10,fontWeight:700 }}>📆 Multi-hari</span>}
                          </div>
                          <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"var(--dark)",marginBottom:2 }}>{event.couple}</p>
                          <p style={{ fontSize:11,color:"var(--blue-2)",fontWeight:700,marginBottom:2 }}>
                            {formatDateShort(event.date)}{isMultiDay?` → ${formatDateShort(event.date_end)}`:""}
                          </p>
                          {event.venue&&<p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>📍 {event.venue}</p>}
                          {event.time&&<p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>🕐 {event.time}</p>}
                          {event.addon&&<p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>✨ {event.addon}</p>}
                          {event.max_staff&&<p style={{ fontSize:11,fontWeight:700,marginTop:2,color:"var(--blue-1)" }}>👥 Maks. {event.max_staff} staff</p>}
                        </div>
                        <button onClick={()=>handleDelete(event.id)} className="btn btn-danger" style={{ flexShrink:0,fontSize:11,padding:"6px 12px" }}>Hapus</button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
        <footer style={{ textAlign:"center",padding:"24px 0 16px",color:"var(--muted)",fontSize:11,opacity:0.4,position:"relative",zIndex:1 }}>Created by GG</footer>
      </div>
    </>
  );
}
