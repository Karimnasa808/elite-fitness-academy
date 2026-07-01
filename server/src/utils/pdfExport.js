// utils/pdfExport.js
import pdfmake from "pdfmake-rtl";
import Roboto from "pdfmake-rtl/fonts/Roboto.js";
import Cairo from "pdfmake-rtl/fonts/Cairo.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { BRAND } from "./brand.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

pdfmake.addFonts(Roboto);
pdfmake.addFonts(Cairo);

const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");
let logoBase64Cache = null;
function getLogoBase64() {
  if (!logoBase64Cache) {
    logoBase64Cache = "data:image/png;base64," + fs.readFileSync(LOGO_PATH).toString("base64");
  }
  return logoBase64Cache;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * يبني تعريف PDF كامل (header/footer/محتوى) ويرجع Buffer جاهز للتنزيل.
 * @param {string} reportTitle - عنوان التقرير بالعربي يظهر تحت اسم الأكاديمية
 * @param {Array} content - محتوى pdfmake (فقرات/جداول)
 */
export function buildBrandedPdf(reportTitle, content) {
  const docDefinition = {
    rtl: true,
    pageMargins: [40, 95, 40, 50],
    pageSize: "A4",
    header: (currentPage, pageCount) => ({
      margin: [40, 18, 40, 0],
      columns: [
        { image: getLogoBase64(), width: 38 },
        {
          width: "*",
          margin: [10, 2, 0, 0],
          stack: [
            { text: BRAND.name, bold: true, fontSize: 14, alignment: "left" },
            { text: reportTitle, fontSize: 10, color: BRAND.colors.red, alignment: "left" },
          ],
        },
        {
          width: 100,
          alignment: "right",
          fontSize: 8,
          color: BRAND.colors.gray,
          text: `صفحة ${currentPage} من ${pageCount}`,
        },
      ],
    }),
    footer: () => ({
      margin: [0, 8, 0, 0],
      fontSize: 8,
      color: BRAND.colors.gray,
      alignment: "center",
      text: `تم إنشاء هذا التقرير بواسطة نظام ${BRAND.name} - ${todayIso()}`,
    }),
    content: [
      {
        canvas: [
          { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: BRAND.colors.red },
        ],
        margin: [0, 0, 0, 14],
      },
      ...content,
    ],
    defaultStyle: { font: "Cairo", fontSize: 10, color: BRAND.colors.ink },
  };

  const pdfDoc = pdfmake.createPdf(docDefinition);
  return pdfDoc.getBuffer();
}

function tableHeader(cells) {
  return cells.map((c) => ({
    text: c,
    bold: true,
    fillColor: BRAND.colors.ink,
    color: "#FFFFFF",
    fontSize: 9,
    margin: [0, 4, 0, 4],
  }));
}

function tableCell(text) {
  return { text: text === null || text === undefined || text === "" ? "—" : String(text), fontSize: 9 };
}

// ---------- تقرير بيانات اللاعبين ----------
export async function buildPlayersReportPdf(players) {
  const rows = players.map((p) => [
    tableCell(p.branchName),
    tableCell(p.originalClub),
    tableCell(p.sport),
    tableCell(p.weight ? `${p.weight} كجم` : ""),
    tableCell(p.height ? `${p.height} سم` : ""),
    tableCell(p.age),
    tableCell(p.name),
  ]);

  const content = [
    {
      text: `إجمالي عدد اللاعبين: ${players.length}`,
      margin: [0, 0, 0, 10],
      bold: true,
    },
    {
      table: {
        headerRows: 1,
        widths: ["*", "*", "*", "*", "*", 40, "*"],
        body: [
          tableHeader(["الفرع", "النادي الأصلي", "الرياضة", "الوزن", "الطول", "السن", "الاسم"]),
          ...rows,
        ],
      },
      layout: {
        fillColor: (rowIndex) => (rowIndex % 2 === 0 && rowIndex !== 0 ? BRAND.colors.cream : null),
      },
    },
  ];

  return buildBrandedPdf("تقرير بيانات اللاعبين", content);
}

// ---------- تقرير القياسات ----------
export async function buildMeasurementsReportPdf(player, measurements, exerciseTypes) {
  const types = [...exerciseTypes].sort((a, b) => a.id - b.id);

  const rows = measurements.map((m) => [
    ...types
      .map((t) => tableCell(m.values?.[String(t.id)]))
      .reverse(),
    tableCell(m.date),
  ]);

  const headerLabels = [
    ...types.map((t) => (t.unit ? `${t.name} (${t.unit})` : t.name)).reverse(),
    "التاريخ",
  ];

  const content = [
    { text: `اللاعب: ${player.name}`, margin: [0, 0, 0, 2] },
    { text: `الفرع: ${player.branchName || "—"}`, margin: [0, 0, 0, 10] },
    {
      table: {
        headerRows: 1,
        widths: types.map(() => "*").concat(["*"]),
        body: [tableHeader(headerLabels), ...rows],
      },
    },
  ];

  return buildBrandedPdf(`سجل القياسات - ${player.name}`, content);
}

// ---------- تقرير الحضور والغياب ----------
export async function buildAttendanceReportPdf(records, contextLabel) {
  const rows = records.map((r) => [
    tableCell(r.status === "present" ? "حاضر" : "غائب"),
    tableCell(r.date),
    tableCell(r.playerName),
  ]);

  const presentCount = records.filter((r) => r.status === "present").length;
  const rate = records.length ? Math.round((presentCount / records.length) * 100) : 0;

  const content = [
    { text: contextLabel || "تقرير الحضور والغياب", margin: [0, 0, 0, 4], bold: true },
    { text: `نسبة الحضور: ${rate}% (${presentCount} من ${records.length})`, margin: [0, 0, 0, 10] },
    {
      table: {
        headerRows: 1,
        widths: ["*", "*", "*"],
        body: [tableHeader(["الحالة", "التاريخ", "اسم اللاعب"]), ...rows],
      },
    },
  ];

  return buildBrandedPdf("تقرير الحضور والغياب", content);
}

// ---------- تقرير إحصائيات الفروع ----------
export async function buildBranchesReportPdf(branches) {
  const rows = branches.map((b) => [
    tableCell(b.attendanceRate !== null ? `${b.attendanceRate}%` : "—"),
    tableCell(b.playersCount),
    tableCell(b.location),
    tableCell(b.name),
  ]);

  const content = [
    {
      table: {
        headerRows: 1,
        widths: ["*", "*", "*", "*"],
        body: [tableHeader(["نسبة الحضور", "عدد اللاعبين", "الموقع", "اسم الفرع"]), ...rows],
      },
    },
  ];

  return buildBrandedPdf("تقرير إحصائيات الفروع", content);
}

// ---------- تقرير مقارنة التطور (لاعب واحد) ----------
export async function buildProgressReportPdf(player, progress) {
  const rows = progress.comparisons.map((c) => [
    tableCell(
      c.changePercent !== null ? `${c.changePercent > 0 ? "+" : ""}${c.changePercent}%` : "—"
    ),
    tableCell(c.previous),
    tableCell(c.current),
    tableCell(c.unit ? `${c.label} (${c.unit})` : c.label),
  ]);

  const content = [
    { text: `اللاعب: ${player.name}`, margin: [0, 0, 0, 2] },
    {
      text: `مقارنة بين قياس ${progress.latestDate} وقياس ${progress.previousDate || "—"}`,
      margin: [0, 0, 0, 10],
      color: BRAND.colors.gray,
      fontSize: 9,
    },
    {
      table: {
        headerRows: 1,
        widths: ["*", "*", "*", "*"],
        body: [
          tableHeader(["نسبة التغيير", "القياس السابق", "القياس الحالي", "التمرين"]),
          ...rows,
        ],
      },
    },
  ];

  return buildBrandedPdf(`تقرير التطور - ${player.name}`, content);
}

export default {
  buildBrandedPdf,
  buildPlayersReportPdf,
  buildMeasurementsReportPdf,
  buildAttendanceReportPdf,
  buildBranchesReportPdf,
  buildProgressReportPdf,
};
