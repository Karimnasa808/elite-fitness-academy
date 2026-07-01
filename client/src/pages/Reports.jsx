// src/pages/Reports.jsx
import { useEffect, useState } from "react";
import { FileSpreadsheet, FileText, Users, Building2, CalendarCheck2, Layers } from "lucide-react";
import api from "../api/client";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Select, Input } from "../components/ui/Input";

function downloadFile(url, filename, show) {
  const token = localStorage.getItem("efa_token");
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (!res.ok) throw new Error();
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    })
    .catch(() => show("فشل تحميل التقرير", "error"));
}

export default function Reports() {
  const { show } = useToast();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    api.get("/branches").then((res) => setBranches(res.data));
  }, []);

  const reportCards = [
    {
      icon: Users,
      title: "تقرير بيانات اللاعبين",
      description: "كل بيانات اللاعبين، الفروع، السن، الوزن، الطول، والرياضة.",
      filters: true,
      onExport: (format) =>
        downloadFile(
          `/api/reports/players.${format}${branchId ? `?branchId=${branchId}` : ""}`,
          `تقرير-اللاعبين.${format}`,
          show
        ),
    },
    {
      icon: CalendarCheck2,
      title: "تقرير الحضور والغياب",
      description: "سجل الحضور والغياب، يمكن تصفيته بالفرع والتاريخ.",
      filters: true,
      showDate: true,
      onExport: (format) => {
        const params = new URLSearchParams();
        if (branchId) params.set("branchId", branchId);
        if (date) params.set("date", date);
        downloadFile(`/api/reports/attendance.${format}?${params}`, `تقرير-الحضور.${format}`, show);
      },
    },
    {
      icon: Building2,
      title: "تقرير إحصائيات الفروع",
      description: "عدد اللاعبين ونسبة الحضور في كل فرع.",
      filters: false,
      onExport: (format) => downloadFile(`/api/reports/branches.${format}`, `تقرير-الفروع.${format}`, show),
    },
    {
      icon: Layers,
      title: "تقرير شامل (كل البيانات)",
      description: "ملف Excel واحد بكل البيانات: لاعبين، فروع، قياسات، وحضور — كل واحدة في صفحة.",
      filters: false,
      excelOnly: true,
      onExport: () => downloadFile(`/api/reports/full.xlsx`, `تقرير-شامل.xlsx`, show),
    },
  ];

  return (
    <div>
      <PageHeader title="التقارير والتصدير" subtitle="استخراج البيانات كملفات Excel أو PDF" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportCards.map((card) => (
          <Card key={card.title} notched className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="bg-red/10 text-red rounded-xl p-2.5">
                <card.icon size={20} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink">{card.title}</h3>
                <p className="text-sm text-muted mt-1">{card.description}</p>
              </div>
            </div>

            {card.filters && (
              <div className="flex flex-wrap gap-2 mb-4">
                <Select value={branchId} onChange={(e) => setBranchId(e.target.value)} className="max-w-[180px]">
                  <option value="">كل الفروع</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
                {card.showDate && (
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="max-w-[170px]"
                  />
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => card.onExport("xlsx")}>
                <FileSpreadsheet size={15} /> Excel
              </Button>
              {!card.excelOnly && (
                <Button size="sm" variant="outline" onClick={() => card.onExport("pdf")}>
                  <FileText size={15} /> PDF
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
