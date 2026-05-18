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
      <div className="float-shape-2" style={{ position:"fixed",bottom:130,left:44,zIndex:0,pointerEvents:"none",opacity:0.07,animationDelay:"1.5s" }}>
        <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
          <circle cx="75" cy="75" r="68" stroke="#1535a0" strokeWidth="1.2" strokeDasharray="10 8" className="ring-spin-rev"/>
          <circle cx="75" cy="75" r="48" stroke="#4080f0" strokeWidth="0.8" strokeDasharray="6 10" className="ring-spin"/>
          <circle cx="75" cy="75" r="28" stroke="#1e60d5" strokeWidth="0.6" strokeDasharray="3 9" className="ring-spin-rev"/>
        </svg>
      </div>
      <div className="float-shape-3" style={{ position:"fixed",top:"44%",left:24,zIndex:0,pointerEvents:"none",opacity:0.07,animationDelay:"0.8s" }}>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <polygon points="36,4 70,66 2,66" stroke="#4080f0" strokeWidth="1.3" fill="none" strokeDasharray="6 5" className="dash-anim"/>
        </svg>
      </div>
      <div className="float-shape-1" style={{ position:"fixed",top:"36%",right:30,zIndex:0,pointerEvents:"none",opacity:0.07,animationDelay:"3s" }}>
        <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
          <rect x="8" y="8" width="52" height="52" rx="4" stroke="#1e60d5" strokeWidth="1.2" transform="rotate(45 34 34)" fill="none" strokeDasharray="5 6" className="dash-anim-slow"/>
        </svg>
      </div>
      <div className="float-shape-2" style={{ position:"fixed",bottom:200,right:36,zIndex:0,pointerEvents:"none",opacity:0.07,animationDelay:"2s" }}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
          <polygon points="40,4 74,22 74,58 40,76 6,58 6,22" stroke="#1e60d5" strokeWidth="1.2" fill="none" strokeDasharray="7 6" className="dash-anim"/>
        </svg>
      </div>
      {[{x:"12%",y:"22%"},{x:"85%",y:"15%"},{x:"72%",y:"58%"},{x:"6%",y:"70%"},{x:"92%",y:"78%"},{x:"48%",y:"90%"}].map(({x,y},i)=>(
        <div key={i} className={["dot-twinkle","dot-twinkle-2","dot-twinkle-3"][i%3]} style={{ position:"fixed",left:x,top:y,width:4,height:4,borderRadius:"50%",background:"#1e60d5",zIndex:0,pointerEvents:"none" }}/>
      ))}
      <div style={{ position:"fixed",top:0,left:0,zIndex:0,pointerEvents:"none",opacity:0.1 }}>
        <svg width="180" height="180"><path d="M0 90 L90 0" stroke="#1e60d5" strokeWidth="1"/><path d="M0 150 L150 0" stroke="#1e60d5" strokeWidth="0.4"/><path d="M0 40 L40 0" stroke="#1e60d5" strokeWidth="0.5"/></svg>
      </div>
      <div style={{ position:"fixed",bottom:0,right:0,zIndex:0,pointerEvents:"none",opacity:0.1,transform:"rotate(180deg)" }}>
        <svg width="180" height="180"><path d="M0 90 L90 0" stroke="#1e60d5" strokeWidth="1"/><path d="M0 150 L150 0" stroke="#1e60d5" strokeWidth="0.4"/></svg>
      </div>
    </>
  );
}

function CalendarGrid({ year, month, events, selectedDate, onDayClick, today }) {
  const firstDay = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const startOffset = firstDay===0?6:firstDay-1;
  function getDayStatus(day) {
    const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    // cek apakah tanggal ini masuk dalam range event multi-hari
    const event=events.find(e=>{
      if(e.date===dateStr) return true;
      if(e.date_end && e.date_end!==e.date && dateStr>e.date && dateStr<=e.date_end) return true;
      return false;
    });
    if(event) return{status:"booked",event,isRange:event.date!==dateStr};
    if(new Date(dateStr)<today) return{status:"past"};
    if(isWeekend(dateStr)) return{status:"available"};
    return{status:"conditional"};
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
        const{day}=cell;
        const dateStr=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
        const{status,event}=getDayStatus(day);
        const isSelected=selectedDate===dateStr;
        const isToday=new Date(dateStr).toDateString()===today.toDateString();
        const s={booked:{bg:"rgba(238,244,255,0.9)",dot:"#4080f0"},conditional:{bg:"rgba(255,245,245,0.9)",dot:"#ef4444"},past:{bg:"rgba(250,250,250,0.5)",dot:"#ddd"},available:{bg:"rgba(240,253,248,0.9)",dot:"#10b981"}}[status];
        return(
          <div key={day} className="day-cell" onClick={()=>onDayClick(dateStr,status)}
            style={{ minHeight:64,background:isSelected?"rgba(219,238,255,0.95)":s.bg,padding:"8px 8px 6px",borderRight:"1px solid var(--border)",borderBottom:"1px solid var(--border)",cursor:status!=="past"?"pointer":"default",display:"flex",flexDirection:"column",outline:isSelected?"2px solid var(--blue-2)":"none",outlineOffset:-2 }}
          >
            <div style={{ width:24,height:24,borderRadius:7,background:isToday?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <span style={{ fontSize:12,fontWeight:isToday?800:500,color:isToday?"#fff":status==="past"?"#ccc":"var(--dark)" }}>{day}</span>
            </div>
            <div style={{ marginTop:"auto",minWidth:0 }}>
              <div style={{ width:6,height:6,borderRadius:"50%",background:s.dot,boxShadow:status==="available"?"0 0 7px rgba(16,185,129,0.6)":status==="booked"?"0 0 7px rgba(64,128,240,0.6)":"none" }}/>
              {status==="booked"&&event&&(
                <div style={{ fontSize:8,color:"var(--blue-1)",marginTop:2,fontWeight:700,lineHeight:1.3,
                  display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",
                  overflow:"hidden",wordBreak:"break-word",
                  opacity: getDayStatus(day).isRange ? 0.65 : 1,
                }}>
                  {getDayStatus(day).isRange ? "↳" : (event.event_type==="wedding"?"💍":"🎉")} {event.couple}
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
  const [labelKey,setLabelKey]=useState(0);
  const [showForm,setShowForm]=useState(false);
  const [selectedDate,setSelectedDate]=useState("");
  const [eventType,setEventType]=useState("");
  const [form,setForm]=useState({couple:"",venue:"",time:"",notes:"",addon:"",date_end:"",max_staff:""});
  const [formError,setFormError]=useState("");
  const [success,setSuccess]=useState("");
  const [mounted,setMounted]=useState(false);
  const [searchQuery,setSearchQuery]=useState("");
  const [eventTab,setEventTab]=useState("upcoming"); // "upcoming"|"past"
  const today=useRef(new Date()); today.current.setHours(0,0,0,0);
  const {businessName}=CALENDAR_CONFIG;

  const fetchEvents=useCallback(async()=>{ const res=await fetch("/api/events"); const data=await res.json(); if(Array.isArray(data)) setEvents(data); },[]);

  useEffect(()=>{ setMounted(true); if(sessionStorage.getItem("admin_auth")==="true"){setIsLoggedIn(true);fetchEvents();} },[fetchEvents]);

  function changeMonth(dir) {
    if(isAnimating) return;
    const next=new Date(displayDate.getFullYear(),displayDate.getMonth()+dir,1);
    setDirection(dir===1?"next":"prev"); setPendingDate(next); setIsAnimating(true); setLabelKey(k=>k+1);
    setTimeout(()=>{ setDisplayDate(next); setPendingDate(null); setDirection(null); setIsAnimating(false); },420);
  }

  async function handleLogin(e) {
    e.preventDefault(); setLoginError("");
    const res=await fetch("/api/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});
    const data=await res.json();
    if(data.success){sessionStorage.setItem("admin_auth","true");setIsLoggedIn(true);fetchEvents();}
    else setLoginError(data.message);
  }

  async function handleAddEvent(e) {
    e.preventDefault(); setFormError("");
    if(!form.couple.trim()) return setFormError(eventType==="wedding"?"Nama pasangan wajib diisi":"Nama event wajib diisi");
    const dateEnd = form.date_end && form.date_end > selectedDate ? form.date_end : selectedDate;
    const res=await fetch("/api/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,date:selectedDate,date_end:dateEnd,event_type:eventType})});
    const data=await res.json();
    if(data.error) return setFormError(data.error);
    setEvents(prev=>[...prev,data]); setForm({couple:"",venue:"",time:"",notes:"",addon:"",date_end:"",max_staff:""}); setEventType(""); setShowForm(false);
    setSuccess("Event berhasil ditambahkan!"); setTimeout(()=>setSuccess(""),3500);
  }

  async function handleDelete(id) {
    if(!confirm("Hapus event ini?")) return;
    const res=await fetch(`/api/events?id=${id}`,{method:"DELETE"});
    if(res.ok) setEvents(prev=>prev.filter(e=>e.id!==id));
  }

  function handleDayClick(dateStr,status) {
    if(status==="past") return;
    setSelectedDate(dateStr); setEventType(""); setForm({couple:"",venue:"",time:"",notes:"",addon:""}); setFormError(""); setShowForm(true);
  }

  function logout(){sessionStorage.removeItem("admin_auth");setIsLoggedIn(false);}

  const year=displayDate.getFullYear(); const month=displayDate.getMonth();

  if(!isLoggedIn) return(
    <>
      <Head><title>Admin Login — {businessName}</title><link rel="icon" href="/favicon.ico"/></Head>
      <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",top:-120,right:-80,width:500,height:500,borderRadius:"50%",background:"rgba(64,128,240,0.15)",filter:"blur(70px)",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",bottom:-100,left:-60,width:400,height:400,borderRadius:"50%",background:"rgba(21,53,160,0.2)",filter:"blur(60px)",pointerEvents:"none" }}/>
        <div className="ring-spin" style={{ position:"absolute",top:"8%",left:"4%",width:280,height:280,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.05)",pointerEvents:"none",transformOrigin:"center" }}/>
        <div className="ring-spin-rev" style={{ position:"absolute",bottom:"10%",right:"5%",width:220,height:220,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.06)",pointerEvents:"none",transformOrigin:"center" }}/>
        {[{x:"18%",y:"20%"},{x:"80%",y:"30%"},{x:"12%",y:"75%"},{x:"85%",y:"70%"}].map(({x,y},i)=>(
          <div key={i} className={["dot-twinkle","dot-twinkle-2","dot-twinkle-3"][i%3]} style={{ position:"absolute",left:x,top:y,width:4,height:4,borderRadius:"50%",background:"rgba(255,255,255,0.4)",pointerEvents:"none" }}/>
        ))}
        <div className={mounted?"scale-in":""} style={{ background:"rgba(255,255,255,0.97)",width:"100%",maxWidth:420,borderRadius:24,overflow:"hidden",boxShadow:"0 32px 80px rgba(10,22,40,0.5)",position:"relative",zIndex:1 }}>
          <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"40px 40px 32px",textAlign:"center",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none" }}/>
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

  const thisMonthEvents=events.filter(e=>{const d=new Date(e.date);return d.getMonth()===month&&d.getFullYear()===year;});

  return(
    <>
      <Head><title>Admin Dashboard — {businessName}</title><link rel="icon" href="/favicon.ico"/></Head>
      <div style={{ minHeight:"100vh",position:"relative",overflow:"hidden" }}>
        <BgDecor/>
        <header style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",padding:"0 40px",height:68,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 32px rgba(10,22,40,0.4)",position:"sticky",top:0,zIndex:100 }}>
          <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none" }}/>
          {/* Logo decoration in header */}
          <div style={{ position:"absolute",right:120,top:"50%",transform:"translateY(-50%)",width:80,height:80,opacity:0.06,pointerEvents:"none" }}>
            <img src="/logo.png" alt="" style={{ width:"100%",height:"100%",objectFit:"contain",filter:"brightness(0) invert(1)" }}/>
          </div>
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

          <div style={{ display:"grid",gridTemplateColumns:"1fr 380px",gap:24,alignItems:"start" }}>
            {/* Calendar */}
            <div className="card" style={{ overflow:"hidden",boxShadow:"var(--shadow)" }}>
              <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"20px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",overflow:"hidden" }}>
                <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none" }}/>
                <button onClick={()=>changeMonth(-1)} disabled={isAnimating}
                  style={{ background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.2)",color:"#fff",width:36,height:36,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",position:"relative",zIndex:1 }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.22)";e.currentTarget.style.transform="scale(1.12)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.transform="scale(1)";}}
                >‹</button>

                {/* smooth label horizontal overlay */}
                <div style={{ textAlign:"center",position:"relative",zIndex:1,minWidth:150,height:46,overflow:"hidden" }}>
                  {isAnimating && (
                    <div className={direction==="next"?"label-exit-next":"label-exit-prev"}
                      style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                      <h2 style={{ color:"#fff",fontSize:22,fontWeight:800,letterSpacing:-0.5,lineHeight:1.1 }}>{MONTHS[month]}</h2>
                      <span style={{ color:"rgba(255,255,255,0.45)",fontSize:11,fontWeight:600,letterSpacing:2 }}>{year}</span>
                    </div>
                  )}
                  {pendingDate && (
                    <div className={direction==="next"?"label-enter-next":"label-enter-prev"}
                      style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                      <h2 style={{ color:"#fff",fontSize:22,fontWeight:800,letterSpacing:-0.5,lineHeight:1.1 }}>{MONTHS[pendingDate.getMonth()]}</h2>
                      <span style={{ color:"rgba(255,255,255,0.45)",fontSize:11,fontWeight:600,letterSpacing:2 }}>{pendingDate.getFullYear()}</span>
                    </div>
                  )}
                  {!isAnimating && !pendingDate && (
                    <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
                      <h2 style={{ color:"#fff",fontSize:22,fontWeight:800,letterSpacing:-0.5,lineHeight:1.1 }}>{MONTHS[month]}</h2>
                      <span style={{ color:"rgba(255,255,255,0.45)",fontSize:11,fontWeight:600,letterSpacing:2 }}>{year}</span>
                    </div>
                  )}
                </div>

                <button onClick={()=>changeMonth(1)} disabled={isAnimating}
                  style={{ background:"rgba(255,255,255,0.1)",border:"1.5px solid rgba(255,255,255,0.2)",color:"#fff",width:36,height:36,borderRadius:10,fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",position:"relative",zIndex:1 }}
                  onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.22)";e.currentTarget.style.transform="scale(1.12)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.1)";e.currentTarget.style.transform="scale(1)";}}
                >›</button>
              </div>

              <div style={{ display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"var(--bg2)",borderBottom:"1px solid var(--border)" }}>
                {DAYS.map(d=><div key={d} style={{ textAlign:"center",padding:"10px 0",fontSize:9,fontWeight:700,letterSpacing:1.5,color:"var(--muted)",textTransform:"uppercase" }}>{d}</div>)}
              </div>

              {/* overlay grid transition */}
              <div className="cal-wrapper">
                {isAnimating&&pendingDate&&(
                  <div className={direction==="next"?"cal-exit-left":"cal-exit-right"}>
                    <CalendarGrid year={year} month={month} events={events} selectedDate={null} onDayClick={()=>{}} today={today.current}/>
                  </div>
                )}
                {pendingDate?(
                  <div className={direction==="next"?"cal-enter-next":"cal-enter-prev"}>
                    <CalendarGrid year={pendingDate.getFullYear()} month={pendingDate.getMonth()} events={events} selectedDate={null} onDayClick={()=>{}} today={today.current}/>
                  </div>
                ):(
                  <CalendarGrid year={year} month={month} events={events} selectedDate={selectedDate} onDayClick={handleDayClick} today={today.current}/>
                )}
              </div>

              <div style={{ padding:"10px 16px",background:"rgba(232,238,247,0.8)",borderTop:"1px solid var(--border)",display:"flex",gap:16,flexWrap:"wrap",backdropFilter:"blur(4px)" }}>
                {[{color:"#10b981",label:"Weekend"},{color:"#ef4444",label:"Bersyarat"},{color:"#4080f0",label:"Dipesan"}].map(({color,label})=>(
                  <p key={label} style={{ fontSize:10,color:"var(--muted)",display:"flex",alignItems:"center",gap:5,fontWeight:600 }}>
                    <span style={{ display:"inline-block",width:7,height:7,borderRadius:"50%",background:color,boxShadow:`0 0 5px ${color}` }}/>{label}
                  </p>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display:"flex",flexDirection:"column",gap:20 }}>
              {showForm&&(
                <div className="card slide-right" style={{ padding:24,borderTop:"3px solid var(--blue-2)",boxShadow:"var(--shadow)" }}>
                  <h3 style={{ fontSize:18,fontWeight:800,marginBottom:4,color:"var(--navy)",letterSpacing:-0.5 }}>Tambah Event</h3>
                  <p style={{ fontSize:12,color:"var(--muted)",marginBottom:16,fontWeight:500 }}>
                    📅 {selectedDate}
                    {!isWeekend(selectedDate)&&<span style={{ marginLeft:8,background:"rgba(239,68,68,0.1)",color:"#ef4444",fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:700 }}>⚠️ Bersyarat</span>}
                  </p>
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
                      <button type="button" onClick={()=>setShowForm(false)} className="btn btn-outline" style={{ width:"100%",marginTop:12 }}>Batal</button>
                    </div>
                  )}
                  {eventType&&(
                    <>
                      <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:16 }}>
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
                        {/* Multi-day end date */}
                        <div style={{ marginBottom:14 }}>
                          <label className="label">Tanggal Selesai <span style={{ color:"var(--muted)",fontWeight:400,textTransform:"none" }}>(opsional, untuk event multi-hari)</span></label>
                          <input type="date" value={form.date_end} min={selectedDate}
                            onChange={e=>setForm({...form,date_end:e.target.value})} className="input"/>
                          {form.date_end && form.date_end > selectedDate && (
                            <p style={{ fontSize:11,color:"var(--blue-2)",fontWeight:600,marginTop:4 }}>
                              📅 Event berlangsung {Math.round((new Date(form.date_end)-new Date(selectedDate))/(1000*60*60*24)+1)} hari
                            </p>
                          )}
                        </div>
                        {/* Max staff */}
                        <div style={{ marginBottom:14 }}>
                          <label className="label">Maks. Staff <span style={{ color:"var(--muted)",fontWeight:400,textTransform:"none" }}>(opsional, kosongkan = tidak terbatas)</span></label>
                          <input type="number" min="1" value={form.max_staff}
                            onChange={e=>setForm({...form,max_staff:e.target.value})}
                            placeholder="cth: 5" className="input"/>
                        </div>
                        <div style={{ display:"flex",gap:10,marginTop:10 }}>
                          <button type="submit" className="btn btn-primary" style={{ flex:1 }}>Simpan</button>
                          <button type="button" onClick={()=>{setShowForm(false);setEventType("");}} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              )}

              <div className="card" style={{ overflow:"hidden",boxShadow:"var(--shadow-sm)" }}>
                {/* Header */}
                <div style={{ padding:"14px 16px",borderBottom:"1px solid var(--border)",background:"rgba(232,238,247,0.8)",backdropFilter:"blur(4px)" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                    <h3 style={{ fontSize:16,fontWeight:800,color:"var(--navy)",letterSpacing:-0.5 }}>Daftar Event</h3>
                    <span style={{ background:"linear-gradient(135deg,var(--blue-2),var(--blue-1))",color:"#fff",fontSize:12,fontWeight:700,padding:"3px 12px",borderRadius:20 }}>{events.length}</span>
                  </div>
                  {/* Search */}
                  <input
                    value={searchQuery}
                    onChange={e=>setSearchQuery(e.target.value)}
                    placeholder="🔍 Cari nama, venue..."
                    className="input"
                    style={{ fontSize:12,padding:"7px 12px",marginBottom:10 }}
                  />
                  {/* Tabs */}
                  <div style={{ display:"flex",gap:6 }}>
                    {[{key:"upcoming",label:"Mendatang"},{key:"past",label:"Lewat"}].map(({key,label})=>(
                      <button key={key} onClick={()=>setEventTab(key)}
                        style={{ flex:1,padding:"5px 0",borderRadius:8,border:"1.5px solid",fontSize:11,fontWeight:700,cursor:"pointer",transition:"all 0.15s",
                          borderColor:eventTab===key?"var(--blue-2)":"var(--border)",
                          background:eventTab===key?"linear-gradient(135deg,var(--blue-3),var(--blue-1))":"transparent",
                          color:eventTab===key?"#fff":"var(--muted)",
                        }}>{label}</button>
                    ))}
                  </div>
                </div>
                {/* List */}
                <div style={{ maxHeight:420,overflowY:"auto" }}>
                  {(()=>{
                    const todayStr = today.current.toISOString().split("T")[0];
                    const filtered = [...events]
                      .filter(ev => eventTab==="upcoming" ? ev.date >= todayStr : ev.date < todayStr)
                      .filter(ev => !searchQuery || ev.couple?.toLowerCase().includes(searchQuery.toLowerCase()) || ev.venue?.toLowerCase().includes(searchQuery.toLowerCase()))
                      .sort((a,b) => eventTab==="upcoming" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
                    if(filtered.length===0) return(
                      <div style={{ padding:"28px",textAlign:"center" }}>
                        <p style={{ fontSize:24,marginBottom:6 }}>{searchQuery?"🔍":"📅"}</p>
                        <p style={{ fontSize:12,color:"var(--muted)",fontWeight:500 }}>{searchQuery?"Tidak ditemukan":"Belum ada event"}</p>
                      </div>
                    );
                    return filtered.map(event=>(
                      <div key={event.id} style={{ padding:"12px 16px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,transition:"background 0.15s" }}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(238,244,255,0.5)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                      >
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:"flex",gap:5,marginBottom:3,flexWrap:"wrap" }}>
                            <span style={{ fontSize:10,background:event.event_type==="wedding"?"rgba(30,96,213,0.1)":"rgba(5,150,105,0.1)",color:event.event_type==="wedding"?"var(--blue-1)":"#059669",padding:"1px 7px",borderRadius:10,fontWeight:700 }}>
                              {event.event_type==="wedding"?"💍 Wedding":"🎉 Event"}
                            </span>
                            {event.date_end && event.date_end !== event.date && (
                              <span style={{ fontSize:10,background:"rgba(245,158,11,0.1)",color:"#92400e",padding:"1px 7px",borderRadius:10,fontWeight:700 }}>
                                🗓 Multi-hari
                              </span>
                            )}
                          </div>
                          <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"var(--dark)",marginBottom:1 }}>{event.couple}</p>
                          <p style={{ fontSize:11,color:"var(--blue-2)",fontWeight:700,marginBottom:1 }}>
                            {event.date}{event.date_end && event.date_end !== event.date ? ` → ${event.date_end}` : ""}
                          </p>
                          {event.venue&&<p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>📍 {event.venue}</p>}
                          {event.time&&<p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>🕐 {event.time}</p>}
                          {event.addon&&<p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>✨ {event.addon}</p>}
                          {event.max_staff&&<p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>👥 Maks. {event.max_staff} staff</p>}
                        </div>
                        <button onClick={()=>handleDelete(event.id)} className="btn btn-danger" style={{ flexShrink:0 }}>Hapus</button>
                      </div>
                    ));
                  })()}
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
