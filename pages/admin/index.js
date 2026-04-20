
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS = ["Min","Sen","Sel","Rab","Kam","Jum","Sab"];

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return monday.toISOString().split("T")[0];
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [form, setForm] = useState({ couple: "", venue: "", time: "", notes: "" });
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const { maxWeddingsPerWeek } = CALENDAR_CONFIG;

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === "true") setIsLoggedIn(true);
    const stored = localStorage.getItem("wedding_events");
    if (stored) setEvents(JSON.parse(stored));
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (data.success) {
      sessionStorage.setItem("admin_auth", "true");
      setIsLoggedIn(true);
    } else {
      setLoginError(data.message);
    }
  }

  function saveEvents(newEvents) {
    setEvents(newEvents);
    localStorage.setItem("wedding_events", JSON.stringify(newEvents));
  }

  function handleAddEvent(e) {
    e.preventDefault();
    setFormError("");
    if (!form.couple.trim()) return setFormError("Nama pasangan wajib diisi");
    const weekKey = getWeekKey(selectedDate);
    const count = events.filter(ev => getWeekKey(ev.date) === weekKey).length;
    if (count >= maxWeddingsPerWeek) {
      return setFormError("Minggu ini sudah penuh (maks. " + maxWeddingsPerWeek + " wedding)");
    }
    const already = events.find(ev => ev.date === selectedDate);
    if (already) return setFormError("Tanggal ini sudah ada event");
    const newEvents = [...events, { ...form, date: selectedDate, id: Date.now() }];
    saveEvents(newEvents);
    setForm({ couple: "", venue: "", time: "", notes: "" });
    setShowForm(false);
    setSuccess("Event berhasil ditambahkan!");
    setTimeout(() => setSuccess(""), 3000);
  }

  function handleDelete(id) {
    if (!confirm("Hapus event ini?")) return;
    saveEvents(events.filter(e => e.id !== id));
  }

  function logout() {
    sessionStorage.removeItem("admin_auth");
    setIsLoggedIn(false);
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const today = new Date(); today.setHours(0,0,0,0);

  function getDayStatus(day) {
    const dateStr = year+"-"+String(month+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
    const event = events.find(e => e.date === dateStr);
    if (event) return { status: "booked", event };
    const weekKey = getWeekKey(dateStr);
    const count = events.filter(e => getWeekKey(e.date) === weekKey).length;
    if (count >= maxWeddingsPerWeek) return { status: "full" };
    const d = new Date(dateStr);
    if (d < today) return { status: "past" };
    return { status: "available" };
  }

  if (!isLoggedIn) return (
    <>
      <Head><title>Admin Login - Wedding Calendar</title></Head>
      <div style={{ minHeight:"100vh", background:"var(--dark)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div style={{ background:"var(--cream)", width:"100%", maxWidth:400, borderRadius:4, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
          <div style={{ background:"var(--dark)", padding:"28px 32px", textAlign:"center", borderBottom:"2px solid var(--gold)" }}>
            <h1 style={{ color:"var(--gold-light)", fontSize:24, fontWeight:300, letterSpacing:3 }}>Admin Panel</h1>
            <p style={{ color:"var(--muted)", fontSize:11, letterSpacing:2, marginTop:4, textTransform:"uppercase" }}>Wedding Calendar</p>
          </div>
          <form onSubmit={handleLogin} style={{ padding:"32px" }}>
            {loginError && <div style={{ background:"#fff0f0", border:"1px solid #f5c6c6", color:"var(--red)", padding:"10px 14px", borderRadius:2, marginBottom:20, fontSize:13 }}>{loginError}</div>}
            {[{label:"Username",value:username,setter:setUsername,type:"text"},{label:"Password",value:password,setter:setPassword,type:"password"}].map(({label,value,setter,type}) => (
              <div key={label} style={{ marginBottom:18 }}>
                <label style={{ display:"block", fontSize:10, letterSpacing:2, color:"var(--muted)", textTransform:"uppercase", marginBottom:6 }}>{label}</label>
                <input type={type} value={value} onChange={e=>setter(e.target.value)}
                  style={{ width:"100%", padding:"10px 14px", border:"1px solid #ddd", borderRadius:2, fontSize:14, fontFamily:"Jost,sans-serif", background:"var(--white)" }} required />
              </div>
            ))}
            <button type="submit" className="btn btn-gold" style={{ width:"100%", marginTop:8, padding:"12px" }}>Masuk</button>
            <div style={{ marginTop:20, textAlign:"center" }}>
              <Link href="/" style={{ fontSize:12, color:"var(--muted)", textDecoration:"none" }}>Kembali ke Kalender</Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Head><title>Admin Dashboard - Wedding Calendar</title></Head>
      <div style={{ minHeight:"100vh", background:"var(--cream)" }}>
        <header style={{ background:"var(--dark)", padding:"0 32px", height:70, display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"2px solid var(--gold)" }}>
          <div>
            <h1 style={{ color:"var(--gold-light)", fontSize:20, fontWeight:300, letterSpacing:2 }}>Dashboard Admin</h1>
            <p style={{ color:"var(--muted)", fontSize:10, letterSpacing:2, textTransform:"uppercase" }}>Wedding Calendar</p>
          </div>
          <div style={{ display:"flex", gap:12, alignItems:"center" }}>
            <Link href="/" className="btn btn-outline" style={{ fontSize:11, padding:"7px 16px" }}>Lihat Kalender</Link>
            <button onClick={logout} className="btn btn-danger" style={{ fontSize:11 }}>Logout</button>
          </div>
        </header>
        <main style={{ maxWidth:1000, margin:"0 auto", padding:"32px 20px" }}>
          {success && <div style={{ background:"#f0fff4", border:"1px solid #9ae6b4", color:"var(--green)", padding:"12px 20px", borderRadius:2, marginBottom:24, fontSize:13 }}>Berhasil ditambahkan!</div>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:16, marginBottom:32 }}>
            {[{label:"Total Event",value:events.length},{label:"Bulan Ini",value:events.filter(e=>{const d=new Date(e.date);return d.getMonth()===month&&d.getFullYear()===year;}).length},{label:"Maks/Minggu",value:maxWeddingsPerWeek}].map(({label,value})=>(
              <div key={label} style={{ background:"var(--white)", padding:"20px 24px", borderRadius:4, border:"1px solid #e8ddd0", textAlign:"center" }}>
                <div style={{ fontFamily:"Cormorant Garamond,serif", fontSize:36, color:"var(--gold-dark)", lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:10, color:"var(--muted)", letterSpacing:2, textTransform:"uppercase", marginTop:6 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:24, alignItems:"start" }}>
            <div style={{ background:"var(--white)", borderRadius:4, border:"1px solid #e8ddd0", overflow:"hidden" }}>
              <div style={{ background:"var(--dark)", padding:"16px 24px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <button onClick={()=>setCurrentDate(new Date(year,month-1,1))} style={{ background:"none", border:"none", color:"var(--gold)", fontSize:20, cursor:"pointer" }}>&#8249;</button>
                <h2 style={{ color:"var(--gold-light)", fontSize:20, fontWeight:300, letterSpacing:2 }}>{MONTHS[month]} {year}</h2>
                <button onClick={()=>setCurrentDate(new Date(year,month+1,1))} style={{ background:"none", border:"none", color:"var(--gold)", fontSize:20, cursor:"pointer" }}>&#8250;</button>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"#f5f0ea" }}>
                {DAYS.map(d=><div key={d} style={{ textAlign:"center", padding:"10px 0", fontSize:9, letterSpacing:2, color:"var(--muted)", textTransform:"uppercase" }}>{d}</div>)}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, background:"#e8ddd0" }}>
                {Array.from({length:startOffset}).map((_,i)=><div key={i} style={{ background:"var(--cream)", minHeight:56 }}/>)}
                {Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>{
                  const dateStr=year+"-"+String(month+1).padStart(2,"0")+"-"+String(day).padStart(2,"0");
                  const {status,event}=getDayStatus(day);
                  const isSelected=selectedDate===dateStr;
                  const isToday=new Date(dateStr).toDateString()===today.toDateString();
                  const canAdd=status==="available";
                  return(
                    <div key={day} onClick={()=>{if(canAdd){setSelectedDate(dateStr);setShowForm(true);setFormError("");}}}
                      style={{ background:isSelected?"#fff3e0":status==="booked"?"#fff8f0":status==="full"?"#fff5f5":status==="past"?"#f8f8f8":"var(--white)", minHeight:56, padding:"8px 6px", cursor:canAdd?"pointer":"default", display:"flex", flexDirection:"column", outline:isSelected?"2px solid var(--gold)":"none" }}>
                      <span style={{ fontSize:13, color:status==="past"?"#ccc":isToday?"var(--gold-dark)":"var(--dark)", fontWeight:isToday?700:400 }}>{day}</span>
                      {status==="booked"&&<span style={{ fontSize:8, color:"var(--gold)", marginTop:"auto", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{event.couple}</span>}
                      {status==="available"&&<div style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", marginTop:"auto" }}/>}
                      {status==="full"&&<div style={{ width:6, height:6, borderRadius:"50%", background:"var(--red)", marginTop:"auto" }}/>}
                    </div>
                  );
                })}
              </div>
              <p style={{ padding:"12px 16px", fontSize:11, color:"var(--muted)", background:"#faf7f2" }}>Klik tanggal tersedia (hijau) untuk menambah event</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {showForm&&(
                <div style={{ background:"var(--white)", borderRadius:4, border:"1px solid var(--gold-light)", padding:"24px", boxShadow:"var(--shadow)" }}>
                  <h3 style={{ fontSize:18, fontWeight:400, marginBottom:20, color:"var(--gold-dark)" }}>Tambah Event</h3>
                  <p style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>Tanggal: {selectedDate}</p>
                  {formError&&<div style={{ background:"#fff0f0", color:"var(--red)", padding:"8px 12px", fontSize:12, borderRadius:2, marginBottom:14 }}>{formError}</div>}
                  <form onSubmit={handleAddEvent}>
                    {[{label:"Nama Pasangan *",key:"couple",placeholder:"Budi & Siti"},{label:"Venue / Lokasi",key:"venue",placeholder:"Grand Ballroom Hotel XYZ"},{label:"Jam Acara",key:"time",placeholder:"10:00 WIB"},{label:"Catatan",key:"notes",placeholder:"Informasi tambahan..."}].map(({label,key,placeholder})=>(
                      <div key={key} style={{ marginBottom:14 }}>
                        <label style={{ display:"block", fontSize:10, letterSpacing:1.5, color:"var(--muted)", textTransform:"uppercase", marginBottom:5 }}>{label}</label>
                        <input value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={placeholder}
                          style={{ width:"100%", padding:"9px 12px", border:"1px solid #ddd", borderRadius:2, fontSize:13, fontFamily:"Jost,sans-serif" }}/>
                      </div>
                    ))}
                    <div style={{ display:"flex", gap:10, marginTop:4 }}>
                      <button type="submit" className="btn btn-gold" style={{ flex:1 }}>Simpan</button>
                      <button type="button" onClick={()=>setShowForm(false)} className="btn btn-outline" style={{ flex:1 }}>Batal</button>
                    </div>
                  </form>
                </div>
              )}
              <div style={{ background:"var(--white)", borderRadius:4, border:"1px solid #e8ddd0", overflow:"hidden" }}>
                <div style={{ padding:"16px 20px", borderBottom:"1px solid #f0e8dc", background:"#faf7f2" }}>
                  <h3 style={{ fontSize:16, fontWeight:400, color:"var(--mid)" }}>Semua Event ({events.length})</h3>
                </div>
                <div style={{ maxHeight:400, overflowY:"auto" }}>
                  {events.length===0&&<p style={{ padding:"24px", textAlign:"center", color:"var(--muted)", fontSize:13 }}>Belum ada event</p>}
                  {[...events].sort((a,b)=>a.date.localeCompare(b.date)).map(event=>(
                    <div key={event.id} style={{ padding:"14px 20px", borderBottom:"1px solid #f5f0ea", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <div>
                        <p style={{ fontFamily:"Cormorant Garamond,serif", fontSize:16 }}>{event.couple}</p>
                        <p style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>{event.date}</p>
                        {event.venue&&<p style={{ fontSize:11, color:"var(--muted)" }}>{event.venue}</p>}
                        {event.time&&<p style={{ fontSize:11, color:"var(--muted)" }}>{event.time}</p>}
                      </div>
                      <button onClick={()=>handleDelete(event.id)} className="btn btn-danger">Hapus</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
