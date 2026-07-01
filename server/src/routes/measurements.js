// routes/measurements.js
import express from "express";
import db from "../db.js";

const router = express.Router();

function normalizeValues(rawValues) {
  const values = {};
  if (!rawValues || typeof rawValues !== "object") return values;
  for (const [key, v] of Object.entries(rawValues)) {
    values[key] = numOrNull(v);
  }
  return values;
}

router.get("/", (req, res) => {
  const { playerId } = req.query;
  let measurements = db.all("measurements");
  if (playerId) {
    measurements = measurements.filter((m) => m.playerId === Number(playerId));
  }
  measurements.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(measurements);
});

router.post("/", (req, res) => {
  const { playerId, date, values, notes } = req.body;

  const player = db.findById("players", playerId);
  if (!player) return res.status(400).json({ error: "اللاعب غير موجود" });

  const measurement = db.insert("measurements", {
    playerId: Number(playerId),
    date: date || new Date().toISOString().slice(0, 10),
    values: normalizeValues(values),
    notes: notes?.trim() || "",
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(measurement);
});

router.put("/:id", (req, res) => {
  const existing = db.findById("measurements", req.params.id);
  if (!existing) return res.status(404).json({ error: "القياس غير موجود" });

  const { date, values, notes } = req.body;

  const updated = db.update("measurements", req.params.id, {
    date: date ?? existing.date,
    values: values !== undefined ? normalizeValues(values) : existing.values,
    notes: notes !== undefined ? notes.trim() : existing.notes,
  });

  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const ok = db.remove("measurements", req.params.id);
  if (!ok) return res.status(404).json({ error: "القياس غير موجود" });
  res.json({ message: "تم حذف القياس" });
});

function numOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export default router;
