// routes/reports.js
import express from "express";
import db from "../db.js";
import * as excelExport from "../utils/excelExport.js";
import * as pdfExport from "../utils/pdfExport.js";
import { calculateAge } from "../utils/age.js";

const router = express.Router();

function getPlayersWithDetails(branchId) {
  let players = db.all("players");
  if (branchId) players = players.filter((p) => p.branchId === Number(branchId));
  const branches = db.all("branches");
  const attendance = db.all("attendance");

  return players.map((p) => {
    const branch = branches.find((b) => b.id === p.branchId);
    const playerAttendance = attendance.filter((a) => a.playerId === p.id);
    const present = playerAttendance.filter((a) => a.status === "present").length;
    const attendanceRate =
      playerAttendance.length > 0 ? Math.round((present / playerAttendance.length) * 100) : null;
    return {
      ...p,
      age: calculateAge(p.birthDate),
      branchName: branch?.name || null,
      attendanceRate,
    };
  });
}

function getBranchesWithStats() {
  const branches = db.all("branches");
  const players = db.all("players");
  const attendance = db.all("attendance");

  return branches.map((b) => {
    const branchPlayers = players.filter((p) => p.branchId === b.id);
    const playerIds = branchPlayers.map((p) => p.id);
    const branchAttendance = attendance.filter((a) => playerIds.includes(a.playerId));
    const present = branchAttendance.filter((a) => a.status === "present").length;
    const attendanceRate =
      branchAttendance.length > 0 ? Math.round((present / branchAttendance.length) * 100) : null;
    return { ...b, playersCount: branchPlayers.length, attendanceRate };
  });
}

function sendFile(res, buffer, filename, mime) {
  res.setHeader("Content-Type", mime);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
  res.send(Buffer.from(buffer));
}

// ===== تقرير اللاعبين =====
router.get("/players.xlsx", async (req, res, next) => {
  try {
    const players = getPlayersWithDetails(req.query.branchId);
    const buffer = await excelExport.buildPlayersExcel(players);
    sendFile(res, buffer, "تقرير-اللاعبين.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  } catch (e) {
    next(e);
  }
});

router.get("/players.pdf", async (req, res, next) => {
  try {
    const players = getPlayersWithDetails(req.query.branchId);
    const buffer = await pdfExport.buildPlayersReportPdf(players);
    sendFile(res, buffer, "تقرير-اللاعبين.pdf", "application/pdf");
  } catch (e) {
    next(e);
  }
});

// ===== تقرير قياسات لاعب =====
router.get("/players/:id/measurements.xlsx", async (req, res, next) => {
  try {
    const player = db.findById("players", req.params.id);
    if (!player) return res.status(404).json({ error: "اللاعب غير موجود" });
    const measurements = db
      .all("measurements")
      .filter((m) => m.playerId === player.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const exerciseTypes = db.all("exerciseTypes");
    const buffer = await excelExport.buildMeasurementsExcel(player, measurements, exerciseTypes);
    sendFile(res, buffer, `قياسات-${player.name}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  } catch (e) {
    next(e);
  }
});

router.get("/players/:id/measurements.pdf", async (req, res, next) => {
  try {
    const player = db.findById("players", req.params.id);
    if (!player) return res.status(404).json({ error: "اللاعب غير موجود" });
    const branch = db.findById("branches", player.branchId);
    const measurements = db
      .all("measurements")
      .filter((m) => m.playerId === player.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const exerciseTypes = db.all("exerciseTypes");
    const buffer = await pdfExport.buildMeasurementsReportPdf(
      { ...player, branchName: branch?.name },
      measurements,
      exerciseTypes
    );
    sendFile(res, buffer, `قياسات-${player.name}.pdf`, "application/pdf");
  } catch (e) {
    next(e);
  }
});

// ===== تقرير التطور لاعب =====
router.get("/players/:id/progress.pdf", async (req, res, next) => {
  try {
    const player = db.findById("players", req.params.id);
    if (!player) return res.status(404).json({ error: "اللاعب غير موجود" });

    const measurements = db
      .all("measurements")
      .filter((m) => m.playerId === player.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (measurements.length === 0) {
      return res.status(400).json({ error: "لا توجد قياسات لهذا اللاعب بعد" });
    }

    const exerciseTypes = db.all("exerciseTypes").sort((a, b) => a.id - b.id);
    const latest = measurements[measurements.length - 1];
    const previous = measurements.length > 1 ? measurements[measurements.length - 2] : null;

    const comparisons = exerciseTypes.map((t) => {
      const key = String(t.id);
      const current = latest.values?.[key] ?? null;
      const prev = previous ? previous.values?.[key] ?? null : null;
      let changePercent = null;
      if (current !== null && prev !== null && prev !== 0) {
        changePercent = Number((((current - prev) / prev) * 100).toFixed(1));
      }
      return { label: t.name, unit: t.unit, current, previous: prev, changePercent };
    });

    const buffer = await pdfExport.buildProgressReportPdf(player, {
      latestDate: latest.date,
      previousDate: previous?.date,
      comparisons,
    });
    sendFile(res, buffer, `تطور-${player.name}.pdf`, "application/pdf");
  } catch (e) {
    next(e);
  }
});

// ===== تقرير الحضور والغياب =====
router.get("/attendance.xlsx", async (req, res, next) => {
  try {
    const { date, branchId } = req.query;
    let records = db.all("attendance");
    if (date) records = records.filter((a) => a.date === date);
    if (branchId) {
      const playerIds = db
        .all("players")
        .filter((p) => p.branchId === Number(branchId))
        .map((p) => p.id);
      records = records.filter((a) => playerIds.includes(a.playerId));
    }
    const players = db.all("players");
    const withNames = records.map((r) => ({
      ...r,
      playerName: players.find((p) => p.id === r.playerId)?.name || "—",
    }));
    const buffer = await excelExport.buildAttendanceExcel(withNames);
    sendFile(res, buffer, "تقرير-الحضور.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  } catch (e) {
    next(e);
  }
});

router.get("/attendance.pdf", async (req, res, next) => {
  try {
    const { date, branchId } = req.query;
    let records = db.all("attendance");
    if (date) records = records.filter((a) => a.date === date);
    if (branchId) {
      const playerIds = db
        .all("players")
        .filter((p) => p.branchId === Number(branchId))
        .map((p) => p.id);
      records = records.filter((a) => playerIds.includes(a.playerId));
    }
    const players = db.all("players");
    const withNames = records.map((r) => ({
      ...r,
      playerName: players.find((p) => p.id === r.playerId)?.name || "—",
    }));
    const buffer = await pdfExport.buildAttendanceReportPdf(withNames);
    sendFile(res, buffer, "تقرير-الحضور.pdf", "application/pdf");
  } catch (e) {
    next(e);
  }
});

// ===== تقرير الفروع =====
router.get("/branches.xlsx", async (req, res, next) => {
  try {
    const branches = getBranchesWithStats();
    const buffer = await excelExport.buildBranchesExcel(branches);
    sendFile(res, buffer, "تقرير-الفروع.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  } catch (e) {
    next(e);
  }
});

router.get("/branches.pdf", async (req, res, next) => {
  try {
    const branches = getBranchesWithStats();
    const buffer = await pdfExport.buildBranchesReportPdf(branches);
    sendFile(res, buffer, "تقرير-الفروع.pdf", "application/pdf");
  } catch (e) {
    next(e);
  }
});

// ===== تقرير شامل (كل البيانات) =====
router.get("/full.xlsx", async (req, res, next) => {
  try {
    const players = getPlayersWithDetails();
    const branches = getBranchesWithStats();
    const measurements = db.all("measurements");
    const attendance = db.all("attendance");
    const exerciseTypes = db.all("exerciseTypes");
    const buffer = await excelExport.buildFullReportExcel({ players, branches, measurements, attendance, exerciseTypes });
    sendFile(res, buffer, "تقرير-شامل.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  } catch (e) {
    next(e);
  }
});

export default router;
