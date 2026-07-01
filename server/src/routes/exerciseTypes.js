// routes/exerciseTypes.js
import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const types = db.all("exerciseTypes").sort((a, b) => a.id - b.id);
  res.json(types);
});

router.post("/", (req, res) => {
  const { name, unit, lowerIsBetter } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "اسم القياس مطلوب" });
  }

  const duplicate = db
    .all("exerciseTypes")
    .find((t) => t.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (duplicate) {
    return res.status(400).json({ error: "يوجد قياس بهذا الاسم بالفعل" });
  }

  const type = db.insert("exerciseTypes", {
    name: name.trim(),
    unit: unit?.trim() || "",
    lowerIsBetter: !!lowerIsBetter,
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(type);
});

router.put("/:id", (req, res) => {
  const existing = db.findById("exerciseTypes", req.params.id);
  if (!existing) return res.status(404).json({ error: "القياس غير موجود" });

  const { name, unit, lowerIsBetter } = req.body;

  if (name && name.trim()) {
    const duplicate = db
      .all("exerciseTypes")
      .find(
        (t) =>
          t.id !== existing.id &&
          t.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
    if (duplicate) {
      return res.status(400).json({ error: "يوجد قياس بهذا الاسم بالفعل" });
    }
  }

  const updated = db.update("exerciseTypes", req.params.id, {
    name: name?.trim() || existing.name,
    unit: unit !== undefined ? unit.trim() : existing.unit,
    lowerIsBetter: lowerIsBetter !== undefined ? !!lowerIsBetter : existing.lowerIsBetter,
  });

  res.json(updated);
});

router.delete("/:id", (req, res) => {
  const typeId = Number(req.params.id);
  const existing = db.findById("exerciseTypes", typeId);
  if (!existing) return res.status(404).json({ error: "القياس غير موجود" });

  const usedInMeasurements = db
    .all("measurements")
    .some((m) => m.values && Object.prototype.hasOwnProperty.call(m.values, String(typeId)));

  if (usedInMeasurements) {
    return res.status(400).json({
      error: `لا يمكن حذف "${existing.name}" لأنه مستخدم في قياسات مسجلة من قبل. تقدر تعدّل اسمه أو وحدته بدل حذفه.`,
    });
  }

  db.remove("exerciseTypes", typeId);
  res.json({ message: "تم حذف القياس" });
});

export default router;
