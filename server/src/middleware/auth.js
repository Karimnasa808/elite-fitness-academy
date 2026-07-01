// middleware/auth.js
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "elite-fitness-academy-secret-change-me";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.coach = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: "جلسة الدخول غير صالحة أو منتهية، سجّل الدخول من جديد" });
  }
}

export { JWT_SECRET };
