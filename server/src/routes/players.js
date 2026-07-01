// routes/players.js
import express from "express";
import db from "../db.js";
import { calculateAge } from "../utils/age.js";

const router = express.Router();

function attendanceRateFor(playerId) {
  const records = db.all("attendance").filter((a) => a.playerId === playerId);
  if (records.length === 0) return null;
  const present = records.filter((a) => a.status === "present").length;
  return Math.round((present / records.length) * 100);
}

function lastMeasurementFor(playerId) {
  const records = db
    .all("measurements")
    .filter((m) => m.playerId === playerId)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  return records[0] || null;
}

function playerSummary(player) {
  const branch = db.findById("branches", player.branchId);
  return {
    ...player,
    age: calculateAge(player.birthDate),
    branchName: branch ? branch.name : null,
    attendanceRate: attendanceRateFor(player.id),
    lastMeasurement: lastMeasurementFor(player.id),
  };
}

router.get("/", (req, res) => {
  const { branchId, search } = req.query;
  let players = db.all("players");

  if (branchId) {
    players = players.filter((p) => p.branchId === Number(branchId));
  }
  if (search) {
    const q = search.trim().toLowerCase();
    players = players.filter((p) => p.name.toLowerCase().includes(q));
  }

  res.json(players.map(playerSummary));
});

router.get("/:id", (req, res) => {
  const player = db.findById("players", req.params.id);
  if (!player) return res.status(404).json({ error: "اللاعب غير موجود" });

  const measurements = db
    .all("measurements")
    .filter((m) => m.playerId === player.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const attendance = db
    .all("attendance")
    .filter((a) => a.playerId === player.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const branchHistory = db
    .all("branchHistory")
    .filter((h) => h.playerId === player.id)
    .sort((a, b) => new Date(b.movedAt) - new Date(a.movedAt));

  res.json({
    ...playerSummary(player),
    measurements,
    attendance,
    branchHistory,
  });
});

router.post("/", (req, res) => {
  const { name, birthDate, height, weight, sport, originalClub, branchId } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "اسم اللاعب مطلوب" });
  }
  if (!branchId) {
    return res.status(400).json({ error: "من فضلك اختر فرع للاعب" });
  }
  const branch = db.findById("branches", branchId);
  if (!branch) {
    return res.status(400).json({ error: "الفرع المحدد غير موجود" });
  }

  const player = db.insert("players", {
    name: name.trim(),
    birthDate: birthDate || null,
    height: height ? Number(height) : null,
    weight: weight ? Number(weight) : null,
    sport: sport?.trim() || "",
    originalClub: originalClub?.trim() || "",
    branchId: Number(branchId),
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(playerSummary(player));
});

router.put("/:id", (req, res) => {
  const existing = db.findById("players", req.params.id);
  if (!existing) return res.status(404).json({ error: "اللاعب غير موجود" });

  const { name, birthDate, height, weight, sport, originalClub } = req.body;
  const updated = db.update("players", req.params.id, {
    name: name?.trim() ?? existing.name,
    birthDate: birthDate !== undefined ? birthDate || null : existing.birthDate,
    height: height !== undefined ? Number(height) : existing.height,
    weight: weight !== undefined ? Number(weight) : existing.weight,
    sport: sport !== undefined ? sport.trim() : existing.sport,
    originalClub: originalClub !== undefined ? originalClub.trim() : existing.originalClub,
  });

  res.json(playerSummary(updated));
});

router.delete("/:id", (req, res) => {
  const ok = db.remove("players", req.params.id);
  if (!ok) return res.status(404).json({ error: "اللاعب غير موجود" });
  res.json({ message: "تم حذف اللاعب" });
});

// نقل لاعب من فرع لآخر مع الاحتفاظ بسجل النقل (بياناته السابقة كلها تفضل موجودة)
router.post("/:id/transfer", (req, res) => {
  const player = db.findById("players", req.params.id);
  if (!player) return res.status(404).json({ error: "اللاعب غير موجود" });

  const { newBranchId, note } = req.body;
  const newBranch = db.findById("branches", newBranchId);
  if (!newBranch) return res.status(400).json({ error: "الفرع الجديد غير موجود" });

  if (newBranch.id === player.branchId) {
    return res.status(400).json({ error: "اللاعب موجود في هذا الفرع بالفعل" });
  }

  db.insert("branchHistory", {
    playerId: player.id,
    fromBranchId: player.branchId,
    toBranchId: newBranch.id,
    note: note?.trim() || "",
    movedAt: new Date().toISOString(),
  });

  const updated = db.update("players", player.id, { branchId: newBranch.id });
  res.json(playerSummary(updated));
});

// مقارنة آخر قياس بالقياس السابق له (نسبة التحسن/التراجع لكل نوع قياس)
router.get("/:id/progress", (req, res) => {
  const player = db.findById("players", req.params.id);
  if (!player) return res.status(404).json({ error: "اللاعب غير موجود" });

  const measurements = db
    .all("measurements")
    .filter((m) => m.playerId === player.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (measurements.length === 0) {
    return res.json({ hasData: false, comparisons: [] });
  }

  const exerciseTypes = db.all("exerciseTypes").sort((a, b) => a.id - b.id);
  const latest = measurements[measurements.length - 1];
  const previous = measurements.length > 1 ? measurements[measurements.length - 2] : null;

  const comparisons = exerciseTypes.map((t) => {
    const key = String(t.id);
    const current = latest.values?.[key] ?? null;
    const prev = previous ? previous.values?.[key] ?? null : null;
    let change = null;
    let changePercent = null;
    let improved = null;
    if (current !== null && prev !== null && prev !== 0) {
      change = Number((current - prev).toFixed(2));
      changePercent = Number(((change / prev) * 100).toFixed(1));
      improved = t.lowerIsBetter ? change < 0 : change > 0;
    }
    return {
      key,
      typeId: t.id,
      label: t.name,
      unit: t.unit,
      lowerIsBetter: !!t.lowerIsBetter,
      current,
      previous: prev,
      change,
      changePercent,
      improved,
    };
  });

  res.json({
    hasData: true,
    latestDate: latest.date,
    previousDate: previous ? previous.date : null,
    comparisons,
    history: measurements,
  });
});

export default router;
