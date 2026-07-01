// src/pages/PlayerProfile.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  FileSpreadsheet,
  FileText,
  Settings,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Field, Input, Textarea } from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { PageLoader } from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

const CHART_COLORS = ["#9E2B2B", "#B08D4F", "#1F1E1B", "#1E7B3E", "#5B7FB0", "#7A4FA0"];

function emptyMeasurementForm(types) {
  const values = {};
  types.forEach((t) => (values[t.id] = ""));
  return { date: new Date().toISOString().slice(0, 10), values, notes: "" };
}

export default function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const [player, setPlayer] = useState(null);
  const [progress, setProgress] = useState(null);
  const [exerciseTypes, setExerciseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [measModalOpen, setMeasModalOpen] = useState(false);
  const [measForm, setMeasForm] = useState({ date: "", values: {}, notes: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    Promise.all([
      api.get(`/players/${id}`),
      api.get(`/players/${id}/progress`),
      api.get(`/exercise-types`),
    ])
      .then(([pRes, progRes, typesRes]) => {
        setPlayer(pRes.data);
        setProgress(progRes.data);
        setExerciseTypes(typesRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  function openAddMeasurement() {
    setMeasForm(emptyMeasurementForm(exerciseTypes));
    setError("");
    setMeasModalOpen(true);
  }

  async function handleAddMeasurement(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/measurements", { playerId: id, ...measForm });
      show("تم إضافة القياس بنجاح");
      setMeasModalOpen(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  function downloadReport(type, format) {
    const token = localStorage.getItem("efa_token");
    const url =
      type === "measurements"
        ? `/api/reports/players/${id}/measurements.${format}`
        : `/api/reports/players/${id}/progress.pdf`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error("فشل تحميل التقرير");
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        const href = URL.createObjectURL(blob);
        a.href = href;
        a.download = `${player.name}-${type}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(href);
      })
      .catch(() => show("فشل تحميل التقرير", "error"));
  }

  if (loading) return <PageLoader />;
  if (!player) return null;

  const chartTypes = exerciseTypes.slice(0, 3);
  const chartData = player.measurements.map((m) => {
    const row = { date: m.date };
    chartTypes.forEach((t) => {
      row[t.name] = m.values?.[String(t.id)] ?? null;
    });
    return row;
  });

  return (
    <div>
      <button
        onClick={() => navigate("/players")}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-4 transition-colors"
      >
        <ArrowRight size={16} /> رجوع لقائمة اللاعبين
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">{player.name}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="neutral">{player.branchName}</Badge>
            {player.sport && <Badge variant="gold">{player.sport}</Badge>}
            {player.originalClub && <Badge variant="neutral">نادي: {player.originalClub}</Badge>}
            <Badge variant={player.attendanceRate >= 70 ? "success" : "neutral"}>
              {player.attendanceRate !== null ? `${player.attendanceRate}% نسبة الحضور` : "بدون حضور مسجل"}
            </Badge>
          </div>
          <div className="h-[3px] w-16 bg-red rounded-full mt-3" />
        </div>
        {exerciseTypes.length > 0 ? (
          <Button onClick={openAddMeasurement}>
            <Plus size={18} /> تسجيل قياس جديد
          </Button>
        ) : (
          <Button variant="outline" onClick={() => navigate("/exercise-types")}>
            <Settings size={18} /> حدّد أنواع القياسات أولاً
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 lg:col-span-1">
          <h3 className="font-display font-bold text-ink mb-3">البيانات الأساسية</h3>
          <dl className="space-y-2.5 text-sm">
            <Row label="السن" value={player.age ? `${player.age} سنة` : "—"} />
            <Row label="تاريخ الميلاد" value={player.birthDate || "—"} />
            <Row label="الطول" value={player.height ? `${player.height} سم` : "—"} />
            <Row label="الوزن" value={player.weight ? `${player.weight} كجم` : "—"} />
            <Row label="الرياضة" value={player.sport || "—"} />
            <Row label="النادي الأصلي" value={player.originalClub || "—"} />
            <Row label="الفرع الحالي" value={player.branchName} />
          </dl>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-ink">مقارنة آخر قياسين</h3>
            {progress?.hasData && (
              <span className="text-xs text-muted">
                {progress.previousDate || "—"} ← {progress.latestDate}
              </span>
            )}
          </div>
          {!progress?.hasData ? (
            <EmptyState title="لا توجد قياسات بعد" message="سجّل أول قياس لمتابعة تطور اللاعب." />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {progress.comparisons.map((c) => (
                <ProgressTile key={c.key} comparison={c} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {player.measurements.length > 1 && chartTypes.length > 0 && (
        <Card className="p-5 mb-6">
          <h3 className="font-display font-bold text-ink mb-1">تطور الأداء عبر الزمن</h3>
          <p className="text-xs text-muted mb-4">
            يعرض أول {chartTypes.length} أنواع قياسات معرّفة في النظام
          </p>
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3DCC9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8A8580" }} />
                <YAxis tick={{ fontSize: 11, fill: "#8A8580" }} />
                <Tooltip contentStyle={{ fontFamily: "Cairo", borderRadius: 8, borderColor: "#E3DCC9" }} />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: "Cairo" }} />
                {chartTypes.map((t, i) => (
                  <Line
                    key={t.id}
                    type="monotone"
                    dataKey={t.name}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card className="p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="font-display font-bold text-ink">سجل القياسات الكامل</h3>
          {player.measurements.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadReport("measurements", "xlsx")}>
                <FileSpreadsheet size={15} /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadReport("measurements", "pdf")}>
                <FileText size={15} /> PDF
              </Button>
            </div>
          )}
        </div>
        {player.measurements.length === 0 ? (
          <EmptyState title="لا توجد قياسات مسجلة" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink text-white text-right">
                  <th className="px-3 py-2.5 font-semibold whitespace-nowrap">التاريخ</th>
                  {exerciseTypes.map((t) => (
                    <th key={t.id} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...player.measurements].reverse().map((m, idx) => (
                  <tr key={m.id} className={`border-b border-border last:border-0 ${idx % 2 === 1 ? "bg-cream/50" : ""}`}>
                    <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{m.date}</td>
                    {exerciseTypes.map((t) => {
                      const v = m.values?.[String(t.id)];
                      return (
                        <td key={t.id} className="px-3 py-2.5 text-ink/80 whitespace-nowrap">
                          {v ?? "—"} {v != null && t.unit}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-display font-bold text-ink mb-4">سجل الحضور والغياب</h3>
          {player.attendance.length === 0 ? (
            <EmptyState title="لا يوجد سجل حضور بعد" />
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {player.attendance.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b border-border last:border-0 pb-2 last:pb-0">
                  <span className="text-sm text-ink/80">{a.date}</span>
                  <Badge variant={a.status === "present" ? "success" : "danger"}>
                    {a.status === "present" ? "حاضر" : "غائب"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-ink mb-4">سجل نقل الفروع</h3>
          {player.branchHistory.length === 0 ? (
            <EmptyState title="لم يتم نقل اللاعب من قبل" />
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto scrollbar-thin">
              {player.branchHistory.map((h) => (
                <div key={h.id} className="text-sm border-b border-border last:border-0 pb-2.5 last:pb-0">
                  <p className="text-ink/80">{new Date(h.movedAt).toLocaleDateString("ar-EG")}</p>
                  {h.note && <p className="text-xs text-muted mt-0.5">{h.note}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal open={measModalOpen} onClose={() => setMeasModalOpen(false)} title="تسجيل قياس جديد">
        <form onSubmit={handleAddMeasurement} className="space-y-4">
          <Field label="التاريخ" required>
            <Input
              type="date"
              value={measForm.date}
              onChange={(e) => setMeasForm({ ...measForm, date: e.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {exerciseTypes.map((t) => (
              <Field key={t.id} label={`${t.name}${t.unit ? ` (${t.unit})` : ""}`}>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={measForm.values[t.id] ?? ""}
                  onChange={(e) =>
                    setMeasForm({
                      ...measForm,
                      values: { ...measForm.values, [t.id]: e.target.value },
                    })
                  }
                />
              </Field>
            ))}
          </div>
          <Field label="ملاحظات" hint="اختياري">
            <Textarea
              rows={2}
              value={measForm.notes}
              onChange={(e) => setMeasForm({ ...measForm, notes: e.target.value })}
            />
          </Field>
          {error && <div className="bg-danger-soft text-red text-sm rounded-lg px-3.5 py-2.5">{error}</div>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={saving}>
              حفظ القياس
            </Button>
            <Button type="button" variant="outline" onClick={() => setMeasModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  );
}

function ProgressTile({ comparison: c }) {
  const hasComparison = c.changePercent !== null;
  const Icon = !hasComparison ? Minus : c.improved ? TrendingUp : TrendingDown;
  const color = !hasComparison ? "text-muted" : c.improved ? "text-success" : "text-red";

  return (
    <div className="border border-border rounded-xl p-3 bg-cream/40">
      <p className="text-xs text-muted mb-1">
        {c.label}
        {c.unit ? ` (${c.unit})` : ""}
      </p>
      <p className="font-display font-bold text-lg text-ink">{c.current ?? "—"}</p>
      <div className={`flex items-center gap-1 text-xs font-semibold mt-1 ${color}`}>
        <Icon size={13} />
        {c.changePercent !== null ? `${c.changePercent > 0 ? "+" : ""}${c.changePercent}%` : "بدون مقارنة"}
      </div>
    </div>
  );
}
