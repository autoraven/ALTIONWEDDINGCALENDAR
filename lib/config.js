// ============================================================
// KONFIGURASI ADMIN & PENGATURAN SISTEM
// Simpan credentials di Vercel Environment Variables
// ============================================================

export const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "altion",
  password: process.env.ADMIN_PASSWORD || "caramolly",
};

export const CALENDAR_CONFIG = {
  maxWeddingsPerWeek: 3,
  businessName: "ALTION",
  contactEmail: "https://docs.google.com/forms/d/e/1FAIpQLSfgSo7CPIy5KrUKB2qKaoNP2yfDShnUlrn9PqAXtBGj0CRG-g/viewform",
};
