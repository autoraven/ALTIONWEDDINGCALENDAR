// pages/staff/index.js
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  });
}

function highlight(text, q) {
  if (!q || !text) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background:"rgba(255,210,60,0.45)",borderRadius:3,padding:"0 1px",fontWeight:800 }}>{text.slice(idx, idx+q.length)}</mark>
      {text.slice(idx+q.length)}
    </>
  );
}

function BgDecor() {
  return (
    <>
      <div className="bg-orb bg-orb-1"/><div className="bg-orb bg-orb-2"/>
      <div className="bg-orb bg-orb-3"/><div className="bg-orb bg-orb-4"/>
      <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",
        backgroundImage:"radial-gradient(circle,rgba(30,96,213,0.13) 1px,transparent 1px)",
        backgroundSize:"36px 36px",
        maskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)",
        WebkitMaskImage:"radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)",
      }}/>
    </>
  );
}

// Check apakah hari ini adalah hari event (termasuk multi-day)
function isEventToday(event, todayStr) {
  const start = event.date;
  const end = event.date_end || event.date;
  return todayStr >= start && todayStr <= end;
}

export default function StaffPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [events, setEvents] = useState([]);
  const [staffMap, setStaffMap] = useState({});
  const [checkinMap, setCheckinMap] = useState({}); // { event_id: checkin_record | null }
  const [loading, setLoading] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [search, setSearch] = useState("");
  const { businessName } = CALENDAR_CONFIG;
  // Tanggal hari ini dalam WIB (UTC+7) — bukan UTC
  const nowWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  const todayStr = nowWIB.toISOString().split("T")[0]; // "YYYY-MM-DD" dalam WIB
  const today = new Date(todayStr + "T00:00:00"); // untuk perbandingan isPast

  useEffect(() => {
    setMounted(true);
    const saved = sessionStorage.getItem("staff_user");
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        fetchAll(user);
      } catch {}
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(""); setLoginLoading(true);
    const res = await fetch("/api/staff-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: loginUsername, password: loginPassword }),
    });
    const data = await res.json();
    setLoginLoading(false);
    if (data.success) {
      sessionStorage.setItem("staff_user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      fetchAll(data.user);
    } else {
      setLoginError(data.message || "Login gagal");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem("staff_user");
    setCurrentUser(null);
    setEvents([]);
    setStaffMap({});
    setCheckinMap({});
    setLoginUsername("");
    setLoginPassword("");
  }

  async function fetchAll(user) {
    const u = user || currentUser;
    const [evRes, stRes, ciRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/staff"),
      u ? fetch(`/api/checkin?staff_user_id=${u.id}`) : Promise.resolve(null),
    ]);
    const evData = await evRes.json();
    const stData = await stRes.json();

    if (Array.isArray(evData)) setEvents(evData);
    if (Array.isArray(stData)) {
      const map = {};
      stData.forEach(s => {
        if (!map[s.event_id]) map[s.event_id] = [];
        map[s.event_id].push(s);
      });
      setStaffMap(map);
    }

    if (ciRes) {
      const ciData = await ciRes.json();
      if (Array.isArray(ciData)) {
        const ciMap = {};
        ciData.forEach(c => { ciMap[c.event_id] = c; });
        setCheckinMap(ciMap);
      }
    }
  }

  async function handleJoin(event) {
    if (!currentUser) return;
    setError(""); setLoading(true);
    const staffRole = [currentUser.jabatan, currentUser.posisi].filter(Boolean).join(" · ") || "Staff";
    const res = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_id: event.id, name: currentUser.name, role: staffRole, user_id: currentUser.id }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) return setError(data.error);
    setStaffMap(prev => ({ ...prev, [event.id]: [...(prev[event.id]||[]), data] }));
    setSuccess(`✅ ${currentUser.name} berhasil terdaftar!`);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleLeave(staffId, eventId) {
    const staffEntry = (staffMap[eventId]||[]).find(s => s.id === staffId);
    if (!staffEntry || staffEntry.name?.toLowerCase().trim() !== currentUser.name?.toLowerCase().trim()) return setError("Kamu hanya bisa menghapus dirimu sendiri.");
    if (!confirm("Keluar dari event ini?")) return;
    const res = await fetch(`/api/staff?id=${staffId}`, { method:"DELETE" });
    if (res.ok) setStaffMap(prev => ({ ...prev, [eventId]: (prev[eventId]||[]).filter(s => s.id !== staffId) }));
  }

  async function handleCheckin(event) {
    if (!currentUser) return;
    setCheckinLoading(prev => ({ ...prev, [event.id]: true }));
    setError("");
    const res = await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_id: event.id,
        staff_user_id: currentUser.id,
        staff_name: currentUser.name,
      }),
    });
    const data = await res.json();
    setCheckinLoading(prev => ({ ...prev, [event.id]: false }));

    if (data.error && !data.alreadyCheckedIn) return setError(data.error);
    if (data.id || data.alreadyCheckedIn) {
      setCheckinMap(prev => ({ ...prev, [event.id]: data.alreadyCheckedIn ? prev[event.id] : data }));
      if (!data.alreadyCheckedIn) {
        setSuccess(`✅ Check-in berhasil! Selamat bekerja, ${currentUser.name}!`);
        setTimeout(() => setSuccess(""), 4000);
      }
    }
  }

  // Debug: tampilkan tanggal WIB yang terbaca (bisa dihapus setelah konfirmasi)
  if (typeof window !== "undefined") {
    console.log("[ALTION] todayStr (WIB):", todayStr);
  }
  const upcomingEvents = events.filter(e => (e.date_end || e.date) >= todayStr);
  const baseEvents = activeTab === "upcoming" ? upcomingEvents : events;
  const q = search.trim().toLowerCase();
  const displayEvents = q
    ? baseEvents.filter(e => {
        const staffList = staffMap[e.id] || [];
        return e.couple?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q) ||
          e.event_type?.toLowerCase().includes(q) || staffList.some(s => s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q));
      })
    : baseEvents;
  const totalStaff = Object.values(staffMap).flat().length;

  // ─── Login Screen ───────────────────────────────────────────────────────────
  if (!currentUser) return (
    <>
      <Head>
        <title>Staff Login — {businessName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",top:-120,right:-80,width:500,height:500,borderRadius:"50%",background:"rgba(64,128,240,0.15)",filter:"blur(70px)",pointerEvents:"none" }}/>
        <div style={{ position:"absolute",bottom:-100,left:-60,width:400,height:400,borderRadius:"50%",background:"rgba(21,53,160,0.2)",filter:"blur(60px)",pointerEvents:"none" }}/>
        <div className={mounted?"scale-in":""} style={{ background:"rgba(255,255,255,0.97)",width:"100%",maxWidth:420,borderRadius:24,overflow:"hidden",boxShadow:"0 32px 80px rgba(10,22,40,0.5)",position:"relative",zIndex:1 }}>
          <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"40px 40px 32px",textAlign:"center",position:"relative",overflow:"hidden" }}>
            <div style={{ width:68,height:68,borderRadius:18,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",padding:8,overflow:"hidden",position:"relative",zIndex:1 }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <h1 style={{ color:"#fff",fontSize:26,fontWeight:800,letterSpacing:-0.5,position:"relative",zIndex:1 }}>{businessName}</h1>
            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,letterSpacing:3,marginTop:6,textTransform:"uppercase",fontWeight:600,position:"relative",zIndex:1 }}>Staff Portal</p>
          </div>
          <form onSubmit={handleLogin} style={{ padding:"36px 40px" }}>
            <p style={{ fontSize:13,color:"var(--muted)",marginBottom:20,textAlign:"center",lineHeight:1.6 }}>
              Masuk dengan akun staff kamu untuk mendaftar ke event.
            </p>
            {loginError && <div style={{ background:"#fff0f0",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:12,marginBottom:20,fontSize:13,fontWeight:500 }}>⚠️ {loginError}</div>}
            <div style={{ marginBottom:16 }}>
              <label className="label">Username</label>
              <input type="text" value={loginUsername} onChange={e=>setLoginUsername(e.target.value)} placeholder="Masukkan username..." className="input" required autoFocus autoCapitalize="none"/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label className="label">Password</label>
              <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Masukkan password..." className="input" required/>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:"100%",padding:"13px",fontSize:14 }} disabled={loginLoading}>
              {loginLoading ? "Masuk..." : "Masuk ke Staff Portal"}
            </button>
            <div style={{ marginTop:20,textAlign:"center" }}>
              <Link href="/" style={{ fontSize:12,color:"var(--muted)",textDecoration:"none",fontWeight:500 }}>← Kembali ke Kalender</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  // ─── Staff Dashboard ────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Staff — {businessName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>
      <div style={{ minHeight:"100vh",position:"relative",overflow:"hidden" }}>
        <BgDecor/>
        {/* Header */}
        <header style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",padding:"0 24px",height:68,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 32px rgba(10,22,40,0.4)",position:"sticky",top:0,zIndex:100 }}>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:5,border:"1.5px solid rgba(255,255,255,0.2)" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <div>
              <span style={{ color:"#fff",fontSize:17,fontWeight:800,letterSpacing:-0.5,display:"block",lineHeight:1.1 }}>{businessName}</span>
              <span style={{ color:"rgba(255,255,255,0.45)",fontSize:9,letterSpacing:2.5,textTransform:"uppercase",fontWeight:600 }}>Staff Portal</span>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.1)",borderRadius:12,padding:"6px 14px",border:"1px solid rgba(255,255,255,0.2)" }}>
              <div style={{ width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,rgba(255,255,255,0.3),rgba(255,255,255,0.15))",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <span style={{ color:"#fff",fontSize:12,fontWeight:800 }}>{currentUser.name.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p style={{ color:"#fff",fontSize:12,fontWeight:700,lineHeight:1.1 }}>{currentUser.name}</p>
                {(currentUser.jabatan || currentUser.posisi) && (
                  <p style={{ color:"rgba(255,255,255,0.5)",fontSize:10,fontWeight:500 }}>
                    {[currentUser.jabatan, currentUser.posisi].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            </div>
            <Link href="/" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px" }}>Kalender</Link>
            <button onClick={handleLogout} className="btn btn-danger" style={{ fontSize:12,padding:"8px 18px" }}>Logout</button>
          </div>
        </header>

        <main style={{ maxWidth:1100,margin:"0 auto",padding:"36px 20px",position:"relative",zIndex:1 }}>
          {/* Hero */}
          <div className={mounted?"fade-up":""} style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--blue-1) 100%)",borderRadius:24,padding:"36px 44px",marginBottom:28,boxShadow:"0 16px 48px rgba(10,22,40,0.25)",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none" }}/>
            <img src="/logo.png" alt="" aria-hidden="true" style={{ position:"absolute",right:20,bottom:0,width:180,height:180,objectFit:"contain",opacity:0.07,pointerEvents:"none",filter:"brightness(0) invert(1)",zIndex:0 }}/>
            <div style={{ position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:20 }}>
              <div>
                <p style={{ color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:3.5,textTransform:"uppercase",marginBottom:10 }}>Staff Portal</p>
                <h2 style={{ color:"#fff",fontSize:28,fontWeight:800,letterSpacing:-1,marginBottom:6,lineHeight:1.1 }}>Halo, {currentUser.name}! 👋</h2>
                <p style={{ color:"rgba(255,255,255,0.5)",fontSize:13,lineHeight:1.7,maxWidth:400 }}>
                  {[currentUser.jabatan, currentUser.posisi].filter(Boolean).join(" · ") || "Staff"} — Pilih event dan klik daftar. Di hari H, tombol Check-in akan muncul.
                </p>
              </div>
              <div style={{ display:"flex",gap:14,flexWrap:"wrap" }}>
                {[
                  {label:"Total Event",value:events.length,icon:"📅"},
                  {label:"Mendatang",value:upcomingEvents.length,icon:"🗓️"},
                  {label:"Total Staff",value:totalStaff,icon:"👥"},
                  {label:"Check-in Saya",value:Object.keys(checkinMap).length,icon:"✅"},
                ].map(({label,value,icon})=>(
                  <div key={label} style={{ background:"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",borderRadius:16,padding:"14px 18px",textAlign:"center",border:"1px solid rgba(255,255,255,0.15)",minWidth:86 }}>
                    <div style={{ fontSize:18,marginBottom:4 }}>{icon}</div>
                    <div style={{ color:"#fff",fontSize:24,fontWeight:800,lineHeight:1,letterSpacing:-1 }}>{value}</div>
                    <div style={{ color:"rgba(255,255,255,0.45)",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1.2,marginTop:4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {success && <div className="scale-in" style={{ background:"rgba(240,253,244,0.95)",border:"1px solid #86efac",color:"#15803d",padding:"12px 20px",borderRadius:14,marginBottom:20,fontSize:13,fontWeight:600 }}>{success}</div>}
          {error && <div style={{ background:"#fff0f0",border:"1px solid #fecaca",color:"#dc2626",padding:"12px 20px",borderRadius:14,marginBottom:20,fontSize:13,fontWeight:600,display:"flex",justifyContent:"space-between",alignItems:"center" }}>⚠️ {error}<button onClick={()=>setError("")} style={{ background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontWeight:700 }}>✕</button></div>}

          {/* Toolbar */}
          <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:20,flexWrap:"wrap" }}>
            <div style={{ display:"flex",gap:6,background:"rgba(255,255,255,0.85)",border:"1.5px solid var(--border)",borderRadius:14,padding:4,backdropFilter:"blur(8px)" }}>
              {[{key:"upcoming",label:"Mendatang",count:upcomingEvents.length},{key:"all",label:"Semua",count:events.length}].map(({key,label,count})=>(
                <button key={key} onClick={()=>setActiveTab(key)} style={{ padding:"7px 16px",borderRadius:10,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all 0.18s",border:"none",background:activeTab===key?"linear-gradient(135deg,var(--blue-3),var(--blue-1))":"transparent",color:activeTab===key?"#fff":"var(--muted)",boxShadow:activeTab===key?"0 2px 10px rgba(30,96,213,0.25)":"none" }}>
                  {label} <span style={{ background:activeTab===key?"rgba(255,255,255,0.25)":"rgba(30,96,213,0.1)",color:activeTab===key?"#fff":"var(--blue-1)",borderRadius:20,padding:"1px 7px",fontSize:10,marginLeft:5,fontWeight:800 }}>{count}</span>
                </button>
              ))}
            </div>
            <div style={{ flex:1,minWidth:200,position:"relative" }}>
              <span style={{ position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14,pointerEvents:"none",color:"var(--muted)" }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari event, venue, atau nama staff…"
                style={{ width:"100%",paddingLeft:36,paddingRight:search?36:14,paddingTop:9,paddingBottom:9,border:"1.5px solid var(--border)",borderRadius:12,fontSize:13,fontWeight:500,background:"rgba(255,255,255,0.9)",backdropFilter:"blur(8px)",outline:"none",color:"var(--dark)",boxSizing:"border-box" }}
                onFocus={e=>{e.target.style.borderColor="var(--blue-2)";}} onBlur={e=>{e.target.style.borderColor="var(--border)";}}/> 
              {search && <button onClick={()=>setSearch("")} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"rgba(0,0,0,0.08)",border:"none",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:11,color:"var(--muted)" }}>✕</button>}
            </div>
            {q && <span style={{ fontSize:12,color:"var(--muted)",fontWeight:600,whiteSpace:"nowrap" }}>{displayEvents.length === 0 ? "Tidak ditemukan" : `${displayEvents.length} hasil`}</span>}
          </div>

          {/* Event Cards */}
          <div style={{ columns:"340px",columnGap:20,columnFill:"balance" }}>
            {displayEvents.length === 0 && (
              <div style={{ columnSpan:"all",textAlign:"center",padding:"48px 0",color:"var(--muted)" }}>
                <p style={{ fontSize:32,marginBottom:12 }}>{q?"🔍":"📅"}</p>
                <p style={{ fontWeight:700,fontSize:14,color:"var(--dark)",marginBottom:4 }}>{q?`Tidak ada hasil untuk "${search}"`:activeTab==="upcoming"?"Tidak ada event mendatang":"Tidak ada event"}</p>
                {q && <button onClick={()=>setSearch("")} style={{ fontSize:12,padding:"7px 18px",borderRadius:10,border:"1.5px solid var(--border)",background:"#fff",cursor:"pointer",fontWeight:600,color:"var(--blue-1)" }}>Hapus pencarian</button>}
              </div>
            )}
            {[...displayEvents].sort((a,b)=>a.date.localeCompare(b.date)).map(event => {
              const staffList = staffMap[event.id] || [];
              const isPast = (event.date_end || event.date) < todayStr;
              const myEntry = staffList.find(s => s.name?.toLowerCase().trim() === currentUser.name?.toLowerCase().trim());
              const isFull = event.max_staff && staffList.length >= event.max_staff;
              const isToday = isEventToday(event, todayStr);
              const myCheckin = checkinMap[event.id];
              const isCheckinLoading = !!checkinLoading[event.id];
              if (typeof window !== "undefined") console.log(`[ALTION] Event: ${event.couple} | date: ${event.date} | date_end: ${event.date_end} | isToday: ${isToday} | myEntry: ${!!myEntry} | isPast: ${isPast}`);

              return (
                <div key={event.id} className={mounted?"card fade-up":"card"} style={{ overflow:"hidden",boxShadow:"var(--shadow)",opacity:isPast?0.8:1,transition:"transform 0.2s,box-shadow 0.2s",breakInside:"avoid",marginBottom:20,display:"inline-block",width:"100%",border:isToday?"2px solid rgba(16,185,129,0.5)":"2px solid transparent" }}
                  onMouseEnter={e=>{if(!isPast){e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="var(--shadow-lg)";}}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="var(--shadow)";}}>

                  {/* Card Header */}
                  <div style={{ background:isPast?"linear-gradient(135deg,#374151,#6b7280)":isToday?"linear-gradient(135deg,#065f46,#059669)":"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"18px 20px",position:"relative",overflow:"hidden" }}>
                    <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"16px 16px",pointerEvents:"none" }}/>
                    <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,position:"relative",zIndex:1 }}>
                      <div style={{ minWidth:0,flex:1 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap" }}>
                          <span style={{ fontSize:10,background:"rgba(255,255,255,0.15)",color:"#fff",padding:"2px 8px",borderRadius:10,fontWeight:700 }}>{event.event_type==="wedding"?"💍 Wedding":"🎉 Event"}</span>
                          {isPast && <span style={{ fontSize:10,background:"rgba(0,0,0,0.25)",color:"rgba(255,255,255,0.6)",padding:"2px 8px",borderRadius:10,fontWeight:600 }}>Selesai</span>}
                          {isToday && <span style={{ fontSize:10,background:"rgba(255,255,255,0.25)",color:"#fff",padding:"2px 8px",borderRadius:10,fontWeight:700,animation:"pulse 2s infinite" }}>🟢 HARI INI</span>}
                          {myEntry && <span style={{ fontSize:10,background:"rgba(16,185,129,0.3)",color:"#6ee7b7",padding:"2px 8px",borderRadius:10,fontWeight:700 }}>✓ Terdaftar</span>}
                          {myCheckin && <span style={{ fontSize:10,background:"rgba(253,224,71,0.3)",color:"#fef08a",padding:"2px 8px",borderRadius:10,fontWeight:700 }}>✅ Check-in</span>}
                        </div>
                        <h3 style={{ color:"#fff",fontSize:15,fontWeight:800,letterSpacing:-0.3,marginBottom:4,lineHeight:1.2 }}>{highlight(event.couple,q)}</h3>
                        <p style={{ color:"rgba(255,255,255,0.55)",fontSize:11,fontWeight:500 }}>📅 {formatDate(event.date)}{event.date_end && event.date_end !== event.date ? ` — ${formatDate(event.date_end)}` : ""}</p>
                        {event.venue&&<p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,marginTop:2 }}>📍 {highlight(event.venue,q)}</p>}
                        {event.time&&<p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,marginTop:2 }}>🕐 {event.time}</p>}
                        {event.addon&&<p style={{ color:"rgba(255,255,255,0.4)",fontSize:11,marginTop:2 }}>✨ {event.addon}</p>}
                      </div>
                      <div style={{ background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",borderRadius:12,padding:"8px 12px",textAlign:"center",flexShrink:0,border:"1px solid rgba(255,255,255,0.18)",minWidth:52 }}>
                        <div style={{ color:"#fff",fontSize:22,fontWeight:800,lineHeight:1 }}>{staffList.length}{event.max_staff?<span style={{ fontSize:13,fontWeight:500,opacity:0.7 }}>/{event.max_staff}</span>:""}</div>
                        <div style={{ color:"rgba(255,255,255,0.55)",fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginTop:2 }}>Staff</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding:"14px 18px" }}>
                    {event.max_staff && (() => {
                      const filled=staffList.length,max=event.max_staff,pct=Math.min((filled/max)*100,100);
                      const isFull=filled>=max,isNearFull=!isFull&&pct>=75;
                      return (
                        <div style={{ marginBottom:14 }}>
                          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
                            <span style={{ fontSize:10,fontWeight:700,color:isFull?"#ef4444":isNearFull?"#f59e0b":"var(--muted)",textTransform:"uppercase",letterSpacing:0.8 }}>{isFull?"🔴 Slot Penuh":isNearFull?"🟡 Hampir Penuh":"🟢 Slot Tersedia"}</span>
                            <span style={{ fontSize:11,fontWeight:800,color:isFull?"#ef4444":"var(--dark)" }}>{filled}<span style={{ color:"var(--muted)",fontWeight:500 }}>/{max}</span></span>
                          </div>
                          <div style={{ height:6,borderRadius:99,background:"rgba(0,0,0,0.07)",overflow:"hidden" }}><div style={{ height:"100%",borderRadius:99,width:`${pct}%`,background:isFull?"#ef4444":isNearFull?"#f59e0b":"var(--blue-2)",transition:"width 0.5s" }}/></div>
                        </div>
                      );
                    })()}

                    {staffList.length > 0 && (
                      <div style={{ marginBottom:12 }}>
                        <p style={{ fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>Tim ({staffList.length})</p>
                        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                          {staffList.map(s=>{
                            const isMe = s.name === currentUser.name;
                            return (
                              <div key={s.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:10,background:isMe?"rgba(209,250,229,0.7)":"rgba(238,244,255,0.6)",border:isMe?"1px solid rgba(52,211,153,0.5)":"1px solid rgba(209,221,247,0.5)" }}>
                                <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:0 }}>
                                  <div style={{ width:28,height:28,borderRadius:8,background:isMe?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,var(--blue-3),var(--blue-1))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                    <span style={{ color:"#fff",fontSize:11,fontWeight:800 }}>{s.name.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div style={{ minWidth:0 }}>
                                    <p style={{ fontSize:12,fontWeight:700,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                                      {highlight(s.name,q)}{isMe&&<span style={{ fontSize:9,background:"rgba(16,185,129,0.15)",color:"#059669",borderRadius:6,padding:"1px 5px",fontWeight:700,marginLeft:4 }}>Kamu</span>}
                                    </p>
                                    <p style={{ fontSize:10,color:"var(--muted)",fontWeight:500 }}>{highlight(s.role,q)}</p>
                                  </div>
                                </div>
                                {!isPast && isMe && !isToday && (
                                  <button onClick={()=>handleLeave(s.id,event.id)} style={{ background:"transparent",border:"none",cursor:"pointer",color:"#ef4444",fontSize:14,padding:"2px 6px",borderRadius:6,transition:"all 0.15s",flexShrink:0 }} title="Keluar dari event">✕</button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {staffList.length === 0 && <p style={{ fontSize:12,color:"var(--muted)",fontStyle:"italic",textAlign:"center",padding:"10px 0 12px" }}>Belum ada staff terdaftar</p>}

                    {/* Action Buttons */}
                    {!isPast && (() => {
                      // ── HARI H: tampilkan tombol check-in ──
                      if (isToday && myEntry) {
                        if (myCheckin) {
                          const t = new Date(myCheckin.checked_in_at).toLocaleTimeString("id-ID", { hour:"2-digit", minute:"2-digit", timeZone:"Asia/Jakarta" });
                          return (
                            <div style={{ background:"rgba(240,253,244,0.9)",border:"1.5px solid rgba(16,185,129,0.4)",borderRadius:12,padding:"12px 16px",textAlign:"center" }}>
                              <p style={{ fontSize:13,fontWeight:800,color:"#059669",marginBottom:2 }}>✅ Sudah Check-in</p>
                              <p style={{ fontSize:11,color:"#6ee7b7",fontWeight:500 }}>Pukul {t} WIB</p>
                            </div>
                          );
                        }
                        return (
                          <button
                            onClick={()=>handleCheckin(event)}
                            disabled={isCheckinLoading}
                            style={{ width:"100%",padding:"12px",borderRadius:12,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#059669,#10b981)",color:"#fff",fontSize:13,fontWeight:800,letterSpacing:0.3,boxShadow:"0 4px 16px rgba(16,185,129,0.4)",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
                            {isCheckinLoading ? "Check-in..." : "✅ Check-in Sekarang"}
                          </button>
                        );
                      }

                      // ── HARI H tapi belum daftar ──
                      if (isToday && !myEntry) {
                        return (
                          <div style={{ background:"rgba(255,247,237,0.9)",border:"1px solid rgba(251,191,36,0.4)",borderRadius:12,padding:"10px 14px",textAlign:"center" }}>
                            <p style={{ fontSize:12,color:"#b45309",fontWeight:600 }}>⚠️ Kamu belum terdaftar di event ini</p>
                          </div>
                        );
                      }

                      // ── Event mendatang: daftar/sudah daftar ──
                      if (myEntry) return (
                        <div style={{ textAlign:"center",padding:"6px 0 2px" }}>
                          <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(16,185,129,0.08)",border:"1.5px solid rgba(16,185,129,0.25)",borderRadius:10,padding:"9px 18px" }}>
                            <span>✅</span><span style={{ fontSize:12,fontWeight:700,color:"#059669" }}>Kamu sudah terdaftar</span>
                          </div>
                        </div>
                      );
                      if (isFull) return (
                        <div style={{ textAlign:"center",padding:"6px 0 2px" }}>
                          <div style={{ display:"inline-flex",alignItems:"center",gap:6,background:"rgba(239,68,68,0.08)",border:"1.5px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"9px 18px" }}>
                            <span>🔒</span><span style={{ fontSize:12,fontWeight:700,color:"#ef4444" }}>Slot Penuh</span>
                          </div>
                        </div>
                      );
                      return (
                        <div>
                          <div style={{ background:"rgba(238,244,255,0.6)",border:"1px solid rgba(209,221,247,0.7)",borderRadius:10,padding:"8px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:10 }}>
                            <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,var(--blue-3),var(--blue-1))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                              <span style={{ color:"#fff",fontSize:13,fontWeight:800 }}>{currentUser.name.charAt(0)}</span>
                            </div>
                            <div>
                              <p style={{ fontSize:12,fontWeight:700,color:"var(--dark)",lineHeight:1.2 }}>{currentUser.name}</p>
                              <p style={{ fontSize:10,color:"var(--muted)" }}>{[currentUser.jabatan, currentUser.posisi].filter(Boolean).join(" · ") || "Staff"}</p>
                            </div>
                          </div>
                          <button onClick={()=>handleJoin(event)} className="btn btn-primary" style={{ width:"100%",fontSize:12,padding:"9px" }} disabled={loading}>
                            {loading ? "Mendaftar..." : "+ Daftar ke Event"}
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
        <footer style={{ textAlign:"center",padding:"24px 0 16px",color:"var(--muted)",fontSize:11,opacity:0.4,position:"relative",zIndex:1 }}>Created by GG & Caramolly</footer>
      </div>
    </>
  );
}
