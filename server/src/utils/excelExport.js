// utils/excelExport.js
import ExcelJS from "exceljs";
import { BRAND } from "./brand.js";

const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF232320" } };
const HEADER_FONT = { color: { argb: "FFFFFFFF" }, bold: true };
const TITLE_FONT = { bold: true, size: 14, color: { argb: "FF9E2B2B" } };

function styleHeaderRow(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCCCCCC" } },
      bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    };
  });
  row.height = 22;
}

function autoFitColumns(sheet, minWidth = 12) {
  sheet.columns.forEach((col) => {
    let max = minWidth;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 4, 40);
  });
}

function setupWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = BRAND.name;
  workbook.created = new Date();
  workbook.views = [{ rightToLeft: true }];
  return workbook;
}

function addTitleRow(sheet, title, colSpan) {
  sheet.mergeCells(1, 1, 1, colSpan);
  const cell = sheet.getCell(1, 1);
  cell.value = `${BRAND.name} - ${title}`;
  cell.font = TITLE_FONT;
  cell.alignment = { horizontal: "center" };
  sheet.getRow(1).height = 28;
  sheet.addRow([]); // صف فاضي
}

export async function buildPlayersExcel(players) {
  const workbook = setupWorkbook();
  const sheet = workbook.addWorksheet("اللاعبين", { views: [{ rightToLeft: true }] });

  const headers = ["الاسم", "السن", "الطول (سم)", "الوزن (كجم)", "الرياضة", "النادي الأصلي", "الفرع", "نسبة الحضور"];
  addTitleRow(sheet, "بيانات اللاعبين", headers.length);

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  players.forEach((p) => {
    sheet.addRow([
      p.name,
      p.age ?? "—",
      p.height ?? "—",
      p.weight ?? "—",
      p.sport || "—",
      p.originalClub || "—",
      p.branchName || "—",
      p.attendanceRate !== null ? `${p.attendanceRate}%` : "—",
    ]);
  });

  autoFitColumns(sheet);
  return workbook.xlsx.writeBuffer();
}

export async function buildMeasurementsExcel(player, measurements, exerciseTypes) {
  const workbook = setupWorkbook();
  const sheet = workbook.addWorksheet("القياسات", { views: [{ rightToLeft: true }] });

  const types = [...exerciseTypes].sort((a, b) => a.id - b.id);
  const headers = [
    "التاريخ",
    ...types.map((t) => (t.unit ? `${t.name} (${t.unit})` : t.name)),
    "ملاحظات",
  ];
  addTitleRow(sheet, `سجل قياسات - ${player.name}`, headers.length);

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  measurements.forEach((m) => {
    sheet.addRow([
      m.date,
      ...types.map((t) => m.values?.[String(t.id)] ?? "—"),
      m.notes || "",
    ]);
  });

  autoFitColumns(sheet);
  return workbook.xlsx.writeBuffer();
}

export async function buildAttendanceExcel(records, sheetTitle) {
  const workbook = setupWorkbook();
  const sheet = workbook.addWorksheet("الحضور والغياب", { views: [{ rightToLeft: true }] });

  const headers = ["اسم اللاعب", "التاريخ", "الحالة"];
  addTitleRow(sheet, sheetTitle || "تقرير الحضور والغياب", headers.length);

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  records.forEach((r) => {
    const row = sheet.addRow([r.playerName, r.date, r.status === "present" ? "حاضر" : "غائب"]);
    const statusCell = row.getCell(3);
    statusCell.font = {
      color: { argb: r.status === "present" ? "FF1E7B3E" : "FF9E2B2B" },
      bold: true,
    };
  });

  autoFitColumns(sheet);
  return workbook.xlsx.writeBuffer();
}

export async function buildBranchesExcel(branches) {
  const workbook = setupWorkbook();
  const sheet = workbook.addWorksheet("الفروع", { views: [{ rightToLeft: true }] });

  const headers = ["اسم الفرع", "الموقع", "عدد اللاعبين", "نسبة الحضور"];
  addTitleRow(sheet, "إحصائيات الفروع", headers.length);

  const headerRow = sheet.addRow(headers);
  styleHeaderRow(headerRow);

  branches.forEach((b) => {
    sheet.addRow([
      b.name,
      b.location || "—",
      b.playersCount,
      b.attendanceRate !== null ? `${b.attendanceRate}%` : "—",
    ]);
  });

  autoFitColumns(sheet);
  return workbook.xlsx.writeBuffer();
}

// تقرير شامل: كل البيانات في ملف واحد بعدة صفحات (Sheets)
export async function buildFullReportExcel({ players, branches, measurements, attendance, exerciseTypes }) {
  const workbook = setupWorkbook();

  const playersSheet = workbook.addWorksheet("اللاعبين", { views: [{ rightToLeft: true }] });
  const playersHeaders = ["الاسم", "السن", "الطول", "الوزن", "الرياضة", "النادي الأصلي", "الفرع", "نسبة الحضور"];
  addTitleRow(playersSheet, "بيانات اللاعبين", playersHeaders.length);
  styleHeaderRow(playersSheet.addRow(playersHeaders));
  players.forEach((p) =>
    playersSheet.addRow([
      p.name,
      p.age ?? "—",
      p.height ?? "—",
      p.weight ?? "—",
      p.sport || "—",
      p.originalClub || "—",
      p.branchName || "—",
      p.attendanceRate !== null ? `${p.attendanceRate}%` : "—",
    ])
  );
  autoFitColumns(playersSheet);

  const branchesSheet = workbook.addWorksheet("الفروع", { views: [{ rightToLeft: true }] });
  const branchHeaders = ["اسم الفرع", "الموقع", "عدد اللاعبين", "نسبة الحضور"];
  addTitleRow(branchesSheet, "إحصائيات الفروع", branchHeaders.length);
  styleHeaderRow(branchesSheet.addRow(branchHeaders));
  branches.forEach((b) =>
    branchesSheet.addRow([
      b.name,
      b.location || "—",
      b.playersCount,
      b.attendanceRate !== null ? `${b.attendanceRate}%` : "—",
    ])
  );
  autoFitColumns(branchesSheet);

  const measurementsSheet = workbook.addWorksheet("القياسات", { views: [{ rightToLeft: true }] });
  const playersById = Object.fromEntries(players.map((p) => [p.id, p]));
  const types = [...exerciseTypes].sort((a, b) => a.id - b.id);
  const measHeaders = [
    "اسم اللاعب",
    "التاريخ",
    ...types.map((t) => (t.unit ? `${t.name} (${t.unit})` : t.name)),
  ];
  addTitleRow(measurementsSheet, "كل القياسات المسجلة", measHeaders.length);
  styleHeaderRow(measurementsSheet.addRow(measHeaders));
  measurements.forEach((m) =>
    measurementsSheet.addRow([
      playersById[m.playerId]?.name || "—",
      m.date,
      ...types.map((t) => m.values?.[String(t.id)] ?? "—"),
    ])
  );
  autoFitColumns(measurementsSheet);

  const attendanceSheet = workbook.addWorksheet("الحضور والغياب", { views: [{ rightToLeft: true }] });
  const attHeaders = ["اسم اللاعب", "التاريخ", "الحالة"];
  addTitleRow(attendanceSheet, "سجل الحضور والغياب", attHeaders.length);
  styleHeaderRow(attendanceSheet.addRow(attHeaders));
  attendance.forEach((a) => {
    const row = attendanceSheet.addRow([
      playersById[a.playerId]?.name || "—",
      a.date,
      a.status === "present" ? "حاضر" : "غائب",
    ]);
    row.getCell(3).font = {
      color: { argb: a.status === "present" ? "FF1E7B3E" : "FF9E2B2B" },
      bold: true,
    };
  });
  autoFitColumns(attendanceSheet);

  return workbook.xlsx.writeBuffer();
}

export default {
  buildPlayersExcel,
  buildMeasurementsExcel,
  buildAttendanceExcel,
  buildBranchesExcel,
  buildFullReportExcel,
};
