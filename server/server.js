// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./src/routes/auth.js";
import branchesRoutes from "./src/routes/branches.js";
import playersRoutes from "./src/routes/players.js";
import exerciseTypesRoutes from "./src/routes/exerciseTypes.js";
import measurementsRoutes from "./src/routes/measurements.js";
import attendanceRoutes from "./src/routes/attendance.js";
import dashboardRoutes from "./src/routes/dashboard.js";
import reportsRoutes from "./src/routes/reports.js";
import backupRoutes from "./src/routes/backup.js";
import { requireAuth } from "./src/middleware/auth.js";
import db from "./src/db.js";
import { DEFAULT_EXERCISE_TYPES } from "./src/utils/defaultExerciseTypes.js";

dotenv.config();

function ensureExerciseTypesSeeded() {
  if (db.all("exerciseTypes").length > 0) return;
  DEFAULT_EXERCISE_TYPES.forEach((t) => {
    db.insert("exerciseTypes", { ...t, createdAt: new Date().toISOString() });
  });
  console.log("✅ تم إضافة أنواع القياسات الافتراضية تلقائيًا (تقدر تعدّلها من صفحة «أنواع القياسات»).");
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// مسار تسجيل الدخول مفتوح، باقي المسارات محمية بتسجيل الدخول
app.use("/api/auth", authRoutes);

app.use("/api/branches", requireAuth, branchesRoutes);
app.use("/api/players", requireAuth, playersRoutes);
app.use("/api/exercise-types", requireAuth, exerciseTypesRoutes);
app.use("/api/measurements", requireAuth, measurementsRoutes);
app.use("/api/attendance", requireAuth, attendanceRoutes);
app.use("/api/dashboard", requireAuth, dashboardRoutes);
app.use("/api/reports", requireAuth, reportsRoutes);
app.use("/api/backup", requireAuth, backupRoutes);

app.get("/api/health", (req, res) => {
  const coachExists = !!db.getCoach();
  res.json({ status: "ok", coachConfigured: coachExists });
});

// معالج أخطاء عام
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "حدث خطأ غير متوقع في السيرفر" });
});

app.listen(PORT, () => {
  ensureExerciseTypesSeeded();
  console.log(`✅ Elite Fitness Academy API يعمل الآن على http://localhost:${PORT}`);
  if (!db.getCoach()) {
    console.log("⚠️  لا يوجد حساب مدرب. شغّل: npm run seed");
  }
});
