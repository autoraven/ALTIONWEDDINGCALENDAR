// pages/api/events.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Gunakan Service Role Key untuk akses admin
);

export default async function handler(req, res) {
  const { method } = req;
  const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL;

  try {
    if (method === 'GET') {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (method === 'POST') {
      const { data, error } = await supabase.from('events').insert([req.body]).select();
      if (error) throw error;

      // Kirim Notifikasi ke Discord
      await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `@here 🔔 **EVENT WEDDING BARU DITAMBAHKAN!**\n\n💍 **Pasangan:** ${req.body.couple}\n📅 **Tanggal:** ${req.body.date}\n📍 **Lokasi:** ${req.body.venue || '-'}\n⏰ **Jam:** ${req.body.time || '-'}\n📝 **Catatan:** ${req.body.notes || '-'}\n\nCek jadwal lengkap di: https://wedding-altion.vercel.app`
        }),
      });

      return res.status(200).json(data[0]);
    }

    if (method === 'DELETE') {
      const { id, couple } = req.query;
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;

      // Notifikasi Hapus
      await fetch(DISCORD_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🗑️ **EVENT DIHAPUS**\nJadwal wedding untuk **${couple}** telah dihapus dari sistem.`
        }),
      });

      return res.status(200).json({ message: 'Deleted' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}