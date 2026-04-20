import { ADMIN_CREDENTIALS } from "../../lib/config";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, password } = req.body;

  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    return res.status(200).json({ success: true, token: "admin-authenticated" });
  }

  return res.status(401).json({ success: false, message: "Username atau password salah" });
}
