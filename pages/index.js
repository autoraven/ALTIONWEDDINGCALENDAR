import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../lib/config";

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

function countWeddingsInWeek(events, weekKey) {
  return events.filter(e => getWeekKey(e.date) === weekKey).length;
}

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const { maxWeddingsPerWeek, businessName, contactPhone, contactEmail } = CALENDAR_CONFIG;

  useEffect(() => {
    const stored = localStorage.getItem("wedding_events");
    if (stored) setEvents(JSON.parse(stored));
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

  const selectedEvents = selectedDay
    ? events.filter(e => e.date === `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`)
    : [];

  return (
    <>
      <Head>
        <title>{businessName} — Kalender Jadwal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
        {/* Header */}
        <header style={{
          background: "var(--dark)", color: "var(--cream)", padding: "0 32px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          height: 70, borderBottom: "2px solid var(--gold)"
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 300, letterSpacing: 2, color: "var(--gold-light)" }}>
              {businessName}
            </h1>
            <p style={{ fontSize: 10, letterSpacing: 3, color: "var(--muted)", textTransform: "uppercase" }}>Wedding Calendar</p>
          </div>
          <Link href="/admin" className="btn btn-outline" style={{ fontSize: 11, padding: "7px 18px" }}>
            Admin Login
          </Link>
        </header>

        <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px" }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: "wrap" }}>
            {[
              { color: "#27674a", label: "Tersedia" },
              { color: "#c8a96e", label: "Sudah Dipesan" },
              { color: "#c0392b", label: "Penuh (Minggu ini)" },
              { color: "#ccc", label: "Sudah Lewat" },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: color }} />
                <span style={{ fontSize: 12, color: "var(--muted)", letterSpacing: 0.5 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div style={{
            background: "var(--white)", borderRadius: 4, boxShadow: "var(--shadow)",
            overflow: "hidden", border: "1px solid #e8ddd0"
          }}>
            {/* Month nav */}
            <div style={{
              background: "var(--dark)", padding: "20px 28px",
              display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>‹</button>
              <div style={{ textAlign: "center" }}>
                <h2 style={{ color: "var(--gold-light)", fontSize: 26, fontWeight: 300, letterSpacing: 3 }}>
                  {MONTHS[month]}
                </h2>
                <span style={{ color: "var(--muted)", fontSize: 12, letterSpacing: 2 }}>{year}</span>
              </div>
              <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>›</button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f5f0ea" }}>
              {DAYS.map(d => (
                <div key={d} style={{
                  textAlign: "center", padding: "12px 0",
                  fontSize: 10, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", fontWeight: 500
                }}>{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: "#e8ddd0" }}>
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} style={{ background: "var(--cream)", minHeight: 64 }} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const { status, event } = getDayStatus(day);
                const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const isSelected = selectedDay === day;
                const isToday = new Date(dateStr).toDateString() === today.toDateString();

                const bgColor = {
                  booked: "#fff8f0",
                  full: "#fff5f5",
                  past: "#f8f8f8",
                  available: "var(--white)",
                }[status];

                const dotColor = {
                  booked: "var(--gold)",
                  full: "var(--red)",
                  past: "#ddd",
                  available: "var(--green)",
                }[status];

                return (
                  <div key={day}
                    onClick={() => status === "booked" ? setSelectedDay(isSelected ? null : day) : null}
                    style={{
                      background: isSelected ? "#fff3e0" : bgColor,
                      minHeight: 64, padding: "10px 10px 8px",
                      cursor: status === "booked" ? "pointer" : "default",
                      display: "flex", flexDirection: "column", alignItems: "flex-start",
                      transition: "background 0.15s",
                      outline: isSelected ? "2px solid var(--gold)" : "none",
                    }}
                  >
                    <span style={{
                      fontSize: 14, fontWeight: isToday ? 700 : 400,
                      color: status === "past" ? "#bbb" : isToday ? "var(--gold-dark)" : "var(--dark)",
                      background: isToday ? "#fff3e0" : "none",
                      borderRadius: "50%", width: 26, height: 26,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{day}</span>
                    <div style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: dotColor, marginTop: "auto", marginLeft: 2
                    }} />
                    {status === "booked" && event && (
                      <span style={{
                        fontSize: 9, color: "var(--gold-dark)", letterSpacing: 0.3,
                        marginTop: 2, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                      }}>{event.couple}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected day popup */}
          {selectedDay && selectedEvents.length > 0 && (
            <div style={{
              marginTop: 24, background: "var(--white)", border: "1px solid var(--gold-light)",
              borderRadius: 4, padding: "24px 28px", boxShadow: "var(--shadow)"
            }}>
              <h3 style={{ fontSize: 20, fontWeight: 400, marginBottom: 16, color: "var(--gold-dark)" }}>
                {selectedDay} {MONTHS[month]} {year}
              </h3>
              {selectedEvents.map((e, i) => (
                <div key={i} style={{ borderTop: "1px solid #f0e8dc", paddingTop: 14, marginTop: 14 }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 6 }}>💍 {e.couple}</p>
                  {e.venue && <p style={{ fontSize: 13, color: "var(--muted)" }}>📍 {e.venue}</p>}
                  {e.time && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>🕐 {e.time}</p>}
                  {e.notes && <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, fontStyle: "italic" }}>{e.notes}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Info limit */}
          <div style={{
            marginTop: 32, padding: "18px 24px", background: "#f5f0ea",
            borderLeft: "3px solid var(--gold)", borderRadius: "0 4px 4px 0"
          }}>
            <p style={{ fontSize: 13, color: "var(--mid)", lineHeight: 1.7 }}>
              <strong>Informasi:</strong> Kami melayani maksimal <strong>{maxWeddingsPerWeek} pernikahan per minggu</strong> untuk memastikan setiap momen mendapat perhatian penuh.
              Hubungi kami untuk reservasi: <strong>{contactPhone}</strong> atau <strong>{contactEmail}</strong>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
