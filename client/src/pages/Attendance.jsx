// src/pages/Attendance.jsx
import { useEffect, useState } from "react";
import { Check, X, Save, FileSpreadsheet, FileText } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Select, Input } from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Spinner";

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function Attendance() {
  const { show } = useToast();
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [players, setPlayers] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/branches").then((res) => {
      setBranches(res.data);
      if (res.data.length > 0) setBranchId(String(res.data[0].id));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true);
    Promise.all([
      api.get(`/players?branchId=${branchId}`),
      api.get(`/attendance?branchId=${branchId}&date=${date}`),
    ]).then(([pRes, aRes]) => {
      setPlayers(pRes.data);
      const initial = {};
      pRes.data.forEach((p) => {
        const existing = aRes.data.find((a) => a.playerId === p.id);
        initial[p.id] = existing ? existing.status : null;
      });
      setStatuses(initial);
      setLoading(false);
    });
  }, [branchId, date]);

  function setStatus(playerId, status) {
    setStatuses((prev) => ({ ...prev, [playerId]: status }));
  }

  function markAll(status) {
    const next = {};
    players.forEach((p) => (next[p.id] = status));
    setStatuses(next);
  }

  async function handleSave() {
    const records = Object.entries(statuses)
      .filter(([, status]) => status)
      .map(([playerId, status]) => ({ playerId: Number(playerId), status }));

    if (records.length === 0) {
      show("حدد حضور أو غياب على الأقل لاعب واحد", "error");
      return;
    }

    setSaving(true);
    try {
      await api.post("/attendance/bulk", { date, records });
      show("تم حفظ الحضور بنجاح");
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  function downloadReport(format) {
    const token = localStorage.getItem("efa_token");
    const url = `/api/reports/attendance.${format}?branchId=${branchId}&date=${date}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const a = document.createElement("a");
        const href = URL.createObjectURL(blob);
        a.href = href;
        a.download = `حضور-${date}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
      })
      .catch(() => show("فشل تحميل التقرير", "error"));
  }

  const presentCount = Object.values(statuses).filter((s) => s === "present").length;
  const absentCount = Object.values(statuses).filter((s) => s === "absent").length;

  return (
    <div>
      <PageHeader title="الحضور والغياب" subtitle="تسجيل حضور اللاعبين لكل جلسة تدريب" />

      {branches.length === 0 ? (
        <EmptyState title="لا توجد فروع بعد" message="أضف فرعًا أولاً من صفحة الفروع." />
      ) : (
        <>
          <Card className="p-4 mb-5 flex flex-wrap items-end gap-3">
            <div className="min-w-[180px]">
              <label className="block text-xs font-semibold text-ink/70 mb-1.5">الفرع</label>
              <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-[160px]">
              <label className="block text-xs font-semibold text-ink/70 mb-1.5">التاريخ</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex gap-2 mr-auto">
              <Button size="sm" variant="outline" onClick={() => markAll("present")}>
                تحديد الكل حاضر
              </Button>
              <Button size="sm" variant="outline" onClick={() => markAll("absent")}>
                تحديد الكل غائب
              </Button>
            </div>
          </Card>

          {loading ? (
            <PageLoader />
          ) : players.length === 0 ? (
            <EmptyState title="لا يوجد لاعبين في هذا الفرع" />
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <Badge variant="success">حاضر: {presentCount}</Badge>
                <Badge variant="danger">غائب: {absentCount}</Badge>
                <Badge variant="neutral">المتبقي: {players.length - presentCount - absentCount}</Badge>
              </div>

              <Card className="overflow-hidden mb-5">
                <div className="divide-y divide-border">
                  {players.map((p) => (
                    <div key={p.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm text-ink">{p.name}</p>
                        <p className="text-xs text-muted">{p.sport || "—"}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setStatus(p.id, "present")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            statuses[p.id] === "present"
                              ? "bg-success text-white border-success"
                              : "border-border text-ink/70 hover:bg-success-soft"
                          }`}
                        >
                          <Check size={14} /> حاضر
                        </button>
                        <button
                          onClick={() => setStatus(p.id, "absent")}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            statuses[p.id] === "absent"
                              ? "bg-red text-white border-red"
                              : "border-border text-ink/70 hover:bg-danger-soft"
                          }`}
                        >
                          <X size={14} /> غائب
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} loading={saving}>
                  <Save size={18} /> حفظ الحضور
                </Button>
                <Button variant="outline" onClick={() => downloadReport("xlsx")}>
                  <FileSpreadsheet size={16} /> تصدير Excel
                </Button>
                <Button variant="outline" onClick={() => downloadReport("pdf")}>
                  <FileText size={16} /> تصدير PDF
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
