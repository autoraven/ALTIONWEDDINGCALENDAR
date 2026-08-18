import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { CALENDAR_CONFIG } from "../lib/config";

// ── Harga tetap ──────────────────────────────────────────────────────────
const TICKET_PRICE = 1000;
const MIC_PRICE     = 10000;
const TAX_RATE      = 0.15;

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

export default function BillingPage() {
  const router = useRouter();
  const { businessName } = CALENDAR_CONFIG;

  // Info event — diambil dari query (kalau datang dari staff page), tapi tetap bisa diedit manual
  const [couple, setCouple]   = useState("");
  const [date, setDate]       = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [venue, setVenue]     = useState("");
  const [eventType, setEventType] = useState("wedding"); // "wedding" | "event"

  // Rincian biaya
  const [ticketQty, setTicketQty] = useState(0);
  const [micQty, setMicQty]       = useState(0);
  const [pelunasan, setPelunasan] = useState("");     // custom, string biar bisa kosong
  const [customTitle, setCustomTitle] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const [copied, setCopied] = useState(false);
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

  const subtotal = ticketTotal + micTotal + pelunasanNum + customNum;
  const tax      = subtotal * TAX_RATE;
  const total    = subtotal + tax;

  const isWedding = eventType === "wedding";

  const description = useMemo(() => {
    const lines = [];
    lines.push(`🧾 RINCIAN BIAYA${isWedding ? " — WEDDING" : " — EVENT"}`);
    if (couple) lines.push(`${isWedding ? "👫" : "🎉"} ${couple}`);
    if (date) lines.push(`📅 ${formatDateID(date)}${dateEnd && dateEnd !== date ? ` — ${formatDateID(dateEnd)}` : ""}`);
    if (venue) lines.push(`📍 ${venue}`);
    lines.push("");
    lines.push("Rincian:");

    const items = [];
    if (ticketQty > 0) items.push([`Penambahan Tiket (${ticketQty}x @ ${formatCurrency(TICKET_PRICE)})`, ticketTotal]);
    if (micQty > 0) items.push([`Penambahan Mic (${micQty}x @ ${formatCurrency(MIC_PRICE)})`, micTotal]);
    if (pelunasanNum > 0) items.push([isWedding ? "Pelunasan Wedding" : "Pelunasan", pelunasanNum]);
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
  }, [couple, date, dateEnd, venue, isWedding, ticketQty, micQty, ticketTotal, micTotal, pelunasanNum, customTitle, customNum, subtotal, tax, total, businessName]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback untuk browser lama / tanpa izin clipboard
      const ta = document.createElement("textarea");
      ta.value = description;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(()=>setCopied(false),2000); } catch {}
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
              <p style={{ fontSize:12, fontWeight:800, color:"var(--muted)", textTransform:"uppercase", letterSpacing:1, marginBottom:14 }}>Info Acara</p>

              <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                <button onClick={()=>setEventType("wedding")} className="btn" style={{ flex:1, fontSize:12, padding:"8px", background:isWedding?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"var(--panel-soft)", color:isWedding?"#fff":"var(--muted)", border:"1.5px solid var(--border)" }}>💍 Wedding</button>
                <button onClick={()=>setEventType("event")} className="btn" style={{ flex:1, fontSize:12, padding:"8px", background:!isWedding?"linear-gradient(135deg,var(--blue-2),var(--blue-1))":"var(--panel-soft)", color:!isWedding?"#fff":"var(--muted)", border:"1.5px solid var(--border)" }}>🎉 Event</button>
              </div>

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

              <div style={{ marginBottom:10 }}>
                <label className="label">💵 {isWedding ? "Pelunasan Wedding" : "Pelunasan"} <span style={{ fontWeight:400, color:"var(--muted)" }}>(custom, sesuaikan)</span></label>
                <input type="number" min="0" className="input" value={pelunasan} onChange={e=>setPelunasan(e.target.value)} placeholder="0"/>
              </div>

              <div style={{ background:"var(--panel-soft)", border:"1px dashed var(--border)", borderRadius:12, padding:12, marginBottom:6 }}>
                <p style={{ fontSize:11, fontWeight:700, color:"var(--muted)", marginBottom:8 }}>➕ Item Custom (opsional)</p>
                <div style={{ display:"flex", gap:8 }}>
                  <input className="input" style={{ flex:2 }} value={customTitle} onChange={e=>setCustomTitle(e.target.value)} placeholder="Judul, cth: Dekorasi Tambahan"/>
                  <input type="number" min="0" className="input" style={{ flex:1 }} value={customPrice} onChange={e=>setCustomPrice(e.target.value)} placeholder="Harga"/>
                </div>
              </div>
            </div>

            {/* ── PREVIEW ── */}
            <div style={{ background:"var(--card)", border:"1px solid var(--border)", borderRadius:16, padding:20, boxShadow:"var(--shadow-sm)", display:"flex", flexDirection:"column" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <p style={{ fontSize:12, fontWeight:800, color:"var(--muted)", textTransform:"uppercase", letterSpacing:1 }}>Preview (siap disalin)</p>
                <button onClick={handleCopy} className="btn" style={{ background:copied?"#10b981":"linear-gradient(135deg,var(--blue-2),var(--blue-1))", color:"#fff", fontSize:12, padding:"7px 14px" }}>
                  {copied ? "✓ Disalin!" : "📋 Salin Teks"}
                </button>
              </div>
              <pre style={{
                whiteSpace:"pre-wrap", wordBreak:"break-word", fontFamily:"'Plus Jakarta Sans',sans-serif",
                fontSize:13.5, lineHeight:1.7, color:"var(--dark)", background:"var(--panel-soft)",
                border:"1px solid var(--border)", borderRadius:12, padding:16, flex:1, margin:0, minHeight:280,
              }}>{description}</pre>

              <div style={{ marginTop:14, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderRadius:12, background:"rgba(64,128,240,0.08)", border:"1px solid rgba(64,128,240,0.2)" }}>
                <span style={{ fontSize:12, fontWeight:700, color:"var(--muted)" }}>Total (sudah + pajak 15%)</span>
                <span style={{ fontSize:18, fontWeight:800, color:"var(--blue-1)" }}>{formatCurrency(total)}</span>
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
