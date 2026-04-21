import { useState, useEffect } from "react";
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
  const [loading, setLoading] = useState(true);
  const { maxWeddingsPerWeek, businessName, contactEmail } = CALENDAR_CONFIG;

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (Array.isArray(data)) setEvents(data);
      } catch (err) {
        console.error("Gagal fetch events:", err);
      } finally {
        setLoading(false);
      }
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
      </Head>

      <div style={{ minHeight:"100vh", background:"var(--bg)" }}>
        {/* Header */}
        <header style={{
          background:"linear-gradient(135deg, #0d6ecc 0%, #1a8fff 60%, #42b0ff 100%)",
          padding:"0 32px", height:72,
          display:"flex", alignItems:"center", justifyContent:"space-between",
          boxShadow:"0 4px 24px rgba(13,110,204,0.35)",
          position:"sticky", top:0, zIndex:100,
        }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:600, color:"#fff", letterSpacing:0.5 }}>{businessName}</h1>
            <p style={{ fontSize:11, color:"rgba(255,255,255,0.75)", letterSpacing:2, textTransform:"uppercase" }}>Wedding Calendar</p>
          </div>
        </header>

        <main style={{ maxWidth:800, margin:"0 auto", padding:"32px 16px" }}>
          {/* Kalender Card */}
          <div className="card" style={{ padding:28, marginBottom:24 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <button onClick={()=>setCurrentDate(new Date(year,month-1,1))} className="btn btn-outline" style={{ padding:"6px 16px" }}>‹</button>
              <h2 style={{ fontSize:22, fontWeight:400 }}>{MONTHS[month]} {year}</h2>
              <button onClick={()=>setCurrentDate(new Date(year,month+1,1))} className="btn btn-outline" style={{ padding:"6px 16px" }}>›</button>
            </div>

            {/* Legend */}
            <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:18, fontSize:12, color:"var(--muted)" }}>
              {[
                { color:"var(--green)", label:"Tersedia" },
                { color:"#f59e0b",     label:"Sudah dipesan" },
                { color:"var(--red)",  label:"Minggu penuh" },
              ].map(({color,label}) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:12, height:12, borderRadius:3, background:color }} />
                  <span>{label}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign:"center", padding:40, color:"var(--muted)" }}>Memuat kalender...</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:4 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:600,
                    color:"var(--muted)", padding:"6px 0", letterSpacing:0.5 }}>{d}</div>
                ))}
                {Array.from({length:startOffset}).map((_,i) => <div key={`e${i}`} />)}
                {Array.from({length:daysInMonth},(_,i)=>i+1).map(day => {
                  const { status, event } = getDayStatus(day);
                  const isToday = new Date(year,month,day).toDateString() === today.toDateString();
                  const isSelected = selectedDay === day;
                  const bg = {
                    available: "rgba(15,184,122,0.12)",
                    booked:    "rgba(245,158,11,0.15)",
                    full:      "rgba(229,62,62,0.10)",
                    past:      "rgba(203,213,225,0.3)",
                  }[status];
                  const textColor = {
                    available: "var(--green)",
                    booked:    "#92400e",
                    full:      "var(--red)",
                    past:      "#94a3b8",
                  }[status];
                  return (
                    <div key={day}
                      onClick={() => setSelectedDay(status !== "past" ? day : null)}
                      title={event ? `${event.couple} — ${event.venue}` : ""}
                      style={{
                        background:   isSelected ? "var(--blue-2)" : bg,
                        color:        isSelected ? "#fff" : textColor,
                        borderRadius: 8, padding:"10px 4px", textAlign:"center",
                        cursor: status !== "past" ? "pointer" : "default",
                        border: isToday ? "2px solid var(--blue-2)" : "2px solid transparent",
                        fontWeight: isToday ? 700 : 500,
                        fontSize:14, transition:"all 0.15s",
                        position:"relative",
                      }}>
                      {day}
                      {status === "booked" && !isSelected && (
                        <div style={{ position:"absolute", bottom:3, left:"50%", transform:"translateX(-50%)",
                          width:5, height:5, borderRadius:"50%", background:"#f59e0b" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail tanggal dipilih */}
          {selectedDay && (
            <div className="card" style={{ padding:24, marginBottom:24 }}>
              <h3 style={{ fontSize:16, fontWeight:600, marginBottom:12 }}>
                {new Date(year,month,selectedDay).toLocaleDateString("id-ID",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
              </h3>
              {selectedEvents.length === 0 ? (
                <div>
                  <p style={{ color:"var(--green)", fontWeight:500, marginBottom:12 }}>✅ Tanggal ini tersedia!</p>
                  {contactEmail && (
                    <a href={contactEmail} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      Pesan Tanggal Ini
                    </a>
                  )}
                </div>
              ) : (
                selectedEvents.map(ev => (
                  <div key={ev.id} style={{ background:"rgba(245,158,11,0.08)", borderRadius:8,
                    padding:"14px 18px", border:"1px solid rgba(245,158,11,0.3)" }}>
                    <p style={{ fontWeight:600, marginBottom:6 }}>💍 {ev.couple}</p>
                    {ev.venue && <p style={{ color:"var(--muted)", fontSize:13 }}>🏛️ {ev.venue}</p>}
                    {ev.time  && <p style={{ color:"var(--muted)", fontSize:13 }}>🕐 {ev.time}</p>}
                    {ev.notes && <p style={{ color:"var(--muted)", fontSize:13 }}>📝 {ev.notes}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Info */}
          <div style={{ textAlign:"center", color:"var(--muted)", fontSize:13 }}>
            <p>Maks. {maxWeddingsPerWeek} wedding per minggu</p>
          </div>
        </main>
      </div>
    </>
  );
}
