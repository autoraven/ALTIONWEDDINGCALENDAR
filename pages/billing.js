import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { CALENDAR_CONFIG } from "../lib/config";

// ── Harga tetap ──────────────────────────────────────────────────────────
const TICKET_PRICE = 1000;
const MIC_PRICE     = 10000;
const TAX_RATE      = 0.15;
const MAX_CHARS     = 200; // batas karakter ringkasan singkat (utk berita transfer/dsb yg suka kepotong)

function formatCurrency(n) {
  const num = Number(n) || 0;
  return `$${num.toLocaleString("id-ID")}`;
}

function formatDateID(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
  } catch { return dateStr; }
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", { day:"numeric", month:"short", year:"numeric" });
  } catch { return dateStr; }
}

// Input harga yang otomatis kasih titik ribuan saat diketik (100000 -> 100.000),
// tapi tetap menyimpan angka mentah di state (bukan string berformat).
function MoneyInput({ value, onChange, placeholder, style }) {
  const display = value !== "" && value !== null && value !== undefined
    ? Number(value).toLocaleString("id-ID")
    : "";
  return (
    <input
      type="text"
      inputMode="numeric"
      className="input"
      style={style}
      value={display}
      onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      placeholder={placeholder}
    />
  );
}

export default function BillingPage() {
  const router = useRouter();
  const { businessName } = CALENDAR_CONFIG;

  // Mode: "wedding" | "event" | "nonevent" (jual lepas tanpa event/wedding)
  const [eventType, setEventType] = useState("wedding");

  // Info event — diambil dari query (kalau datang dari staff page), tapi tetap bisa diedit manual
  const [couple, setCouple]   = useState("");
  const [date, setDate]       = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [venue, setVenue]     = useState("");

  // Info khusus mode Non-Event (jual lepas)
  const [clientName, setClientName]   = useState(""); // nama client
  const [clientFrom, setClientFrom]   = useState(""); // dari bisnis/instansi apa
  const [purpose, setPurpose]         = useState(""); // untuk apa

  // Rincian biaya
  const [ticketQty, setTicketQty] = useState(0);
  const [micQty, setMicQty]       = useState(0);
  const [pelunasan, setPelunasan] = useState("");     // custom, string biar bisa kosong
  const [customTitle, setCustomTitle] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  // Talent (penyanyi dihitung per lagu, lainnya/MC pakai bayaran custom flat)
  const [talents, setTalents] = useState([]); // [{id, name, type:"penyanyi"|"lainnya", songQty, pricePerSong, flatPrice}]

  function addTalent() {
    setTalents(prev => [...prev, { id: Date.now()+Math.random(), name:"", type:"penyanyi", songQty:"", pricePerSong:"", flatPrice:"" }]);
  }
  function updateTalent(id, field, value) {
    setTalents(prev => prev.map(t => t.id===id ? { ...t, [field]: value } : t));
  }
  function removeTalent(id) {
    setTalents(prev => prev.filter(t => t.id !== id));
  }
  function talentAmount(t) {
    return t.type === "penyanyi"
      ? (parseInt(t.songQty)||0) * (parseFloat(t.pricePerSong)||0)
      : (parseFloat(t.flatPrice)||0);
  }

  const [prefilled, setPrefilled] = useState(false);

  // Prefill dari query string sekali saat halaman siap (tanpa perlu login)
  useEffect(() => {
    if (prefilled || !router.isReady) return;
    const q = router.query;
    if (q.couple) setCouple(String(q.couple));
    if (q.date) setDate(String(q.date));
    if (q.date_end) setDateEnd(String(q.date_end));
    if (q.venue) setVenue(String(q.venue));
    if (q.type) setEventType(String(q.type));
    setPrefilled(true);
  }, [router.isReady, router.query, prefilled]);

  const ticketTotal = (parseInt(ticketQty) || 0) * TICKET_PRICE;
  const micTotal     = (parseInt(micQty) || 0) * MIC_PRICE;
  const pelunasanNum = parseFloat(pelunasan) || 0;
  const customNum    = parseFloat(customPrice) || 0;
  const talentTotal  = talents.reduce((sum,t) => sum + talentAmount(t), 0);

  const subtotal = ticketTotal + micTotal + pelunasanNum + customNum + talentTotal;
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;

  const isWedding  = eventType === "wedding";
  const isNonEvent = eventType === "nonevent";
  const pelunasanLabel = isWedding ? "Pelunasan Wedding" : isNonEvent ? "Pembayaran / Jasa" : "Pelunasan";

  const description = useMemo(() => {
    const lines = [];
    lines.push(`🧾 RINCIAN BIAYA${isWedding ? " — WEDDING" : isNonEvent ? " — JASA/PENJUALAN" : " — EVENT"}`);

    if (isNonEvent) {
      if (clientName) lines.push(`👤 Client: ${clientName}`);
      if (clientFrom) lines.push(`🏢 Dari: ${clientFrom}`);
      if (purpose) lines.push(`📝 Untuk: ${purpose}`);
      if (date) lines.push(`📅 ${formatDateID(date)}`);
    } else {
      if (couple) lines.push(`${isWedding ? "👫" : "🎉"} ${couple}`);
      if (date) lines.push(`📅 ${formatDateID(date)}${dateEnd && dateEnd !== date ? ` — ${formatDateID(dateEnd)}` : ""}`);
      if (venue) lines.push(`📍 ${venue}`);
    }
    lines.push("");
    lines.push("Rincian:");

    const items = [];
    if (ticketQty > 0) items.push([`Penambahan Tiket (${ticketQty}x @ ${formatCurrency(TICKET_PRICE)})`, ticketTotal]);
    if (micQty > 0) items.push([`Penambahan Mic (${micQty}x @ ${formatCurrency(MIC_PRICE)})`, micTotal]);
    if (pelunasanNum > 0) items.push([pelunasanLabel, pelunasanNum]);
    talents.forEach(t => {
      const amount = talentAmount(t);
      if (amount <= 0) return;
      if (t.type === "penyanyi") {
        items.push([`Talent Penyanyi${t.name ? ` (${t.name})` : ""} (${parseInt(t.songQty)||0}x lagu @ ${formatCurrency(t.pricePerSong)})`, amount]);
      } else {
        items.push([`Talent${t.name ? ` ${t.name}` : " (MC/Lainnya)"}`, amount]);
      }
    });
    if (customTitle.trim() && customNum > 0) items.push([customTitle.trim(), customNum]);

    if (items.length === 0) {
      lines.push("_Belum ada rincian biaya_");
    } else {
      items.forEach(([label, amount]) => {
        lines.push(`• ${label} : ${formatCurrency(amount)}`);
      });
    }

    lines.push("");
    lines.push(`Subtotal : ${formatCurrency(subtotal)}`);
    lines.push(`Pajak Pemerintah (15%) : ${formatCurrency(tax)}`);
    lines.push("──────────────────────");
    lines.push(`TOTAL : ${formatCurrency(total)}`);
    lines.push("");
    lines.push(`Terima kasih atas kepercayaannya 🙏 — ${businessName}`);

    return lines.join("\n");
  }, [couple, date, dateEnd, venue, isWedding, isNonEvent, clientName, clientFrom, purpose, pelunasanLabel, ticketQty, micQty, ticketTotal, micTotal, pelunasanNum, talents, customTitle, customNum, subtotal, tax, total, businessName]);

  // ── Ringkasan Singkat — 1 kalimat padat, dibatasi MAX_CHARS supaya tidak
  //    kepotong kalau ditempel ke kolom berita transfer / catatan yang sempit ──
  const compactRaw = useMemo(() => {
    const parts = [];
    const label = isWedding ? "WEDDING" : isNonEvent ? "JASA" : "EVENT";

    if (isNonEvent) {
      parts.push(`${label} ${clientName || "-"}${clientFrom ? ` (${clientFrom})` : ""}${purpose ? `: ${purpose}` : ""}`);
    } else {
      parts.push(`${label} ${couple || "-"}${date ? ` ${formatDateShort(date)}` : ""}${venue ? ` @${venue}` : ""}`);
    }

    const items = [];
    if (ticketQty > 0) items.push(`Tiket ${ticketQty}x ${formatCurrency(TICKET_PRICE)}`);
    if (micQty > 0) items.push(`Mic ${micQty}x ${formatCurrency(MIC_PRICE)}`);
    if (pelunasanNum > 0) items.push(`${pelunasanLabel} ${formatCurrency(pelunasanNum)}`);
    talents.forEach(t => {
      const amount = talentAmount(t);
      if (amount <= 0) return;
      items.push(t.type === "penyanyi"
        ? `Penyanyi${t.name ? ` ${t.name}` : ""} ${parseInt(t.songQty)||0}x lagu ${formatCurrency(amount)}`
        : `${t.name || "MC"} ${formatCurrency(amount)}`);
    });
    if (customTitle.trim() && customNum > 0) items.push(`${customTitle.trim()} ${formatCurrency(customNum)}`);

    if (items.length) parts.push(items.join(", "));
    parts.push(`Total ${formatCurrency(total)}`);

    return parts.join(" — ");
  }, [couple, date, venue, isWedding, isNonEvent, clientName, clientFrom, purpose, pelunasanLabel, ticketQty, micQty, pelunasanNum, talents, customTitle, customNum, total]);

  const compactTooLong = compactRaw.length > MAX_CHARS;
  const compactDescription = compactTooLong ? compactRaw.slice(0, MAX_CHARS - 1) + "…" : compactRaw;

  const [copiedKey, setCopiedKey] = useState(""); // "full" | "compact" | ""

  async function handleCopy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 2000);
    } catch {
      // Fallback untuk browser lama / tanpa izin clipboard
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopiedKey(key); setTimeout(()=>setCopiedKey(""),2000); } catch {}
      document.body.removeChild(ta);
    }
  }

  return (
    <>
      <Head>
        <title>Rincian Biaya — {CALENDAR_CONFIG.businessName}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div style={{ minHeight:"100vh", background:"var(--bg)", padding:"24px 16px 60px" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>

          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <button onClick={()=>router.push("/staff")} className="btn"
              style={{ background:"var(--card)", border:"1.5px solid var(--border)", color:"var(--dark)", padding:"8px 14px", fontSize:12 }}>
              ← Kembali ke Staff Page
            </button>
            <h1 style={{ fontSize:20, fontWeight:800, color:"var(--navy)", letterSpacing:-0.5 }}>💰 Rincian Biaya</h1>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:20 }} className="billing-grid">
            {/* ── FORM ── */}
            <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, padding:20, boxShadow:"var(--shadow-sm)" }}>
              <p style={{ fontSize:12, fontWeight:800, color:"var(--muted)", textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>
                {isNonEvent ? "Info Client" : "Info Acara"}
              </p>

              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <button onClick={()=>setEventType("wedding")} className="btn" style={{ flex:1, fontSize:11, padding:"8px 4px", background:isWedding?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"var(--panel-soft)", color:isWedding?"#fff":"var(--muted)", border:"1.5px solid var(--border)" }}>💍 Wedding</button>
                <button onClick={()=>setEventType("event")} className="btn" style={{ flex:1, fontSize:11, padding:"8px 4px", background:eventType==="event"?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"var(--panel-soft)", color:eventType==="event"?"#fff":"var(--muted)", border:"1.5px solid var(--border)" }}>🎉 Event</button>
                <button onClick={()=>setEventType("nonevent")} className="btn" style={{ flex:1, fontSize:11, padding:"8px 4px", background:isNonEvent?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"var(--panel-soft)", color:isNonEvent?"#fff":"var(--muted)", border:"1.5px solid var(--border)" }}>🛒 Non-Event</button>
              </div>

              {isNonEvent ? (
                <>
                  <div style={{ marginBottom:10 }}>
                    <label className="label">👤 Nama Client</label>
                    <input className="input" value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Cth: Budi Santoso"/>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <label className="label">🏢 Dari Bisnis / Instansi <span style={{ fontWeight:400,color:"var(--muted)" }}>(opsional)</span></label>
                    <input className="input" value={clientFrom} onChange={e=>setClientFrom(e.target.value)} placeholder="Cth: PT Maju Jaya / Kantor Kelurahan"/>
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <label className="label">📝 Untuk Apa</label>
                    <input className="input" value={purpose} onChange={e=>setPurpose(e.target.value)} placeholder="Cth: Sewa mic & tiket untuk gathering kantor"/>
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <label className="label">Tanggal <span style={{ fontWeight:400,color:"var(--muted)" }}>(opsional)</span></label>
                    <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)}/>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom:10 }}>
                    <label className="label">Nama {isWedding ? "Pasangan" : "Acara"}</label>
                    <input className="input" value={couple} onChange={e=>setCouple(e.target.value)} placeholder="Cth: Andi & Bella"/>
                  </div>
                  <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                    <div style={{ flex:1 }}>
                      <label className="label">Tanggal</label>
                      <input type="date" className="input" value={date} onChange={e=>setDate(e.target.value)}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <label className="label">s/d (opsional)</label>
                      <input type="date" className="input" value={dateEnd} onChange={e=>setDateEnd(e.target.value)}/>
                    </div>
                  </div>
                  <div style={{ marginBottom:18 }}>
                    <label className="label">Venue</label>
                    <input className="input" value={venue} onChange={e=>setVenue(e.target.value)} placeholder="Cth: Grand Ballroom"/>
                  </div>
                </>
              )}

              <p style={{ fontSize:12, fontWeight:800, color:"var(--muted)", textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>Rincian Biaya</p>

              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <div style={{ flex:1 }}>
                  <label className="label">🎫 Penambahan Tiket <span style={{ fontWeight:400, color:"var(--muted)" }}>({formatCurrency(TICKET_PRICE)}/pcs)</span></label>
                  <input type="number" min="0" className="input" value={ticketQty} onChange={e=>setTicketQty(e.target.value.replace(/[^0-9]/g,""))} placeholder="0"/>
                </div>
                <div style={{ flex:1 }}>
                  <label className="label">🎤 Penambahan Mic <span style={{ fontWeight:400, color:"var(--muted)" }}>({formatCurrency(MIC_PRICE)}/pcs)</span></label>
                  <input type="number" min="0" className="input" value={micQty} onChange={e=>setMicQty(e.target.value.replace(/[^0-9]/g,""))} placeholder="0"/>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label className="label">💵 {pelunasanLabel} <span style={{ fontWeight:400, color:"var(--muted)" }}>(custom, sesuaikan)</span></label>
                <MoneyInput value={pelunasan} onChange={setPelunasan} placeholder="0"/>
              </div>

              {!isNonEvent && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <p style={{ fontSize:11, fontWeight:700, color:"var(--muted)" }}>🎙️ Talent (Penyanyi / MC / Lainnya)</p>
                    <button onClick={addTalent} className="btn" style={{ fontSize:10, padding:"5px 10px", background:"rgba(124,58,237,0.1)", color:"#7c3aed", border:"1px solid rgba(124,58,237,0.25)" }}>+ Tambah Talent</button>
                  </div>
                  {talents.length === 0 && <p style={{ fontSize:11, color:"var(--muted)", fontStyle:"italic" }}>Belum ada talent ditambahkan</p>}
                  {talents.map(t => (
                    <div key={t.id} style={{ background:"var(--panel-soft)", border:"1px dashed var(--border)", borderRadius:12, padding:12, marginBottom:8 }}>
                      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                        <input className="input" style={{ flex:1 }} value={t.name} onChange={e=>updateTalent(t.id,"name",e.target.value)} placeholder="Nama talent (opsional)"/>
                        <select className="input" style={{ flex:1 }} value={t.type} onChange={e=>updateTalent(t.id,"type",e.target.value)}>
                          <option value="penyanyi">🎤 Penyanyi (per lagu)</option>
                          <option value="lainnya">🎭 MC / Lainnya (custom)</option>
                        </select>
                        <button onClick={()=>removeTalent(t.id)} style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, color:"#dc2626", fontSize:14, width:38, cursor:"pointer" }}>✕</button>
                      </div>
                      {t.type === "penyanyi" ? (
                        <div style={{ display:"flex", gap:8 }}>
                          <input type="number" min="0" className="input" style={{ flex:1 }} value={t.songQty} onChange={e=>updateTalent(t.id,"songQty",e.target.value.replace(/[^0-9]/g,""))} placeholder="Jumlah lagu"/>
                          <MoneyInput value={t.pricePerSong} onChange={v=>updateTalent(t.id,"pricePerSong",v)} placeholder="Harga / lagu" style={{ flex:1 }}/>
                        </div>
                      ) : (
                        <MoneyInput value={t.flatPrice} onChange={v=>updateTalent(t.id,"flatPrice",v)} placeholder="Bayaran (custom)"/>
                      )}
                      <p style={{ fontSize:11, color:"var(--muted)", marginTop:6, textAlign:"right", fontWeight:700 }}>Subtotal: {formatCurrency(talentAmount(t))}</p>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ background:"var(--panel-soft)", border:"1px dashed var(--border)", borderRadius:12, padding:12, marginBottom:6 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"var(--muted)", marginBottom:8 }}>➕ Item Custom (opsional)</p>
                <div style={{ display:"flex", gap:8 }}>
                  <input className="input" style={{ flex:2 }} value={customTitle} onChange={e=>setCustomTitle(e.target.value)} placeholder="Judul, cth: Dekorasi Tambahan"/>
                  <MoneyInput value={customPrice} onChange={setCustomPrice} placeholder="Harga" style={{ flex:1 }}/>
                </div>
              </div>
            </div>

            {/* ── PREVIEW ── */}
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

              {/* Ringkasan Singkat — khusus untuk disalin, dibatasi karakter */}
              <div style={{ background:"var(--card)", border:"1.5px solid rgba(16,185,129,0.3)", borderRadius:16, padding:20, boxShadow:"var(--shadow-sm)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
                  <div>
                    <p style={{ fontSize:12, fontWeight:800, color:"#059669", textTransform:"uppercase", letterSpacing:1 }}>📏 Ringkasan Singkat</p>
                    <p style={{ fontSize:10, color:"var(--muted)", marginTop:2 }}>Untuk ditempel di kolom sempit (cth: berita transfer)</p>
                  </div>
                  <button onClick={()=>handleCopy(compactDescription,"compact")} className="btn" style={{ background:copiedKey==="compact"?"#10b981":"linear-gradient(135deg,#059669,#10b981)", color:"#fff", fontSize:12, padding:"7px 14px" }}>
                    {copiedKey==="compact" ? "✓ Disalin!" : "📋 Salin"}
                  </button>
                </div>
                <p style={{
                  whiteSpace:"pre-wrap", wordBreak:"break-word", fontFamily:"'Plus Jakarta Sans',sans-serif",
                  fontSize:13, lineHeight:1.6, color:"var(--dark)", background:"var(--panel-soft)",
                  border:"1px solid var(--border)", borderRadius:12, padding:14, margin:0,
                }}>{compactDescription}</p>
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:6 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:compactTooLong?"#dc2626":"var(--muted)" }}>
                    {compactDescription.length} / {MAX_CHARS} karakter{compactTooLong?" ⚠️ dipotong otomatis":""}
                  </span>
                </div>
              </div>

              {/* Lengkap */}
              <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, padding:20, boxShadow:"var(--shadow-sm)", display:"flex", flexDirection:"column" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <p style={{ fontSize:12, fontWeight:800, color:"var(--muted)", textTransform:"uppercase", letterSpacing:1 }}>📄 Rincian Lengkap</p>
                  <button onClick={()=>handleCopy(description,"full")} className="btn" style={{ background:copiedKey==="full"?"#10b981":"linear-gradient(135deg,var(--blue-2),var(--blue-1))", color:"#fff", fontSize:12, padding:"7px 14px" }}>
                    {copiedKey==="full" ? "✓ Disalin!" : "📋 Salin"}
                  </button>
                </div>
                <pre style={{
                  whiteSpace:"pre-wrap", wordBreak:"break-word", fontFamily:"'Plus Jakarta Sans',sans-serif",
                  fontSize:13.5, lineHeight:1.7, color:"var(--dark)", background:"var(--panel-soft)",
                  border:"1px solid var(--border)", borderRadius:12, padding:16, flex:1, margin:0, minHeight:240,
                }}>{description}</pre>

                <div style={{ marginTop:14, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderRadius:12, background:"rgba(64,128,240,0.08)", border:"1px solid rgba(64,128,240,0.2)" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"var(--muted)" }}>Total (sudah + pajak 15%)</span>
                  <span style={{ fontSize:18, fontWeight:800, color:"var(--blue-1)" }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 860px) {
          .billing-grid { grid-template-columns: 1fr 1fr !important; align-items: start; }
        }
      `}</style>
    </>
  );
}
