// routes/attendance.js
import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const { date, branchId, playerId } = req.query;
  let records = db.all("attendance");

  if (date) records = records.filter((a) => a.date === date);
  if (playerId) records = records.filter((a) => a.playerId === Number(playerId));
  if (branchId) {
    const playerIds = db
      .all("players")
      .filter((p) => p.branchId === Number(branchId))
      .map((p) => p.id);
    records = records.filter((a) => playerIds.includes(a.playerId));
  }

  // إضافة اسم اللاعب لسهولة العرض
  const players = db.all("players");
  const withNames = records.map((r) => {
    const player = players.find((p) => p.id === r.playerId);
    return { ...r, playerName: player ? player.name : "—" };
  });

  withNames.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(withNames);
});

// تسجيل حضور/غياب لمجموعة لاعبين دفعة واحدة (جلسة تدريب في يوم معيّن)
router.post("/bulk", (req, res) => {
  const { date, records } = req.body;
  if (!date) return res.status(400).json({ error: "التاريخ مطلوب" });
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "لا توجد بيانات حضور لحفظها" });
  }

  const saved = [];
  for (const r of records) {
    const { playerId, status } = r;
    if (!playerId || !["present", "absent"].includes(status)) continue;

    // لو فيه تسجيل سابق لنفس اللاعب في نفس اليوم، نحدّثه بدل التكرار
    const existing = db
      .all("attendance")
      .find((a) => a.playerId === Number(playerId) && a.date === date);

    if (existing) {
      saved.push(db.update("attendance", existing.id, { status }));
    } else {
      saved.push(
        db.insert("attendance", {
          playerId: Number(playerId),
          date,
          status,
          createdAt: new Date().toISOString(),
        })
      );
    }
  }

  res.status(201).json({ message: "تم حفظ الحضور", count: saved.length, records: saved });
});

router.delete("/:id", (req, res) => {
  const ok = db.remove("attendance", req.params.id);
  if (!ok) return res.status(404).json({ error: "السجل غير موجود" });
  res.json({ message: "تم حذف السجل" });
});

export default router;
