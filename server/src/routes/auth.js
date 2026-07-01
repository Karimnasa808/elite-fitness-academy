// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { requireAuth, JWT_SECRET } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "من فضلك اكتب اسم المستخدم وكلمة المرور" });
  }

  const coach = db.getCoach();
  if (!coach) {
    return res.status(500).json({
      error: "لا يوجد حساب مدرب مُسجّل. شغّل أمر الإعداد الأولي (npm run seed) أولاً.",
    });
  }

  if (coach.username !== username) {
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }

  const valid = await bcrypt.compare(password, coach.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة" });
  }

  const token = jwt.sign(
    { id: coach.id, username: coach.username, name: coach.name },
    JWT_SECRET,
    { expiresIn: "30d" }
  );

  res.json({ token, coach: { id: coach.id, username: coach.username, name: coach.name } });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ coach: req.coach });
});

router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "من فضلك أدخل كلمة المرور الحالية والجديدة" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" });
  }

  const coach = db.getCoach();
  const valid = await bcrypt.compare(currentPassword, coach.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "كلمة المرور الحالية غير صحيحة" });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  db.setCoach({ ...coach, passwordHash });

  res.json({ message: "تم تغيير كلمة المرور بنجاح" });
});

export default router;
