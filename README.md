# Wedding Calendar — Panduan Setup

## Cara Deploy ke Vercel (Gratis)

### 1. Persiapan
- Buat akun [GitHub](https://github.com) dan [Vercel](https://vercel.com)
- Install [Node.js](https://nodejs.org) di komputer Anda

### 2. Upload ke GitHub
```bash
# Di folder project ini:
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/USERNAME/wedding-calendar.git
git push -u origin main
```

### 3. Deploy di Vercel
1. Login ke [vercel.com](https://vercel.com)
2. Klik **"New Project"**
3. Import repo dari GitHub
4. Klik **"Deploy"** — selesai!

---

## Konfigurasi

Edit file `lib/config.js` untuk mengubah:

```js
export const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "wedding2024",  // ← GANTI PASSWORD INI
};

export const CALENDAR_CONFIG = {
  maxWeddingsPerWeek: 3,           // ← Batas wedding per minggu
  businessName: "Nama Bisnis Anda",
  contactPhone: "+62 xxx-xxxx-xxxx",
  contactEmail: "email@anda.com",
};
```

---

## Cara Pakai

### Untuk Admin:
- Buka `/admin` → login dengan username/password dari config
- Klik tanggal **hijau** di kalender untuk menambah event
- Isi form: nama pasangan, venue, jam, catatan
- Klik **Hapus** untuk menghapus event

### Untuk Tamu (Publik):
- Buka halaman utama → lihat kalender
- **Hijau** = tersedia, **Emas** = sudah dipesan, **Merah** = minggu penuh
- Klik tanggal yang sudah dipesan untuk melihat detail

---

## Catatan Penting
- Data tersimpan di **localStorage** browser — data akan hilang jika browser dibersihkan
- Untuk data permanen, upgrade ke database (Supabase/PlanetScale — masih gratis)
- Password admin ada di `lib/config.js` — **ganti sebelum deploy!**
