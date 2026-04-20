import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { CALENDAR_CONFIG } from "../../lib/config";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const DAYS = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [form, setForm] = useState({ couple:"", venue:"", time:"", notes:"" });
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  // 1. MENGAMBIL DATA DARI DATABASE (BUKAN LOCALSTORAGE)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data database");
      }
    };
    fetchEvents();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") { // Sesuaikan login Anda
      setIsLoggedIn(true);
    } else {
      setLoginError("Username atau password salah");
    }
  };

  // 2. MENAMBAH EVENT KE DATABASE + NOTIFIKASI DISCORD
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.couple || !selectedDate) return setFormError("Isi nama pasangan dan tanggal");

    const newEvent = {
      couple: form.couple,
      date: selectedDate,
      venue: form.venue,
      time: form.time,
      notes: form.notes
    };

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });

      if (res.ok) {
        const savedData = await res.json();
        setEvents([...events, savedData]); // Update UI
        setSuccess("Event berhasil disimpan & Notifikasi @here dikirim ke Discord!");
        setForm({ couple: "", venue: "", time: "", notes: "" });
        setShowForm(false);
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setFormError("Gagal menyimpan ke database");
    }
  };

  // 3. MENGHAPUS EVENT DARI DATABASE + NOTIFIKASI DISCORD
  const handleDelete = async (id) => {
    const eventToDelete = events.find(e => e.id === id);
    if (!confirm(`Hapus event ${eventToDelete.couple}?`)) return;

    try {
      const res = await fetch(`/api/events?id=${id}&couple=${eventToDelete.couple}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEvents(events.filter(ev => ev.id !== id));
      }
    } catch (err) {
      alert("Gagal menghapus event");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <form onSubmit={handleLogin}>
          <h2>Admin Login</h2>
          {loginError && <p style={{color:'red'}}>{loginError}</p>}
          <input type="text" placeholder="Username" onChange={(e)=>setUsername(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} />
          <button type="submit">Login</button>
        </form>
      </div>
    );
  }

  // ... (Sisa kode UI render Anda tetap sama, gunakan handleDelete(event.id) di tombol hapus)
  return (
    // Render UI Admin Anda di sini
    <div>
       {/* Pastikan tombol hapus memanggil handleDelete(event.id) */}
    </div>
  );
}