// routes/backup.js
import express from "express";
import db from "../db.js";

const router = express.Router();

const BACKUP_VERSION = 1;

// تنزيل نسخة احتياطية كاملة من كل بيانات النظام
router.get("/export", (req, res) => {
  const data = db.read();
  const backup = {
    backupVersion: BACKUP_VERSION,
    appName: "Elite Fitness Academy",
    exportedAt: new Date().toISOString(),
    data: {
      coach: data.coach ? { ...data.coach } : null, // كلمة المرور مشفّرة بالفعل (hash)
      branches: data.branches || [],
      players: data.players || [],
      exerciseTypes: data.exerciseTypes || [],
      measurements: data.measurements || [],
      attendance: data.attendance || [],
      branchHistory: data.branchHistory || [],
      meta: data.meta || { nextId: 1 },
    },
  };

  const filename = `elite-fitness-backup-${new Date().toISOString().slice(0, 10)}.json`;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(JSON.stringify(backup, null, 2));
});

// استرجاع نسخة احتياطية: يستبدل كل البيانات الحالية بالبيانات الموجودة في الملف
router.post("/restore", (req, res) => {
  const body = req.body;

  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "ملف النسخة الاحتياطية غير صالح" });
  }

  const incoming = body.data || body; // دعم رفع الملف كما هو أو محتواه فقط

  const requiredKeys = ["branches", "players", "measurements", "attendance"];
  const looksValid = requiredKeys.every((k) => Array.isArray(incoming[k]));

  if (!looksValid) {
    return res.status(400).json({
      error: "هذا الملف لا يبدو نسخة احتياطية صحيحة من Elite Fitness Academy",
    });
  }

  const currentCoach = db.getCoach();

  const restoredData = {
    // نحافظ على حساب المدرب الحالي (اسم المستخدم وكلمة المرور الحالية)
    // عشان استرجاع نسخة قديمة ما يقفلك خارج حسابك بكلمة مرور قديمة بالغلط
    coach: currentCoach || incoming.coach || null,
    branches: incoming.branches || [],
    players: incoming.players || [],
    exerciseTypes: incoming.exerciseTypes || [],
    measurements: incoming.measurements || [],
    attendance: incoming.attendance || [],
    branchHistory: incoming.branchHistory || [],
    meta: incoming.meta || { nextId: 1 },
  };

  // حماية إضافية: نتأكد إن nextId أكبر من أي id موجود فعليًا، عشان نمنع تكرار IDs
  const allIds = [
    ...restoredData.branches,
    ...restoredData.players,
    ...restoredData.exerciseTypes,
    ...restoredData.measurements,
    ...restoredData.attendance,
    ...restoredData.branchHistory,
  ].map((r) => r.id || 0);
  const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
  restoredData.meta = { nextId: Math.max(restoredData.meta?.nextId || 1, maxId + 1) };

  db.write(restoredData);

  res.json({
    message: "تم استرجاع النسخة الاحتياطية بنجاح",
    counts: {
      branches: restoredData.branches.length,
      players: restoredData.players.length,
      exerciseTypes: restoredData.exerciseTypes.length,
      measurements: restoredData.measurements.length,
      attendance: restoredData.attendance.length,
    },
  });
});

export default router;
