import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  const { method, body } = req;
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (method === 'POST') {
    // 1. Simpan ke Supabase
    const { data, error } = await supabase
      .from('events')
      .insert([body]);

    if (error) return res.status(500).json({ error: error.message });

    // 2. Kirim Notifikasi Discord
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `@here 🔔 **Event Wedding Baru Telah Ditambahkan!**\n**Acara:** ${body.title}\n**Tanggal:** ${body.date}\n**Lokasi:** ${body.location || '-'}`
      }),
    });

    return res.status(200).json(data);
  }

  if (method === 'DELETE') {
    const { id, title } = req.query;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });

    // Notifikasi Hapus
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🗑️ **Event Wedding Dibatalkan/Dihapus:**\n**Acara:** ${title}`
      }),
    });

    return res.status(200).json({ message: 'Event deleted' });
  }

  // Handle GET untuk melihat semua orang
  if (method === 'GET') {
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    return res.status(200).json(data);
  }
}