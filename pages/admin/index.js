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

  function toDateStr(day) {
    return `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  }
  function getDayInfo(day) {
    const dateStr = toDateStr(day);
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
        const isMultiDay = event && event.date_end && event.date_end !== event.date;

        const inSelectedRange = selectedRange.start && selectedRange.end &&
          dateStr >= selectedRange.start && dateStr <= selectedRange.end;
        const isRangeStart = dateStr === selectedRange.start;
        const isRangeEnd   = dateStr === selectedRange.end;
        const isSelected   = isRangeStart || isRangeEnd;
        const inPreview    = pickingEnd && rangeStart && dateStr >= rangeStart && dateStr <= pickingEnd;

        const s={
          booked:{bg:"rgba(238,244,255,0.9)",dot:"#4080f0"},
          conditional:{bg:"rgba(255,245,245,0.9)",dot:"#ef4444"},
          past:{bg:"rgba(250,250,250,0.5)",dot:"#ddd"},
          available:{bg:"rgba(240,253,248,0.9)",dot:"#10b981"}
        }[status];

        let bg = s.bg;
        if (inPreview)       bg = "rgba(200,225,255,0.7)";
        if (inSelectedRange) bg = "rgba(208,228,255,0.85)";
        if (isSelected)      bg = "rgba(200,222,255,0.98)";

        return(
          <div key={day} className="day-cell" onClick={()=>onDayClick(dateStr,status)}
            style={{ minHeight:64,background:bg,padding:"7px 6px 5px",
              borderRight:"1px solid var(--border)",borderBottom:"1px solid var(--border)",
              cursor:status!=="past"?"pointer":"default",display:"flex",flexDirection:"column",
              outline:isSelected?"2px solid var(--blue-2)":"none",outlineOffset:-2,
              position:"relative",
            }}
          >
            <div style={{ width:24,height:24,borderRadius:7,
              background:isToday?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":isSelected?"var(--blue-2)":"transparent",
              display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,position:"relative",zIndex:3 }}>
              <span style={{ fontSize:12,fontWeight:isToday||isSelected?800:500,
                color:isToday||isSelected?"#fff":status==="past"?"#ccc":"var(--dark)" }}>{day}</span>
            </div>

            <div style={{ marginTop:"auto",minWidth:0 }}>
              <div style={{ width:6,height:6,borderRadius:"50%",background:s.dot,
                boxShadow:status==="available"?"0 0 7px rgba(16,185,129,0.6)":status==="booked"?"0 0 7px rgba(64,128,240,0.6)":"none" }}/>
              {status==="booked"&&event&&(
                <div style={{ fontSize:8,color:"var(--blue-1)",marginTop:2,fontWeight:700,lineHeight:1.3,
                  display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",wordBreak:"break-word" }}>
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

export default function AdminPanel() {
  const [isLoggedIn,setIsLoggedIn]=useState(false);
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [loginError,setLoginError]=useState("");
  const [events,setEvents]=useState([]);

  // Staff Users Management
  const [staffUsers, setStaffUsers] = useState([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffUserForm, setStaffUserForm] = useState({ name:"", username:"", password:"", jabatan:"", posisi:"", discord_id:"" });
  const [staffUserError, setStaffUserError] = useState("");
  const [staffUserSuccess, setStaffUserSuccess] = useState("");
  const [editingStaffUser, setEditingStaffUser] = useState(null);
  const [editStaffUserForm, setEditStaffUserForm] = useState({ name:"", username:"", password:"", jabatan:"", posisi:"", discord_id:"", is_active:true });
  const [editStaffUserError, setEditStaffUserError] = useState("");
  const [staffUserSearch, setStaffUserSearch] = useState("");
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

  // Edit event
  const [editingEvent, setEditingEvent] = useState(null);
  const [editForm, setEditForm] = useState({couple:"",venue:"",time:"",notes:"",addon:"",max_staff:"",date:"",date_end:"",event_type:""});
  const [editError, setEditError] = useState("");

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

  const fetchStaffUsers = useCallback(async () => {
    const res = await fetch("/api/staff-users");
    const data = await res.json();
    if (Array.isArray(data)) setStaffUsers(data);
  }, []);

  useEffect(()=>{ setMounted(true); if(sessionStorage.getItem("admin_auth")==="true"){setIsLoggedIn(true);fetchEvents();fetchStaffUsers();} },[fetchEvents, fetchStaffUsers]);

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
    if(data.success){sessionStorage.setItem("admin_auth","true");setIsLoggedIn(true);fetchEvents();fetchStaffUsers();}
    else setLoginError(data.message);
  }

  function handleEdit(event) {
    setEditingEvent(event);
    setEditForm({
      couple: event.couple || "",
      venue: event.venue || "",
      time: event.time || "",
      notes: event.notes || "",
      addon: event.addon || "",
      max_staff: event.max_staff || "",
      date: event.date || "",
      date_end: event.date_end || event.date || "",
      event_type: event.event_type || "",
    });
    setEditError("");
  }

  async function handleSaveEdit(e) {
    e.preventDefault(); setEditError("");
    if (!editForm.couple.trim()) return setEditError("Nama wajib diisi");
    if (editForm.date_end < editForm.date) return setEditError("Tanggal akhir tidak boleh sebelum tanggal mulai");

    // Cek overlap dengan event lain (kecuali diri sendiri)
    const overlap = events.find(ev => {
      if (ev.id === editingEvent.id) return false;
      const evStart = ev.date; const evEnd = ev.date_end || ev.date;
      return editForm.date <= evEnd && (editForm.date_end||editForm.date) >= evStart;
    });
    if (overlap) return setEditError(`Tanggal bentrok dengan: ${overlap.couple}`);

    const res = await fetch(`/api/events?id=${editingEvent.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        max_staff: editForm.max_staff ? parseInt(editForm.max_staff) : null,
      }),
    });
    const data = await res.json();
    if (data.error) return setEditError(data.error);
    // Update state langsung (optimistic) DAN re-fetch dari server agar pasti sync
    setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? data : ev));
    setEditingEvent(null);
    setSuccess("Event berhasil diperbarui!"); setTimeout(()=>setSuccess(""),3500);
    fetchEvents(); // re-fetch untuk pastikan kalender & list sinkron tanpa refresh
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

  async function handleAddStaffUser(e) {
    e.preventDefault(); setStaffUserError("");
    const { name, username, password, jabatan, posisi, discord_id } = staffUserForm;
    if (!name.trim() || !username.trim() || !password.trim()) return setStaffUserError("Nama, username, dan password wajib diisi");
    const res = await fetch("/api/staff-users", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name, username, password, jabatan, posisi, discord_id }) });
    const data = await res.json();
    if (data.error) return setStaffUserError(data.error);
    setStaffUsers(prev => [...prev, data].sort((a,b)=>a.name.localeCompare(b.name)));
    setStaffUserForm({ name:"", username:"", password:"", jabatan:"", posisi:"", discord_id:"" });
    setShowAddStaffModal(false);
    setStaffUserSuccess(`✅ Akun "${data.name}" berhasil dibuat!`); setTimeout(()=>setStaffUserSuccess(""),3500);
  }

  async function handleSaveEditStaffUser(e) {
    e.preventDefault(); setEditStaffUserError("");
    const { name, username, password, jabatan, posisi, discord_id, is_active } = editStaffUserForm;
    if (!name.trim() || !username.trim()) return setEditStaffUserError("Nama dan username wajib diisi");
    const res = await fetch(`/api/staff-users?id=${editingStaffUser.id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name, username, password, jabatan, posisi, discord_id, is_active }) });
    const data = await res.json();
    if (data.error) return setEditStaffUserError(data.error);
    setStaffUsers(prev => prev.map(u => u.id === editingStaffUser.id ? data : u));
    setEditingStaffUser(null);
    setStaffUserSuccess(`✅ Akun "${data.name}" berhasil diperbarui!`); setTimeout(()=>setStaffUserSuccess(""),3500);
  }

  async function handleDeleteStaffUser(id, name) {
    if (!confirm(`Hapus akun "${name}"? Aksi ini tidak bisa dibatalkan.`)) return;
    const res = await fetch(`/api/staff-users?id=${id}`, { method:"DELETE" });
    if (res.ok) { setStaffUsers(prev => prev.filter(u => u.id !== id)); setStaffUserSuccess(`✅ Akun "${name}" dihapus.`); setTimeout(()=>setStaffUserSuccess(""),3000); }
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
            <Link href="/admin/performance" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px" }}>📊 Performa Staff</Link>
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
                        <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                          <button onClick={()=>handleEdit(event)} className="btn btn-outline" style={{ fontSize:11,padding:"6px 12px",color:"var(--blue-1)",borderColor:"var(--blue-2)" }}>✏️ Edit</button>
                          <button onClick={()=>handleDelete(event.id)} className="btn btn-danger" style={{ fontSize:11,padding:"6px 12px" }}>Hapus</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
        {/* Edit Modal */}
        {editingEvent && (
          <div style={{ position:"fixed",inset:0,background:"rgba(10,20,40,0.55)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)" }}
            onClick={e=>{ if(e.target===e.currentTarget) setEditingEvent(null); }}>
            <div className="card scale-in" style={{ width:"100%",maxWidth:520,padding:28,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(10,22,40,0.4)" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
                <h3 style={{ fontSize:18,fontWeight:800,color:"var(--navy)",letterSpacing:-0.5 }}>
                  ✏️ Edit Event
                </h3>
                <button onClick={()=>setEditingEvent(null)} style={{ background:"rgba(0,0,0,0.06)",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:14,color:"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
              </div>

              {editError && <div style={{ background:"rgba(255,245,245,0.9)",color:"#dc2626",padding:"8px 12px",fontSize:12,borderRadius:10,marginBottom:16,border:"1px solid #fecaca",fontWeight:500 }}>⚠️ {editError}</div>}

              <form onSubmit={handleSaveEdit}>
                {/* Tipe event */}
                <div style={{ marginBottom:14 }}>
                  <label className="label">Tipe Event</label>
                  <div style={{ display:"flex",gap:8 }}>
                    {[{type:"wedding",icon:"💍",label:"Wedding"},{type:"event",icon:"🎉",label:"Event Biasa"}].map(({type,icon,label})=>(
                      <button key={type} type="button" onClick={()=>setEditForm({...editForm,event_type:type})}
                        style={{ flex:1,padding:"10px",border:`2px solid ${editForm.event_type===type?"var(--blue-2)":"var(--border)"}`,borderRadius:12,background:editForm.event_type===type?"rgba(238,244,255,0.9)":"rgba(248,250,255,0.8)",cursor:"pointer",textAlign:"center",transition:"all 0.15s" }}>
                        <span style={{ fontSize:18 }}>{icon}</span>
                        <p style={{ fontSize:11,fontWeight:700,color:editForm.event_type===type?"var(--blue-1)":"var(--muted)",marginTop:4 }}>{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tanggal */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14 }}>
                  <div>
                    <label className="label">Tanggal Mulai</label>
                    <input type="date" value={editForm.date} onChange={e=>setEditForm({...editForm,date:e.target.value,date_end:e.target.value>editForm.date_end?e.target.value:editForm.date_end})} className="input"/>
                  </div>
                  <div>
                    <label className="label">Tanggal Akhir</label>
                    <input type="date" value={editForm.date_end} min={editForm.date} onChange={e=>setEditForm({...editForm,date_end:e.target.value})} className="input"/>
                  </div>
                </div>

                {[
                  {label:editForm.event_type==="wedding"?"Nama Pasangan *":"Nama Event *",key:"couple",placeholder:editForm.event_type==="wedding"?"Budi & Siti":"Nama event..."},
                  {label:"Venue / Lokasi",key:"venue",placeholder:"Grand Ballroom"},
                  {label:"Jam Acara",key:"time",placeholder:"10:00 WIB"},
                  {label:"Add On",key:"addon",placeholder:"Dekorasi, Catering, dll..."},
                  {label:"Catatan",key:"notes",placeholder:"Info tambahan..."},
                ].map(({label,key,placeholder})=>(
                  <div key={key} style={{ marginBottom:14 }}>
                    <label className="label">{label}</label>
                    <input value={editForm[key]} onChange={e=>setEditForm({...editForm,[key]:e.target.value})} placeholder={placeholder} className="input"/>
                  </div>
                ))}

                <div style={{ marginBottom:20 }}>
                  <label className="label">👥 Maks. Slot Staff <span style={{ fontSize:10,color:"var(--muted)",fontWeight:500 }}>opsional</span></label>
                  <div style={{ position:"relative" }}>
                    <input type="number" min="1" max="99" value={editForm.max_staff}
                      onChange={e=>setEditForm({...editForm,max_staff:e.target.value})}
                      placeholder="Kosongkan = tidak dibatasi" className="input" style={{ paddingRight:60 }}/>
                    {editForm.max_staff && <span style={{ position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:"var(--blue-1)",fontWeight:700,pointerEvents:"none" }}>orang</span>}
                  </div>
                </div>

                <div style={{ display:"flex",gap:10 }}>
                  <button type="submit" className="btn btn-primary" style={{ flex:1 }}>Simpan Perubahan</button>
                  <button type="button" onClick={()=>setEditingEvent(null)} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* ===== MANAJEMEN STAFF USERS ===== */}
        <div style={{ maxWidth:1080,margin:"0 auto",padding:"0 20px 40px" }}>
        <div style={{ marginTop:32 }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12 }}>
            <div>
              <h2 style={{ fontSize:20,fontWeight:800,color:"var(--navy)",letterSpacing:-0.5 }}>👤 Manajemen Akun Staff</h2>
              <p style={{ fontSize:12,color:"var(--muted)",marginTop:2 }}>Buat dan kelola akun login untuk setiap anggota tim. Jabatan & posisi otomatis muncul saat mereka daftar ke event.</p>
            </div>
            <button onClick={()=>{ setShowAddStaffModal(true); setStaffUserError(""); setStaffUserForm({name:"",username:"",password:"",jabatan:"",posisi:"",discord_id:""}); }}
              className="btn btn-primary" style={{ fontSize:13,padding:"9px 20px",flexShrink:0 }}>
              + Tambah Akun Staff
            </button>
          </div>

          {staffUserSuccess && <div className="scale-in" style={{ background:"rgba(240,253,244,0.95)",border:"1px solid #86efac",color:"#15803d",padding:"12px 20px",borderRadius:14,marginBottom:16,fontSize:13,fontWeight:600 }}>{staffUserSuccess}</div>}
            <div className="card" style={{ overflow:"hidden" }}>
              <div style={{ padding:"14px 20px",borderBottom:"1px solid var(--border)",background:"rgba(232,238,247,0.8)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ position:"relative",flex:1,maxWidth:320 }}>
                  <span style={{ position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,pointerEvents:"none",color:"var(--muted)" }}>🔍</span>
                  <input value={staffUserSearch} onChange={e=>setStaffUserSearch(e.target.value)} placeholder="Cari nama atau username…"
                    style={{ width:"100%",paddingLeft:32,paddingRight:staffUserSearch?32:12,paddingTop:8,paddingBottom:8,border:"1.5px solid var(--border)",borderRadius:10,fontSize:12,fontWeight:500,background:"rgba(255,255,255,0.9)",outline:"none",color:"var(--dark)",boxSizing:"border-box" }}
                    onFocus={e=>e.target.style.borderColor="var(--blue-2)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                  {staffUserSearch && <button onClick={()=>setStaffUserSearch("")} style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.08)",border:"none",borderRadius:"50%",width:18,height:18,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:10,color:"var(--muted)" }}>✕</button>}
                </div>
                <span style={{ fontSize:12,fontWeight:700,color:"var(--muted)",marginLeft:"auto" }}>{staffUsers.length} akun terdaftar</span>
              </div>
              <div style={{ maxHeight:500,overflowY:"auto" }}>
                {staffUsers.length === 0 && (
                  <div style={{ padding:"40px",textAlign:"center" }}>
                    <p style={{ fontSize:28,marginBottom:8 }}>👤</p>
                    <p style={{ fontSize:13,color:"var(--muted)",fontWeight:500 }}>Belum ada akun staff. Klik "+ Tambah Akun Staff" untuk mulai.</p>
                  </div>
                )}
                {(() => {
                  const sq = staffUserSearch.trim().toLowerCase();
                  const filtered = sq ? staffUsers.filter(u => u.name.toLowerCase().includes(sq) || u.username.toLowerCase().includes(sq) || (u.jabatan||"").toLowerCase().includes(sq)) : staffUsers;
                  return filtered.map(user => (
                    <div key={user.id} style={{ padding:"14px 20px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,transition:"background 0.15s" }}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(238,244,255,0.5)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{ display:"flex",alignItems:"center",gap:12,minWidth:0 }}>
                        <div style={{ width:38,height:38,borderRadius:11,background:user.is_active?"linear-gradient(135deg,var(--blue-3),var(--blue-1))":"linear-gradient(135deg,#9ca3af,#6b7280)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                          <span style={{ color:"#fff",fontSize:15,fontWeight:800 }}>{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                            <p style={{ fontSize:14,fontWeight:700,color:"var(--dark)" }}>{user.name}</p>
                            {!user.is_active && <span style={{ fontSize:9,background:"rgba(239,68,68,0.1)",color:"#ef4444",borderRadius:6,padding:"1px 7px",fontWeight:700,textTransform:"uppercase",letterSpacing:0.5 }}>Nonaktif</span>}
                          </div>
                          <p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>@{user.username}{(user.jabatan||user.posisi) ? ` · ${[user.jabatan,user.posisi].filter(Boolean).join(" · ")}` : ""}</p>
                          {user.discord_id && (
                            <p style={{ fontSize:10,color:"#5865F2",fontWeight:600,marginTop:2,display:"flex",alignItems:"center",gap:4 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.082.114 18.105.133 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                              {user.discord_id}
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                        <button onClick={()=>{ setEditingStaffUser(user); setEditStaffUserForm({ name:user.name,username:user.username,password:"",jabatan:user.jabatan||"",posisi:user.posisi||"",discord_id:user.discord_id||"",is_active:user.is_active }); setEditStaffUserError(""); }} className="btn btn-outline" style={{ fontSize:11,padding:"6px 12px",color:"var(--blue-1)",borderColor:"var(--blue-2)" }}>✏️ Edit</button>
                        <button onClick={()=>handleDeleteStaffUser(user.id, user.name)} className="btn btn-danger" style={{ fontSize:11,padding:"6px 12px" }}>Hapus</button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
        </div>
        </div>

        {/* Add Staff User Modal */}
        {showAddStaffModal && (
          <div style={{ position:"fixed",inset:0,background:"rgba(10,20,40,0.55)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)" }}
            onClick={e=>{ if(e.target===e.currentTarget) setShowAddStaffModal(false); }}>
            <div className="card scale-in" style={{ width:"100%",maxWidth:520,padding:28,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(10,22,40,0.4)" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
                <h3 style={{ fontSize:18,fontWeight:800,color:"var(--navy)",letterSpacing:-0.5 }}>👤 Buat Akun Staff Baru</h3>
                <button onClick={()=>setShowAddStaffModal(false)} style={{ background:"rgba(0,0,0,0.06)",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:14,color:"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
              </div>
              {staffUserError && <div style={{ background:"rgba(255,245,245,0.9)",color:"#dc2626",padding:"8px 12px",fontSize:12,borderRadius:10,marginBottom:16,border:"1px solid #fecaca",fontWeight:500 }}>⚠️ {staffUserError}</div>}
              <form onSubmit={handleAddStaffUser}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
                  <div>
                    <label className="label">Nama Lengkap *</label>
                    <input value={staffUserForm.name} onChange={e=>setStaffUserForm({...staffUserForm,name:e.target.value})} placeholder="Contoh: Budi Santoso" className="input" required/>
                  </div>
                  <div>
                    <label className="label">Username *</label>
                    <input value={staffUserForm.username} onChange={e=>setStaffUserForm({...staffUserForm,username:e.target.value})} placeholder="Contoh: budi" className="input" required autoCapitalize="none"/>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label className="label">Password *</label>
                  <input type="text" value={staffUserForm.password} onChange={e=>setStaffUserForm({...staffUserForm,password:e.target.value})} placeholder="Buat password untuk staff ini" className="input" required/>
                  <p style={{ fontSize:11,color:"var(--muted)",marginTop:4 }}>Password ini diberikan ke staff untuk login ke portal.</p>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
                  <div>
                    <label className="label">Jabatan <span style={{ fontSize:10,color:"var(--muted)",fontWeight:400 }}>opsional</span></label>
                    <input value={staffUserForm.jabatan} onChange={e=>setStaffUserForm({...staffUserForm,jabatan:e.target.value})} placeholder="Contoh: Fotografer" className="input"/>
                  </div>
                  <div>
                    <label className="label">Posisi <span style={{ fontSize:10,color:"var(--muted)",fontWeight:400 }}>opsional</span></label>
                    <input value={staffUserForm.posisi} onChange={e=>setStaffUserForm({...staffUserForm,posisi:e.target.value})} placeholder="Contoh: Senior" className="input"/>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label className="label">
                    Discord ID <span style={{ fontSize:10,color:"var(--muted)",fontWeight:400 }}>opsional — untuk mention di reminder</span>
                  </label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",lineHeight:1 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#5865F2" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.082.114 18.105.133 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    </span>
                    <input value={staffUserForm.discord_id} onChange={e=>setStaffUserForm({...staffUserForm,discord_id:e.target.value.replace(/\D/g,"")})} placeholder="Contoh: 123456789012345678" className="input" style={{ paddingLeft:34 }} inputMode="numeric"/>
                  </div>
                  <p style={{ fontSize:11,color:"var(--muted)",marginTop:4 }}>
                    Settings → Advanced → aktifkan <strong>Developer Mode</strong> → klik kanan user → <strong>Copy User ID</strong>
                  </p>
                </div>
                <div style={{ background:"rgba(238,244,255,0.6)",border:"1px solid rgba(209,221,247,0.7)",borderRadius:12,padding:"10px 14px",marginBottom:20 }}>
                  <p style={{ fontSize:11,color:"var(--blue-1)",fontWeight:700,marginBottom:4 }}>Preview reminder Discord:</p>
                  <p style={{ fontSize:12,color:"var(--dark)",lineHeight:1.8 }}>
                    <strong>{staffUserForm.name || "Nama Staff"}</strong>{" "}
                    {staffUserForm.discord_id
                      ? <span style={{ background:"rgba(88,101,242,0.12)",color:"#5865F2",borderRadius:6,padding:"1px 6px",fontWeight:700,fontSize:11 }}>@{staffUserForm.name||"user"}</span>
                      : <span style={{ color:"var(--muted)",fontSize:11 }}>(tidak ada mention)</span>
                    }{" "}— <span style={{ color:"var(--muted)" }}>{[staffUserForm.jabatan, staffUserForm.posisi].filter(Boolean).join(" · ") || "Staff"}</span>
                  </p>
                </div>
                <div style={{ display:"flex",gap:10 }}>
                  <button type="submit" className="btn btn-primary" style={{ flex:1,padding:"12px" }}>Buat Akun Staff</button>
                  <button type="button" onClick={()=>setShowAddStaffModal(false)} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Staff User Modal */}
        {editingStaffUser && (
          <div style={{ position:"fixed",inset:0,background:"rgba(10,20,40,0.55)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)" }}
            onClick={e=>{ if(e.target===e.currentTarget) setEditingStaffUser(null); }}>
            <div className="card scale-in" style={{ width:"100%",maxWidth:520,padding:28,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 32px 80px rgba(10,22,40,0.4)" }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
                <h3 style={{ fontSize:18,fontWeight:800,color:"var(--navy)",letterSpacing:-0.5 }}>✏️ Edit Akun Staff</h3>
                <button onClick={()=>setEditingStaffUser(null)} style={{ background:"rgba(0,0,0,0.06)",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:14,color:"var(--muted)",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
              </div>
              {editStaffUserError && <div style={{ background:"rgba(255,245,245,0.9)",color:"#dc2626",padding:"8px 12px",fontSize:12,borderRadius:10,marginBottom:16,border:"1px solid #fecaca",fontWeight:500 }}>⚠️ {editStaffUserError}</div>}
              <form onSubmit={handleSaveEditStaffUser}>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
                  <div>
                    <label className="label">Nama Lengkap *</label>
                    <input value={editStaffUserForm.name} onChange={e=>setEditStaffUserForm({...editStaffUserForm,name:e.target.value})} className="input" required/>
                  </div>
                  <div>
                    <label className="label">Username *</label>
                    <input value={editStaffUserForm.username} onChange={e=>setEditStaffUserForm({...editStaffUserForm,username:e.target.value})} className="input" required autoCapitalize="none"/>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label className="label">Password Baru <span style={{ fontSize:10,color:"var(--muted)",fontWeight:400 }}>kosongkan jika tidak diganti</span></label>
                  <input type="text" value={editStaffUserForm.password} onChange={e=>setEditStaffUserForm({...editStaffUserForm,password:e.target.value})} placeholder="Isi untuk mengganti password…" className="input"/>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14 }}>
                  <div>
                    <label className="label">Jabatan</label>
                    <input value={editStaffUserForm.jabatan} onChange={e=>setEditStaffUserForm({...editStaffUserForm,jabatan:e.target.value})} placeholder="Contoh: Fotografer" className="input"/>
                  </div>
                  <div>
                    <label className="label">Posisi</label>
                    <input value={editStaffUserForm.posisi} onChange={e=>setEditStaffUserForm({...editStaffUserForm,posisi:e.target.value})} placeholder="Contoh: Senior" className="input"/>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label className="label">
                    Discord ID <span style={{ fontSize:10,color:"var(--muted)",fontWeight:400 }}>opsional — untuk mention di reminder</span>
                  </label>
                  <div style={{ position:"relative" }}>
                    <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:16,pointerEvents:"none",lineHeight:1 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.082.114 18.105.133 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    </span>
                    <input
                      value={editStaffUserForm.discord_id}
                      onChange={e=>setEditStaffUserForm({...editStaffUserForm,discord_id:e.target.value.replace(/\D/g,"")})}
                      placeholder="Contoh: 123456789012345678"
                      className="input"
                      style={{ paddingLeft:36 }}
                      inputMode="numeric"
                    />
                  </div>
                  {editStaffUserForm.discord_id && (
                    <p style={{ fontSize:11,color:"#5865F2",marginTop:4,fontWeight:600 }}>
                      ✅ Akan di-mention sebagai <code style={{ background:"rgba(88,101,242,0.1)",padding:"1px 5px",borderRadius:4 }}>&lt;@{editStaffUserForm.discord_id}&gt;</code> di reminder
                    </p>
                  )}
                </div>
                <div style={{ marginBottom:20 }}>
                  <label style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer" }}>
                    <input type="checkbox" checked={editStaffUserForm.is_active} onChange={e=>setEditStaffUserForm({...editStaffUserForm,is_active:e.target.checked})} style={{ width:16,height:16,cursor:"pointer" }}/>
                    <span style={{ fontSize:13,fontWeight:600,color:"var(--dark)" }}>Akun aktif <span style={{ fontSize:11,color:"var(--muted)",fontWeight:400 }}>(nonaktif = tidak bisa login)</span></span>
                  </label>
                </div>
                <div style={{ display:"flex",gap:10 }}>
                  <button type="submit" className="btn btn-primary" style={{ flex:1 }}>Simpan Perubahan</button>
                  <button type="button" onClick={()=>setEditingStaffUser(null)} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <footer style={{ textAlign:"center",padding:"24px 0 16px",color:"var(--muted)",fontSize:11,opacity:0.4,position:"relative",zIndex:1 }}>Created by GG & Caramolly</footer>
      </div>
    </>
  );
}
