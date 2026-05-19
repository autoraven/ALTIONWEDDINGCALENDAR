// pages/admin/performance.js
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../../lib/config";
import { ADMIN_CREDENTIALS } from "../../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function formatTime(ts) {
  if (!ts) return "-";
  return new Date(ts).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta"
  }) + " WIB";
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

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:18,padding:"20px 24px",border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",display:"flex",alignItems:"center",gap:16 }}>
      <div style={{ width:48,height:48,borderRadius:14,background:`linear-gradient(135deg,${color}22,${color}44)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,border:`1px solid ${color}33` }}>{icon}</div>
      <div>
        <p style={{ fontSize:11,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2 }}>{label}</p>
        <p style={{ fontSize:28,fontWeight:800,color:"var(--dark)",letterSpacing:-1,lineHeight:1 }}>{value}</p>
        {sub && <p style={{ fontSize:11,color:"var(--muted)",marginTop:3 }}>{sub}</p>}
      </div>
    </div>
  );
}

function Medal({ rank }) {
  if (rank === 1) return <span style={{ fontSize:20 }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize:20 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize:20 }}>🥉</span>;
  return <span style={{ width:24,height:24,borderRadius:"50%",background:"rgba(0,0,0,0.06)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"var(--muted)" }}>{rank}</span>;
}

export default function PerformancePage() {
  const [authed, setAuthed] = useState(false);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [loginErr, setLoginErr] = useState("");
  const [mounted, setMounted] = useState(false);

  // Data
  const [staffUsers, setStaffUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [staffMap, setStaffMap] = useState({});   // event_id -> [staff]
  const [checkins, setCheckins] = useState([]);    // all checkin records

  const [loading, setLoading] = useState(false);

  // Filters
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth());
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState("leaderboard"); // leaderboard | detail | checkin_log
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [deletingCheckin, setDeletingCheckin] = useState(null);

  const { businessName } = CALENDAR_CONFIG;

  useEffect(() => {
    setMounted(true);
    const s = sessionStorage.getItem("admin_authed");
    if (s === "1") { setAuthed(true); fetchAll(); }
  }, []);

  function handleLogin(e) {
    e.preventDefault();
    if (adminUser === ADMIN_CREDENTIALS.username && adminPass === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem("admin_authed", "1");
      setAuthed(true);
      fetchAll();
    } else {
      setLoginErr("Username atau password salah");
    }
  }

  async function fetchAll() {
    setLoading(true);
    const [uRes, eRes, stRes, ciRes] = await Promise.all([
      fetch("/api/staff-users"),
      fetch("/api/events"),
      fetch("/api/staff"),
      fetch("/api/checkin"),
    ]);
    const [uData, eData, stData, ciData] = await Promise.all([
      uRes.json(), eRes.json(), stRes.json(), ciRes.json()
    ]);
    if (Array.isArray(uData)) setStaffUsers(uData);
    if (Array.isArray(eData)) setEvents(eData);
    if (Array.isArray(stData)) {
      const map = {};
      stData.forEach(s => {
        if (!map[s.event_id]) map[s.event_id] = [];
        map[s.event_id].push(s);
      });
      setStaffMap(map);
    }
    if (Array.isArray(ciData)) setCheckins(ciData);
    setLoading(false);
  }

  async function handleDeleteCheckin(checkinId) {
    if (!confirm("Hapus data check-in ini?")) return;
    setDeletingCheckin(checkinId);
    await fetch(`/api/checkin?id=${checkinId}`, { method: "DELETE" });
    setCheckins(prev => prev.filter(c => c.id !== checkinId));
    setDeletingCheckin(null);
  }

  // ── Filter events by selected month/year ────────────────────────────────────
  const filteredEvents = events.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
  });

  // ── Build performance data per staff ────────────────────────────────────────
  const perfData = staffUsers.filter(u => u.is_active).map(user => {
    // Event yang diikuti user (match by name)
    const joinedEvents = filteredEvents.filter(ev => {
      const list = staffMap[ev.id] || [];
      return list.some(s => s.name.toLowerCase() === user.name.toLowerCase());
    });

    // Check-in yang dilakukan user di bulan ini
    const userCheckins = checkins.filter(c => {
      if (c.staff_user_id !== user.id) return false;
      const d = new Date(c.checked_in_at);
      return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
    });

    const checkinRate = joinedEvents.length > 0
      ? Math.round((userCheckins.length / joinedEvents.length) * 100)
      : 0;

    return {
      user,
      joinedCount: joinedEvents.length,
      checkinCount: userCheckins.length,
      checkinRate,
      joinedEvents,
      userCheckins,
    };
  }).sort((a, b) => {
    if (b.checkinCount !== a.checkinCount) return b.checkinCount - a.checkinCount;
    if (b.joinedCount !== a.joinedCount) return b.joinedCount - a.joinedCount;
    return a.user.name.localeCompare(b.user.name);
  });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalJoins = perfData.reduce((s, p) => s + p.joinedCount, 0);
  const totalCheckins = perfData.reduce((s, p) => s + p.checkinCount, 0);
  const avgRate = perfData.length > 0
    ? Math.round(perfData.reduce((s, p) => s + p.checkinRate, 0) / perfData.length)
    : 0;

  // ── All checkins in this month for log ─────────────────────────────────────
  const monthCheckins = checkins.filter(c => {
    const d = new Date(c.checked_in_at);
    return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
  }).sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));

  // ── Available years ────────────────────────────────────────────────────────
  const years = [...new Set(events.map(e => new Date(e.date).getFullYear()))].sort((a,b)=>b-a);
  if (!years.includes(filterYear)) years.push(filterYear);

  // ─── Login ─────────────────────────────────────────────────────────────────
  if (!authed) return (
    <>
      <Head><title>Admin Performance — {businessName}</title></Head>
      <div style={{ minHeight:"100vh",background:"linear-gradient(135deg,var(--navy) 0%,var(--navy-mid) 50%,var(--blue-1) 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden" }}>
        <div style={{ background:"rgba(255,255,255,0.97)",width:"100%",maxWidth:400,borderRadius:24,overflow:"hidden",boxShadow:"0 32px 80px rgba(10,22,40,0.5)" }}>
          <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",padding:"36px 36px 28px",textAlign:"center" }}>
            <div style={{ width:56,height:56,borderRadius:16,background:"rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",padding:8,overflow:"hidden" }}>
              <img src="/logo.png" alt="Logo" style={{ width:"100%",height:"100%",objectFit:"contain" }}/>
            </div>
            <h1 style={{ color:"#fff",fontSize:22,fontWeight:800 }}>{businessName}</h1>
            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:11,letterSpacing:3,marginTop:6,textTransform:"uppercase",fontWeight:600 }}>Admin · Performa Staff</p>
          </div>
          <form onSubmit={handleLogin} style={{ padding:"32px 36px" }}>
            {loginErr && <div style={{ background:"#fff0f0",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 14px",borderRadius:12,marginBottom:16,fontSize:13 }}>⚠️ {loginErr}</div>}
            <div style={{ marginBottom:14 }}>
              <label className="label">Username Admin</label>
              <input type="text" value={adminUser} onChange={e=>setAdminUser(e.target.value)} className="input" required autoFocus autoCapitalize="none"/>
            </div>
            <div style={{ marginBottom:20 }}>
              <label className="label">Password</label>
              <input type="password" value={adminPass} onChange={e=>setAdminPass(e.target.value)} className="input" required/>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:"100%",padding:"13px" }}>Masuk</button>
            <div style={{ marginTop:16,textAlign:"center" }}>
              <Link href="/admin/iindex" style={{ fontSize:12,color:"var(--muted)",textDecoration:"none" }}>← Kembali ke Admin Panel</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  // ─── Main Dashboard ────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>Performa Staff — {businessName}</title>
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
              <span style={{ color:"rgba(255,255,255,0.45)",fontSize:9,letterSpacing:2.5,textTransform:"uppercase",fontWeight:600 }}>Performa & Absensi Staff</span>
            </div>
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <Link href="/admin/iindex" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px" }}>← Admin Panel</Link>
            <Link href="/" className="btn btn-ghost" style={{ fontSize:12,padding:"8px 18px" }}>Kalender</Link>
          </div>
        </header>

        <main style={{ maxWidth:1200,margin:"0 auto",padding:"32px 20px",position:"relative",zIndex:1 }}>

          {/* Filter Bar */}
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:24,flexWrap:"wrap" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,0.9)",backdropFilter:"blur(8px)",border:"1.5px solid var(--border)",borderRadius:14,padding:"8px 16px" }}>
              <span style={{ fontSize:14 }}>📅</span>
              <select value={filterMonth} onChange={e=>setFilterMonth(+e.target.value)} style={{ border:"none",background:"transparent",fontSize:13,fontWeight:700,color:"var(--dark)",cursor:"pointer",outline:"none" }}>
                {MONTHS.map((m,i)=><option key={i} value={i}>{m}</option>)}
              </select>
              <select value={filterYear} onChange={e=>setFilterYear(+e.target.value)} style={{ border:"none",background:"transparent",fontSize:13,fontWeight:700,color:"var(--dark)",cursor:"pointer",outline:"none" }}>
                {years.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <button onClick={fetchAll} style={{ background:"rgba(255,255,255,0.9)",border:"1.5px solid var(--border)",borderRadius:12,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",color:"var(--dark)" }}>
              🔄 Refresh
            </button>
            {loading && <span style={{ fontSize:12,color:"var(--muted)" }}>Memuat data...</span>}
          </div>

          {/* Stat Cards */}
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:28 }}>
            <StatCard icon="📅" label="Event Bulan Ini" value={filteredEvents.length} sub={`${MONTHS[filterMonth]} ${filterYear}`} color="#1e60d5"/>
            <StatCard icon="👥" label="Staff Aktif" value={staffUsers.filter(u=>u.is_active).length} sub="total terdaftar" color="#7c3aed"/>
            <StatCard icon="📋" label="Total Pendaftaran" value={totalJoins} sub="event diikuti" color="#0891b2"/>
            <StatCard icon="✅" label="Total Check-in" value={totalCheckins} sub={`rata-rata ${avgRate}%`} color="#059669"/>
          </div>

          {/* Tab Nav */}
          <div style={{ display:"flex",gap:6,background:"rgba(255,255,255,0.85)",border:"1.5px solid var(--border)",borderRadius:16,padding:5,backdropFilter:"blur(8px)",marginBottom:24,width:"fit-content" }}>
            {[
              { key:"leaderboard", label:"🏆 Leaderboard" },
              { key:"detail", label:"📊 Detail Staff" },
              { key:"checkin_log", label:"🕐 Log Check-in" },
            ].map(({key,label})=>(
              <button key={key} onClick={()=>{ setActiveTab(key); setSelectedStaff(null); }}
                style={{ padding:"8px 20px",borderRadius:12,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all 0.18s",border:"none",background:activeTab===key?"linear-gradient(135deg,var(--blue-3),var(--blue-1))":"transparent",color:activeTab===key?"#fff":"var(--muted)",boxShadow:activeTab===key?"0 2px 10px rgba(30,96,213,0.25)":"none" }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── LEADERBOARD ─────────────────────────────────────────────────────── */}
          {activeTab === "leaderboard" && (
            <div>
              <h2 style={{ fontSize:18,fontWeight:800,color:"var(--dark)",marginBottom:16,letterSpacing:-0.5 }}>
                🏆 Leaderboard — {MONTHS[filterMonth]} {filterYear}
              </h2>
              {perfData.length === 0 ? (
                <div style={{ textAlign:"center",padding:"48px 0",color:"var(--muted)" }}>
                  <p style={{ fontSize:32 }}>📊</p>
                  <p style={{ fontWeight:700,marginTop:8 }}>Belum ada data untuk periode ini</p>
                </div>
              ) : (
                <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                  {perfData.map((p, idx) => (
                    <div key={p.user.id} onClick={()=>{ setSelectedStaff(p); setActiveTab("detail"); }}
                      style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:16,padding:"16px 20px",border:idx===0?"2px solid rgba(251,191,36,0.5)":idx===1?"2px solid rgba(192,192,192,0.5)":idx===2?"2px solid rgba(205,127,50,0.5)":"1.5px solid var(--border)",boxShadow:"var(--shadow)",cursor:"pointer",transition:"transform 0.15s,box-shadow 0.15s",display:"flex",alignItems:"center",gap:16 }}
                      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="var(--shadow-lg)";}}
                      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="var(--shadow)";}}>
                      <div style={{ width:36,textAlign:"center",flexShrink:0 }}><Medal rank={idx+1}/></div>
                      <div style={{ width:42,height:42,borderRadius:12,background:"linear-gradient(135deg,var(--blue-3),var(--blue-1))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <span style={{ color:"#fff",fontSize:16,fontWeight:800 }}>{p.user.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <p style={{ fontSize:14,fontWeight:800,color:"var(--dark)",marginBottom:2 }}>{p.user.name}</p>
                        <p style={{ fontSize:11,color:"var(--muted)",fontWeight:500 }}>{[p.user.jabatan,p.user.posisi].filter(Boolean).join(" · ") || "Staff"}</p>
                      </div>
                      <div style={{ display:"flex",gap:20,flexShrink:0,flexWrap:"wrap" }}>
                        <div style={{ textAlign:"center" }}>
                          <p style={{ fontSize:20,fontWeight:800,color:"var(--blue-1)",lineHeight:1 }}>{p.joinedCount}</p>
                          <p style={{ fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8 }}>Daftar</p>
                        </div>
                        <div style={{ textAlign:"center" }}>
                          <p style={{ fontSize:20,fontWeight:800,color:"#059669",lineHeight:1 }}>{p.checkinCount}</p>
                          <p style={{ fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8 }}>Check-in</p>
                        </div>
                        <div style={{ textAlign:"center",minWidth:56 }}>
                          <div style={{ position:"relative",width:52,height:52,flexShrink:0,margin:"0 auto" }}>
                            <svg width="52" height="52" style={{ transform:"rotate(-90deg)" }}>
                              <circle cx="26" cy="26" r="21" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="5"/>
                              <circle cx="26" cy="26" r="21" fill="none"
                                stroke={p.checkinRate>=80?"#059669":p.checkinRate>=50?"#f59e0b":"#ef4444"}
                                strokeWidth="5"
                                strokeDasharray={`${(p.checkinRate/100)*131.9} 131.9`}
                                strokeLinecap="round"/>
                            </svg>
                            <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                              <span style={{ fontSize:11,fontWeight:800,color:p.checkinRate>=80?"#059669":p.checkinRate>=50?"#f59e0b":"#ef4444" }}>{p.checkinRate}%</span>
                            </div>
                          </div>
                          <p style={{ fontSize:9,color:"var(--muted)",fontWeight:700,textTransform:"uppercase",letterSpacing:0.8,marginTop:2 }}>Rate</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── DETAIL STAFF ─────────────────────────────────────────────────────── */}
          {activeTab === "detail" && (
            <div>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20,flexWrap:"wrap" }}>
                <h2 style={{ fontSize:18,fontWeight:800,color:"var(--dark)",letterSpacing:-0.5,flex:1 }}>
                  📊 Detail Performa Staff — {MONTHS[filterMonth]} {filterYear}
                </h2>
                <select value={selectedStaff?.user?.id || ""} onChange={e=>{
                  const found = perfData.find(p=>p.user.id===e.target.value);
                  setSelectedStaff(found || null);
                }} style={{ border:"1.5px solid var(--border)",borderRadius:12,padding:"8px 14px",fontSize:13,fontWeight:600,color:"var(--dark)",background:"rgba(255,255,255,0.9)",cursor:"pointer",outline:"none" }}>
                  <option value="">— Pilih Staff —</option>
                  {perfData.map(p=><option key={p.user.id} value={p.user.id}>{p.user.name}</option>)}
                </select>
              </div>

              {!selectedStaff ? (
                // Summary table all staff
                <div style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:18,border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",overflow:"auto" }}>
                  <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                    <thead>
                      <tr style={{ background:"rgba(238,244,255,0.8)" }}>
                        {["#","Nama","Jabatan","Daftar","Check-in","Rate","Aksi"].map(h=>(
                          <th key={h} style={{ padding:"12px 16px",textAlign:"left",fontWeight:700,color:"var(--muted)",fontSize:10,textTransform:"uppercase",letterSpacing:1,borderBottom:"1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {perfData.map((p,i)=>(
                        <tr key={p.user.id} style={{ borderBottom:"1px solid var(--border)",transition:"background 0.15s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(238,244,255,0.5)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"12px 16px",fontWeight:800,color:"var(--muted)" }}><Medal rank={i+1}/></td>
                          <td style={{ padding:"12px 16px" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                              <div style={{ width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,var(--blue-3),var(--blue-1))",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                <span style={{ color:"#fff",fontSize:12,fontWeight:800 }}>{p.user.name.charAt(0)}</span>
                              </div>
                              <span style={{ fontWeight:700,color:"var(--dark)" }}>{p.user.name}</span>
                            </div>
                          </td>
                          <td style={{ padding:"12px 16px",color:"var(--muted)",fontSize:12 }}>{[p.user.jabatan,p.user.posisi].filter(Boolean).join(" · ") || "-"}</td>
                          <td style={{ padding:"12px 16px",fontWeight:800,color:"var(--blue-1)",textAlign:"center" }}>{p.joinedCount}</td>
                          <td style={{ padding:"12px 16px",fontWeight:800,color:"#059669",textAlign:"center" }}>{p.checkinCount}</td>
                          <td style={{ padding:"12px 16px",textAlign:"center" }}>
                            <span style={{ background:p.checkinRate>=80?"rgba(16,185,129,0.12)":p.checkinRate>=50?"rgba(245,158,11,0.12)":"rgba(239,68,68,0.12)",color:p.checkinRate>=80?"#059669":p.checkinRate>=50?"#b45309":"#ef4444",padding:"3px 10px",borderRadius:20,fontWeight:800,fontSize:12 }}>{p.checkinRate}%</span>
                          </td>
                          <td style={{ padding:"12px 16px" }}>
                            <button onClick={()=>setSelectedStaff(p)} style={{ background:"rgba(30,96,213,0.08)",border:"1px solid rgba(30,96,213,0.2)",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,color:"var(--blue-1)",cursor:"pointer" }}>Detail</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {perfData.length === 0 && <p style={{ textAlign:"center",padding:"32px",color:"var(--muted)",fontSize:13 }}>Belum ada data untuk bulan ini</p>}
                </div>
              ) : (
                // Detail satu staff
                <div>
                  <button onClick={()=>setSelectedStaff(null)} style={{ background:"rgba(255,255,255,0.9)",border:"1.5px solid var(--border)",borderRadius:10,padding:"7px 16px",fontSize:12,fontWeight:700,cursor:"pointer",color:"var(--muted)",marginBottom:20 }}>← Kembali ke tabel</button>
                  <div style={{ background:"linear-gradient(135deg,var(--navy),var(--blue-1))",borderRadius:20,padding:"28px 32px",marginBottom:20,position:"relative",overflow:"hidden" }}>
                    <div style={{ position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap" }}>
                      <div style={{ width:64,height:64,borderRadius:18,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <span style={{ color:"#fff",fontSize:28,fontWeight:800 }}>{selectedStaff.user.name.charAt(0)}</span>
                      </div>
                      <div style={{ flex:1 }}>
                        <p style={{ color:"rgba(255,255,255,0.5)",fontSize:10,fontWeight:700,letterSpacing:2,textTransform:"uppercase" }}>Performa Staff</p>
                        <h3 style={{ color:"#fff",fontSize:22,fontWeight:800,marginTop:4,letterSpacing:-0.5 }}>{selectedStaff.user.name}</h3>
                        <p style={{ color:"rgba(255,255,255,0.5)",fontSize:12,marginTop:2 }}>{[selectedStaff.user.jabatan,selectedStaff.user.posisi].filter(Boolean).join(" · ") || "Staff"}</p>
                      </div>
                      <div style={{ display:"flex",gap:16,flexWrap:"wrap" }}>
                        {[
                          {label:"Event Daftar",value:selectedStaff.joinedCount,color:"rgba(255,255,255,0.9)"},
                          {label:"Check-in",value:selectedStaff.checkinCount,color:"#6ee7b7"},
                          {label:"Rate",value:`${selectedStaff.checkinRate}%`,color:selectedStaff.checkinRate>=80?"#6ee7b7":selectedStaff.checkinRate>=50?"#fde68a":"#fca5a5"},
                        ].map(({label,value,color})=>(
                          <div key={label} style={{ background:"rgba(255,255,255,0.1)",backdropFilter:"blur(8px)",borderRadius:14,padding:"14px 20px",textAlign:"center",border:"1px solid rgba(255,255,255,0.15)" }}>
                            <p style={{ color,fontSize:26,fontWeight:800,lineHeight:1,letterSpacing:-1 }}>{value}</p>
                            <p style={{ color:"rgba(255,255,255,0.45)",fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginTop:4 }}>{label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Event list for this staff */}
                  <div style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:18,border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",overflow:"auto" }}>
                    <div style={{ padding:"16px 20px",borderBottom:"1px solid var(--border)" }}>
                      <p style={{ fontWeight:800,fontSize:14,color:"var(--dark)" }}>Daftar Event — {MONTHS[filterMonth]} {filterYear}</p>
                    </div>
                    <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                      <thead>
                        <tr style={{ background:"rgba(238,244,255,0.6)" }}>
                          {["Event","Tanggal","Tipe","Status Daftar","Status Check-in","Jam Check-in"].map(h=>(
                            <th key={h} style={{ padding:"10px 16px",textAlign:"left",fontWeight:700,color:"var(--muted)",fontSize:10,textTransform:"uppercase",letterSpacing:0.8,borderBottom:"1px solid var(--border)" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStaff.joinedEvents.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign:"center",padding:"24px",color:"var(--muted)",fontStyle:"italic" }}>Tidak ada event di bulan ini</td></tr>
                        )}
                        {selectedStaff.joinedEvents.map(ev => {
                          const ci = selectedStaff.userCheckins.find(c => c.event_id === ev.id);
                          return (
                            <tr key={ev.id} style={{ borderBottom:"1px solid var(--border)" }}>
                              <td style={{ padding:"12px 16px",fontWeight:700,color:"var(--dark)" }}>{ev.couple}</td>
                              <td style={{ padding:"12px 16px",color:"var(--muted)",fontSize:12 }}>{formatDate(ev.date)}</td>
                              <td style={{ padding:"12px 16px" }}><span style={{ background:"rgba(238,244,255,0.8)",color:"var(--blue-1)",padding:"2px 8px",borderRadius:8,fontSize:11,fontWeight:600 }}>{ev.event_type==="wedding"?"💍 Wedding":"🎉 Event"}</span></td>
                              <td style={{ padding:"12px 16px" }}><span style={{ background:"rgba(16,185,129,0.1)",color:"#059669",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700 }}>✓ Terdaftar</span></td>
                              <td style={{ padding:"12px 16px" }}>
                                {ci
                                  ? <span style={{ background:"rgba(16,185,129,0.1)",color:"#059669",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700 }}>✅ Check-in</span>
                                  : <span style={{ background:"rgba(239,68,68,0.08)",color:"#ef4444",padding:"3px 10px",borderRadius:8,fontSize:11,fontWeight:700 }}>⛔ Tidak</span>}
                              </td>
                              <td style={{ padding:"12px 16px",color:"var(--muted)",fontSize:12 }}>{ci ? formatTime(ci.checked_in_at) : "-"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LOG CHECK-IN ─────────────────────────────────────────────────────── */}
          {activeTab === "checkin_log" && (
            <div>
              <h2 style={{ fontSize:18,fontWeight:800,color:"var(--dark)",marginBottom:16,letterSpacing:-0.5 }}>
                🕐 Log Check-in — {MONTHS[filterMonth]} {filterYear}
              </h2>
              <div style={{ background:"rgba(255,255,255,0.92)",backdropFilter:"blur(12px)",borderRadius:18,border:"1.5px solid var(--border)",boxShadow:"var(--shadow)",overflow:"auto" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:13 }}>
                  <thead>
                    <tr style={{ background:"rgba(238,244,255,0.8)" }}>
                      {["Nama Staff","Event","Tgl Event","Waktu Check-in","Hapus"].map(h=>(
                        <th key={h} style={{ padding:"12px 16px",textAlign:"left",fontWeight:700,color:"var(--muted)",fontSize:10,textTransform:"uppercase",letterSpacing:1,borderBottom:"1px solid var(--border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthCheckins.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign:"center",padding:"32px",color:"var(--muted)",fontStyle:"italic" }}>Tidak ada check-in di bulan ini</td></tr>
                    )}
                    {monthCheckins.map(ci => {
                      const ev = events.find(e => e.id === ci.event_id);
                      return (
                        <tr key={ci.id} style={{ borderBottom:"1px solid var(--border)",transition:"background 0.15s" }}
                          onMouseEnter={e=>e.currentTarget.style.background="rgba(238,244,255,0.4)"}
                          onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                          <td style={{ padding:"12px 16px" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                              <div style={{ width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#059669,#10b981)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                <span style={{ color:"#fff",fontSize:11,fontWeight:800 }}>{ci.staff_name.charAt(0)}</span>
                              </div>
                              <span style={{ fontWeight:700,color:"var(--dark)" }}>{ci.staff_name}</span>
                            </div>
                          </td>
                          <td style={{ padding:"12px 16px",fontWeight:600,color:"var(--dark)" }}>{ev?.couple || "-"}</td>
                          <td style={{ padding:"12px 16px",color:"var(--muted)",fontSize:12 }}>{ev ? formatDate(ev.date) : "-"}</td>
                          <td style={{ padding:"12px 16px" }}>
                            <span style={{ background:"rgba(16,185,129,0.1)",color:"#059669",padding:"4px 10px",borderRadius:8,fontWeight:700,fontSize:12 }}>✅ {formatTime(ci.checked_in_at)}</span>
                          </td>
                          <td style={{ padding:"12px 16px" }}>
                            <button onClick={()=>handleDeleteCheckin(ci.id)} disabled={deletingCheckin===ci.id}
                              style={{ background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8,padding:"5px 12px",fontSize:11,fontWeight:700,color:"#ef4444",cursor:"pointer" }}>
                              {deletingCheckin===ci.id?"...":"Hapus"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
        <footer style={{ textAlign:"center",padding:"24px 0 16px",color:"var(--muted)",fontSize:11,opacity:0.4,position:"relative",zIndex:1 }}>Created by GG & Caramolly</footer>
      </div>
    </>
  );
}
