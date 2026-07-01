// routes/branches.js
import express from "express";
import db from "../db.js";

const router = express.Router();

function branchWithStats(branch) {
  const players = db.all("players").filter((p) => p.branchId === branch.id);
  const playerIds = players.map((p) => p.id);
  const attendance = db
    .all("attendance")
    .filter((a) => playerIds.includes(a.playerId));
  const present = attendance.filter((a) => a.status === "present").length;
  const attendanceRate =
    attendance.length > 0 ? Math.round((present / attendance.length) * 100) : null;

  return {
    ...branch,
    playersCount: players.length,
    attendanceRate,
  };
}

router.get("/", (req, res) => {
  const branches = db.all("branches");
  res.json(branches.map(branchWithStats));
});

router.get("/:id", (req, res) => {
  const branch = db.findById("branches", req.params.id);
  if (!branch) return res.status(404).json({ error: "الفرع غير موجود" });
  res.json(branchWithStats(branch));
});

router.post("/", (req, res) => {
  const { name, location } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "اسم الفرع مطلوب" });
  }
  const branch = db.insert("branches", {
    name: name.trim(),
    location: location?.trim() || "",
    createdAt: new Date().toISOString(),
  });
  res.status(201).json(branchWithStats(branch));
});

router.put("/:id", (req, res) => {
  const { name, location } = req.body;
  const existing = db.findById("branches", req.params.id);
  if (!existing) return res.status(404).json({ error: "الفرع غير موجود" });

  const updated = db.update("branches", req.params.id, {
    name: name?.trim() || existing.name,
    location: location !== undefined ? location.trim() : existing.location,
  });
  res.json(branchWithStats(updated));
});

router.delete("/:id", (req, res) => {
  const branchId = Number(req.params.id);
  const playersInBranch = db.all("players").filter((p) => p.branchId === branchId);
  if (playersInBranch.length > 0) {
    return res.status(400).json({
      error: `لا يمكن حذف الفرع لأنه يحتوي على ${playersInBranch.length} لاعب. نقل اللاعبين لفرع آخر أولاً.`,
    });
  }
  const ok = db.remove("branches", req.params.id);
  if (!ok) return res.status(404).json({ error: "الفرع غير موجود" });
  res.json({ message: "تم حذف الفرع" });
});

export default router;
