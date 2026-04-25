// Debug file untuk melihat struktur yang benar
import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

function isWeekend(dateStr) {
  const d = new Date(dateStr);
  return d.getDay() === 0 || d.getDay() === 6;
}

export default function AdminDebug() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [animDirection, setAnimDirection] = useState(0);
  const { businessName } = CALENDAR_CONFIG;

  const fetchEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    if (Array.isArray(data)) setEvents(data);
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchEvents();
  }, [fetchEvents]);

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

  return (
    <>
      <Head><title>Admin Debug — {businessName}</title></Head>

      <div style={{ minHeight:"100vh", padding:"40px", background:"var(--bg)" }}>
        <h1>Debug Admin Calendar</h1>
        <p>Current Date: {currentDate.toDateString()}</p>
        <p>Anim Direction: {animDirection}</p>

        <div style={{ maxWidth:800, margin:"20px 0", background:"white", borderRadius:12, padding:"20px", border:"1px solid var(--border)" }}>
          {/* Month Header */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <button onClick={() => changeMonth(-1)} style={{ padding:"10px 20px", background:"var(--blue-1)", color:"white", border:"none", borderRadius:6 }}>
              ‹ Prev
            </button>
            <div style={{ textAlign:"center", overflow:"hidden", height:50 }}>
              <div style={{ transition:"transform 0.3s ease", transform: animDirection === 0 ? "translateX(0)" : animDirection === 1 ? "translateX(-25px)" : "translateX(25px)" }}>
                <h2 style={{ fontSize:24, fontWeight:"bold", marginBottom:5 }}>{MONTHS[month]}</h2>
                <span style={{ fontSize:14, color:"var(--muted)" }}>{year}</span>
              </div>
            </div>
            <button onClick={() => changeMonth(1)} style={{ padding:"10px 20px", background:"var(--blue-1)", color:"white", border:"none", borderRadius:6 }}>
              Next ›
            </button>
          </div>

          {/* Day Labels */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", marginBottom:10 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign:"center", fontWeight:"bold", fontSize:12, color:"var(--muted)" }}>{d}</div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, background:"var(--border)", padding:1, borderRadius:8 }}>
            {Array.from({ length:startOffset }).map((_,i) => (
              <div key={`empty-${i}`} style={{ height:60 }} />
            ))}
            {Array.from({ length:daysInMonth }, (_,i) => i+1).map(day => {
              const { status, event } = getDayStatus(day);
              const isSelected = selectedDate === day;
              const isToday = new Date(`${year}-${month+1}-${day}`).toDateString() === today.toDateString();

              let bgColor = "white";
              if (status === "booked") bgColor = "rgba(30,96,213,0.1)";
              if (status === "available") bgColor = "rgba(16,185,129,0.1)";
              if (status === "past") bgColor = "#f5f5f5";
              if (status === "conditional") bgColor = "rgba(239,68,68,0.1)";
              if (isSelected) bgColor = "rgba(30,96,213,0.2)";

              return (
                <div
                  key={day}
                  onClick={() => status === "booked" ? setSelectedDay(isSelected ? null : day) : null}
                  style={{
                    height: 60,
                    background: bgColor,
                    border: isSelected ? "2px solid var(--blue-2)" : "1px solid var(--border)",
                    borderRadius: 6,
                    padding: 8,
                    cursor: status === "booked" ? "pointer" : "default",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: isToday ? "var(--blue-2)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isToday ? "white" : "inherit",
                    fontWeight: isToday ? "bold" : "normal"
                  }}>
                    {day}
                  </div>
                  {status === "booked" && event && (
                    <div style={{ fontSize:10, color:"var(--blue-1)", marginTop:2 }}>💍 {event.couple}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Link href="/" style={{ display:"inline-block", marginTop:20, padding:"10px 20px", background:"var(--blue-1)", color:"white", textDecoration:"none", borderRadius:6 }}>
          ← Back to Calendar
        </Link>
      </div>
    </>
  );
}