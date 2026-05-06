import { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG, STAFF_PASSWORD } from "../../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const ROLES = ["Staff","Fotografer","Videografer","MC","Dekorasi","Katering","Musik","Koordinator","Lainnya"];

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday:"long", year:"numeric", month:"long", day:"numeric"
  });
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
      <div className="float-shape-1" style={{ position:"fixed",top:90,left:36,zIndex:0,pointerEvents:"none",opacity:0.08 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="55" stroke="#1e60d5" strokeWidth="1.4" strokeDasharray="9 7" className="ring-spin"/>
          <circle cx="60" cy="60" r="37" stroke="#4080f0" strokeWidth="0.8" strokeDasharray="4 9" className="ring-spin-rev"/>
        </svg>
      </div>
      <div className="float-shape-2" style={{ position:"fixed",bottom:120,right:48,zIndex:0,pointerEvents:"none",opacity:0.07 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" fill="none">
          <circle cx="70" cy="70" r="64" stroke="#1535a0" strokeWidth="1.2" strokeDasharray="10 8" className="ring-spin-rev"/>
          <circle cx="70" cy="70" r="44" stroke="#4080f0" strokeWidth="0.8" strokeDasharray="6 10" className="ring-spin"/>
        </svg>
      </div>
      <div style={{ position:"fixed",top:0,left:0,zIndex:0,pointerEvents:"none",opacity:0.1 }}>
        <svg width="180" height="180"><path d="M0 90 L90 0" stroke="#1e60d5" strokeWidth="1"/><path d="M0 150 L150 0" stroke="#1e60d5" strokeWidth="0.4"/></svg>
      </div>
      <div style={{ position:"fixed",bottom:0,right:0,zIndex:0,pointerEvents:"none",opacity:0.1,transform:"rotate(180deg)" }}>
        <svg width="180" height="180"><path d="M0 90 L90 0" stroke="#1e60d5" strokeWidth="1"/><path d="M0 150 L150 0" stroke="#1e60d5" strokeWidth="0.4"/></svg>
      </div>
    </>
  );
}

export default function StaffPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [staffPwd, setStaffPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [events, setEvents] = useState([]);
  const [staffMap, setStaffMap] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");
  const { businessName } = CALENDAR_CONFIG;
  const today = new Date(); today.setHours(0,0,0,0);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem("staff_auth") === "true") {
      setIsLoggedIn(true);
      fetchAll();
    }
  }, []);

  function handleStaffLogin(e) {
    e.preventDefault();
    if (staffPwd === STAFF_PASSWORD) {
      sessionStorage.setItem("staff_auth", "true");
      setIsLoggedIn(true);
      fetchAll();
    } else {
      setPwdError("Password salah");
    }
  }

  async function fetchAll() {
    const [evRes, stRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/staff"),
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
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (!selectedEvent) return;
    setError(""); setLoading(true);
    const res = await fetch("/api/staff", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ event_id:selectedEvent.id, name, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) return setError(data.error);
    setStaffMap(prev => ({
      ...prev,
      [selectedEvent.id]: [...(prev[selectedEvent.id]||[]), data],
    }));
    setSuccess(`✅ ${name} berhasil terdaftar!`);
    setName(""); setRole("Staff");
    setTimeout(() => setSuccess(""), 3000);
  }

  async function handleLeave(staffId, eventId) {
    if (!confirm("Hapus dirimu dari event ini?")) return;
    const res = await fetch(`/api/staff?id=${staffId}`, { method:"DELETE" });
    if (res.ok) {
      setStaffMap(prev => ({
        ...prev,
        [eventId]: (prev[eventId]||[]).filter(s => s.id !== staffId),
      }));
    }
  }

  const upcomingEvents = events.filter(e => new Date(e.date) >= today);
  const displayEvents = activeTab === "upcoming" ? upcomingEvents : events;
  const totalStaff = Object.values(staffMap).flat().length;

  if (!isLoggedIn) return (
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
        <div className="ring-spin" style={{ position:"absolute",top:"8%",left:"4%",width:280,height:280,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.05)",pointerEvents:"none",transformOrigin:"center" }}/>
        <div className="ring-spin-rev" style={{ position:"absolute",bottom:"10%",right:"5%",width:220,height:220,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.06)",pointerEvents:"none",transformOrigin:"center" }}/>

        <div className={mounted?"scale-in":""} style={{ background:"rgba(255,255,255,0.97)",width:"100%",maxWidth:420,borderRadius:24,overflow:"hidden",boxShadow:"0 32px 80px rgba(10,22,40,0.5)",position:"relative",zIndex:1 }}>
          <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"40px 40px 32px",textAlign:"center",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none" }}/>
            <div style={{ position:"absolute",top:-30,right:-20,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none" }}/>
            <div style={{ width:68,height:68,borderRadius:18,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px",padding:8,overflow:"hidden",position:"relative",zIndex:1 }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <h1 style={{ color:"#fff",fontSize:26,fontWeight:800,letterSpacing:-0.5,position:"relative",zIndex:1 }}>{businessName}</h1>
            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,letterSpacing:3,marginTop:6,textTransform:"uppercase",fontWeight:600,position:"relative",zIndex:1 }}>Staff Portal</p>
          </div>
          <form onSubmit={handleStaffLogin} style={{ padding:"36px 40px" }}>
            {pwdError && <div style={{ background:"#fff0f0",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:12,marginBottom:20,fontSize:13,fontWeight:500 }}>⚠️ {pwdError}</div>}
            <div style={{ marginBottom:20 }}>
              <label className="label">Password Staff</label>
              <input type="password" value={staffPwd} onChange={e=>setStaffPwd(e.target.value)}
                placeholder="Masukkan password..." className="input" required autoFocus/>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:"100%",padding:"13px",fontSize:14 }}>
              Masuk ke Staff Portal
            </button>
            <div style={{ marginTop:20,textAlign:"center" }}>
              <Link href="/" style={{ fontSize:12,color:"var(--muted)",textDecoration:"none",fontWeight:500 }}>← Kembali ke Kalender</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Head>
        <title>Staff — {businessName}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <link rel="icon" href="/favicon.ico"/>
      </Head>

      <div style={{ minHeight:"100vh",position:"relative",overflow:"hidden" }}>
        <BgDecor/>

        <header style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",padding:"0 40px",height:68,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 4px 32px rgba(10,22,40,0.4)",position:"sticky",top:0,zIndex:100 }}>
          <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"20px 20px",pointerEvents:"none" }}/>
          <div style={{ display:"flex",alignItems:"center",gap:14,position:"relative" }}>
            <div style={{ width:40,height:40,borderRadius:12,background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",padding:5,border:"1.5px solid rgba(255,255,255,0.2)" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <div>
              <span style={{ color:"#fff",fontSize:17,fontWeight:800,letterSpacing:-0.5,display:"block",lineHeight:1.1 }}>{businessName}</span>
              <span style={{ color:"rgba(255,255,255,0.45)",fontSize:9,letterSpacing:2.5,textTransform:"uppercase",fontWeight:600 }}>Staff Portal</span>
            </div>
          </div>
          <div style={{ display:"flex",gap:10,position:"relative" }}>
            <Link href="/" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px" }}>Kalender</Link>
            <Link href="/admin" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px" }}>Admin</Link>
          </div>
        </header>

        <main style={{ maxWidth:1100,margin:"0 auto",padding:"36px 20px",position:"relative",zIndex:1 }}>

          <div className={mounted?"fade-up":""} style={{ background:"linear-gradient(135deg,var(--navy) 0%,var(--blue-1) 100%)",borderRadius:24,padding:"36px 44px",marginBottom:28,boxShadow:"0 16px 48px rgba(10,22,40,0.25)",position:"relative",overflow:"hidden" }}>
            <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)",backgroundSize:"28px 28px",pointerEvents:"none" }}/>
            <div style={{ position:"absolute",top:-50,right:-30,width:200,height:200,borderRadius:"50%",background:"rgba(64,128,240,0.2)",filter:"blur(40px)",pointerEvents:"none" }}/>
            <div className="ring-spin" style={{ position:"absolute",top:-20,right:40,width:160,height:160,borderRadius:"50%",border:"1px solid rgba(255,255,255,0.07)",pointerEvents:"none",transformOrigin:"center" }}/>

            <img src="/logo.png" alt="" aria-hidden="true" style={{ position:"absolute",right:20,bottom:0,width:180,height:180,objectFit:"contain",opacity:0.07,pointerEvents:"none",filter:"brightness(0) invert(1)",zIndex:0 }}/>

            <div style={{ position:"relative",zIndex:1,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:20 }}>
              <div>
                <p style={{ color:"rgba(255,255,255,0.4)",fontSize:10,fontWeight:700,letterSpacing:3.5,textTransform:"uppercase",marginBottom:10,display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ display:"inline-block",width:28,height:1,background:"rgba(255,255,255,0.25)" }}/>Staff Portal
                </p>
                <h2 style={{ color:"#fff",fontSize:28,fontWeight:800,letterSpacing:-1,marginBottom:8,lineHeight:1.1 }}>Daftar & Kelola Tim Event</h2>
                <p style={{ color:"rgba(255,255,255,0.5)",fontSize:13,lineHeight:1.7,maxWidth:400 }}>Pilih event lalu daftarkan namamu.</p>
              </div>
              <div style={{ display:"flex",gap:14,flexWrap:"wrap" }}>
                {[
                  { label:"Total Event", value:events.length, icon:"📅" },
                  { label:"Mendatang",   value:upcomingEvents.length, icon:"🗓️" },
                  { label:"Total Staff", value:totalStaff, icon:"👥" },
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

          <div style={{ display:"flex",gap:8,marginBottom:20 }}>
            {[
              { key:"upcoming", label:"Event Mendatang", count:upcomingEvents.length },
              { key:"all",      label:"Semua Event",     count:events.length },
            ].map(({key,label,count})=>(
              <button key={key} onClick={()=>setActiveTab(key)}
                style={{ padding:"8px 18px",borderRadius:12,fontWeight:700,fontSize:13,cursor:"pointer",transition:"all 0.2s",border:"1.5px solid",
                  borderColor: activeTab===key?"var(--blue-2)":"var(--border)",
                  background:  activeTab===key?"linear-gradient(135deg,var(--blue-3),var(--blue-1))":"rgba(255,255,255,0.8)",
                  color:       activeTab===key?"#fff":"var(--muted)",
                  boxShadow:   activeTab===key?"0 4px 16px rgba(30,96,213,0.3)":"none",
                }}>
                {label} <span style={{ background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"1px 8px",fontSize:11,marginLeft:4 }}>{count}</span>
              </button>
            ))}
          </div>

          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:20,alignItems:"start" }}>
            {displayEvents.length === 0 && (
              <div style={{ gridColumn:"1/-1",textAlign:"center",padding:"48px 0",color:"var(--muted)" }}>
                <p style={{ fontSize:32,marginBottom:12 }}>📅</p>
                <p style={{ fontWeight:600,fontSize:14 }}>Tidak ada event {activeTab==="upcoming"?"mendatang":""}</p>
              </div>
            )}

            {[...displayEvents].sort((a,b)=>a.date.localeCompare(b.date)).map(event => {
              const staffList = staffMap[event.id] || [];
              const isPast = new Date(event.date) < today;
              const isOpen = selectedEvent?.id === event.id;

              return (
                <div key={event.id} className={mounted?"card fade-up":"card"} style={{ overflow:"hidden",boxShadow:"var(--shadow)",opacity:isPast?0.8:1,transition:"transform 0.2s,box-shadow 0.2s" }}
                  onMouseEnter={e=>{if(!isPast){e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="var(--shadow-lg)";}}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="var(--shadow)";}}
                >

                  <div style={{ background:isPast?"linear-gradient(135deg,#374151,#6b7280)":"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"18px 20px",position:"relative",overflow:"hidden" }}>
                    <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"16px 16px",pointerEvents:"none" }}/>
                    <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:10,position:"relative",zIndex:1 }}>
                      <div style={{ minWidth:0,flex:1 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6,flexWrap:"wrap" }}>
                          <span style={{ fontSize:10,background:"rgba(255,255,255,0.15)",color:"#fff",padding:"2px 8px",borderRadius:10,fontWeight:700 }}>
                            {event.event_type==="wedding"?"💍 Wedding":"🎉 Event"}
                          </span>
                          {isPast && <span style={{ fontSize:10,background:"rgba(0,0,0,0.25)",color:"rgba(255,255,255,0.6)",padding:"2px 8px",borderRadius:10,fontWeight:600 }}>Selesai</span>}
                        </div>
                        <h3 style={{ color:"#fff",fontSize:15,fontWeight:800,letterSpacing:-0.3,marginBottom:4,lineHeight:1.2 }}>{event.couple}</h3>
                        <p style={{ color:"rgba(255,255,255,0.55)",fontSize:11,fontWeight:500 }}>📅 {formatDate(event.date)}</p>
                        {event.venue&&<p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,marginTop:2 }}>📍 {event.venue}</p>}
                        {event.time&&<p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,marginTop:2 }}>🕐 {event.time}</p>}
                        {event.addon&&<p style={{ color:"rgba(255,255,255,0.4)",fontSize:11,marginTop:2 }}>✨ {event.addon}</p>}
                      </div>
    
                      <div style={{ background:"rgba(255,255,255,0.12)",backdropFilter:"blur(8px)",borderRadius:12,padding:"8px 12px",textAlign:"center",flexShrink:0,border:"1px solid rgba(255,255,255,0.18)",minWidth:52 }}>
                        <div style={{ color:"#fff",fontSize:22,fontWeight:800,lineHeight:1 }}>{staffList.length}</div>
                        <div style={{ color:"rgba(255,255,255,0.55)",fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:0.8,marginTop:2 }}>Staff</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ padding:"14px 18px" }}>
                    {staffList.length > 0 && (
                      <div style={{ marginBottom:12 }}>
                        <p style={{ fontSize:10,fontWeight:700,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:8 }}>
                          Tim ({staffList.length})
                        </p>
                        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                          {staffList.map(s=>(
                            <div key={s.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 10px",borderRadius:10,background:"rgba(238,244,255,0.6)",border:"1px solid rgba(209,221,247,0.5)",transition:"background 0.15s" }}
                              onMouseEnter={e=>e.currentTarget.style.background="rgba(219,234,255,0.8)"}
                              onMouseLeave={e=>e.currentTarget.style.background="rgba(238,244,255,0.6)"}
                            >
                              <div style={{ display:"flex",alignItems:"center",gap:8,minWidth:0 }}>
                                <div style={{ width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,var(--blue-3),var(--blue-1))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                  <span style={{ color:"#fff",fontSize:11,fontWeight:800 }}>{s.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div style={{ minWidth:0 }}>
                                  <p style={{ fontSize:12,fontWeight:700,color:"var(--dark)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{s.name}</p>
                                  <p style={{ fontSize:10,color:"var(--muted)",fontWeight:500 }}>{s.role}</p>
                                </div>
                              </div>
                              {!isPast&&(
                                <button onClick={()=>handleLeave(s.id,event.id)}
                                  style={{ background:"transparent",border:"none",cursor:"pointer",color:"#ef4444",fontSize:14,padding:"2px 6px",borderRadius:6,transition:"all 0.15s",flexShrink:0,lineHeight:1 }}
                                  onMouseEnter={e=>{e.currentTarget.style.background="#fff0f0";}}
                                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}
                                  title="Keluar dari event"
                                >✕</button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {staffList.length === 0 && (
                      <p style={{ fontSize:12,color:"var(--muted)",fontStyle:"italic",textAlign:"center",padding:"10px 0 12px",fontWeight:400 }}>
                        Belum ada staff terdaftar
                      </p>
                    )}

                    {!isPast && (
                      !isOpen ? (
                        <button onClick={()=>{setSelectedEvent(event);setError("");setSuccess("");setName("");setRole("Staff");}}
                          className="btn btn-primary" style={{ width:"100%",fontSize:12,padding:"9px" }}>
                          + Daftarkan Diri
                        </button>
                      ) : (
                        <div style={{ borderTop:"1px solid var(--border)",paddingTop:12,marginTop:4 }}>
                          <p style={{ fontSize:11,fontWeight:700,color:"var(--blue-1)",marginBottom:10,textTransform:"uppercase",letterSpacing:0.8 }}>Daftarkan Diri</p>
                          {error&&<div style={{ background:"#fff0f0",color:"#dc2626",padding:"6px 10px",borderRadius:8,marginBottom:8,fontSize:11,fontWeight:600,border:"1px solid #fecaca" }}>⚠️ {error}</div>}
                          {success&&<div style={{ background:"#f0fdf4",color:"#15803d",padding:"6px 10px",borderRadius:8,marginBottom:8,fontSize:11,fontWeight:600,border:"1px solid #86efac" }}>{success}</div>}
                          <form onSubmit={handleJoin}>
                            <div style={{ marginBottom:8 }}>
                              <label className="label">Nama Kamu</label>
                              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Masukkan namamu..." className="input" style={{ fontSize:13,padding:"8px 12px" }} required autoFocus/>
                            </div>
                            <div style={{ marginBottom:10 }}>
                              <label className="label">Posisi / Role</label>
                              <select value={role} onChange={e=>setRole(e.target.value)} className="input" style={{ fontSize:13,padding:"8px 12px",cursor:"pointer" }}>
                                {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div style={{ display:"flex",gap:8 }}>
                              <button type="submit" className="btn btn-primary" style={{ flex:1,fontSize:12,padding:"8px" }} disabled={loading}>
                                {loading?"Mendaftar...":"✓ Daftar"}
                              </button>
                              <button type="button" onClick={()=>setSelectedEvent(null)} className="btn btn-outline" style={{ flex:1,fontSize:12,padding:"8px" }}>
                                Batal
                              </button>
                            </div>
                          </form>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </main>

        <footer style={{ textAlign:"center",padding:"24px 0 16px",color:"var(--muted)",fontSize:11,opacity:0.4,position:"relative",zIndex:1 }}>
          Created by GG & Caramolly
        </footer>
      </div>
    </>
  );
}
