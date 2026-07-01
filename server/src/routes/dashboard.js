// routes/dashboard.js
import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  const players = db.all("players");
  const branches = db.all("branches");
  const attendance = db.all("attendance");
  const measurements = db.all("measurements");

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = attendance.filter((a) => a.date === today);
  const todayPresent = todayAttendance.filter((a) => a.status === "present").length;
  const todayAbsent = todayAttendance.filter((a) => a.status === "absent").length;

  const branchBreakdown = branches.map((b) => {
    const branchPlayers = players.filter((p) => p.branchId === b.id);
    const playerIds = branchPlayers.map((p) => p.id);
    const branchAttendance = attendance.filter((a) => playerIds.includes(a.playerId));
    const present = branchAttendance.filter((a) => a.status === "present").length;
    const attendanceRate =
      branchAttendance.length > 0
        ? Math.round((present / branchAttendance.length) * 100)
        : null;
    return {
      id: b.id,
      name: b.name,
      playersCount: branchPlayers.length,
      attendanceRate,
    };
  });

  const recentMeasurements = [...measurements]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8)
    .map((m) => {
      const player = players.find((p) => p.id === m.playerId);
      return { ...m, playerName: player ? player.name : "—" };
    });

  const overallPresent = attendance.filter((a) => a.status === "present").length;
  const overallAttendanceRate =
    attendance.length > 0 ? Math.round((overallPresent / attendance.length) * 100) : null;

  res.json({
    totals: {
      players: players.length,
      branches: branches.length,
      measurementsLogged: measurements.length,
      overallAttendanceRate,
    },
    today: {
      date: today,
      present: todayPresent,
      absent: todayAbsent,
      totalMarked: todayAttendance.length,
    },
    branchBreakdown,
    recentMeasurements,
  });
});

export default router;
