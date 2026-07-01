// src/pages/ExerciseTypes.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Dumbbell, ArrowDownUp } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { Field, Input } from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Spinner";

const emptyForm = { name: "", unit: "", lowerIsBetter: false };

export default function ExerciseTypes() {
  const { show } = useToast();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    setLoading(true);
    api
      .get("/exercise-types")
      .then((res) => setTypes(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(t) {
    setEditing(t);
    setForm({ name: t.name, unit: t.unit || "", lowerIsBetter: !!t.lowerIsBetter });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/exercise-types/${editing.id}`, form);
        show("تم تعديل القياس بنجاح");
      } else {
        await api.post("/exercise-types", form);
        show("تم إضافة القياس بنجاح");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/exercise-types/${deleteTarget.id}`);
      show("تم حذف القياس");
      setDeleteTarget(null);
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="أنواع القياسات"
        subtitle="حدّد بنفسك التمارين والقياسات التي يتابعها النظام لكل لاعب"
        action={
          <Button onClick={openAdd}>
            <Plus size={18} /> إضافة قياس جديد
          </Button>
        }
      />

      {types.length === 0 ? (
        <EmptyState
          title="لا توجد قياسات معرّفة بعد"
          message="أضف أول نوع قياس (مثلاً Pull-ups أو زمن جري 100 متر) لتبدأ في تسجيله لللاعبين."
          action={
            <Button onClick={openAdd}>
              <Plus size={18} /> إضافة قياس جديد
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink text-white text-right">
                  <th className="px-4 py-3 font-semibold">اسم القياس</th>
                  <th className="px-4 py-3 font-semibold">الوحدة</th>
                  <th className="px-4 py-3 font-semibold">معيار التحسن</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {types.map((t, idx) => (
                  <tr key={t.id} className={`border-b border-border last:border-0 ${idx % 2 === 1 ? "bg-cream/50" : ""}`}>
                    <td className="px-4 py-3 font-semibold text-ink flex items-center gap-2">
                      <Dumbbell size={15} className="text-red" />
                      {t.name}
                    </td>
                    <td className="px-4 py-3 text-ink/80">{t.unit || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={t.lowerIsBetter ? "gold" : "success"}>
                        {t.lowerIsBetter ? "الأقل هو الأفضل (زمن مثلًا)" : "الأكثر هو الأفضل"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(t)} title="تعديل" className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-ink">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteTarget(t)} title="حذف" className="p-1.5 rounded-lg hover:bg-danger-soft text-muted hover:text-red">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "تعديل القياس" : "إضافة قياس جديد"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="اسم القياس" required hint="مثال: Pull-ups, Plank, زمن جري 100 متر">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: Pull-ups"
              required
              autoFocus
            />
          </Field>
          <Field label="الوحدة" hint="اختياري — مثال: ثانية، سم، متر، كجم. سيبها فاضية لو القياس عدد بسيط (تكرارات)">
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="مثال: ثانية"
            />
          </Field>

          <label className="flex items-start gap-2.5 bg-cream/60 rounded-lg p-3 cursor-pointer border border-border">
            <input
              type="checkbox"
              checked={form.lowerIsBetter}
              onChange={(e) => setForm({ ...form, lowerIsBetter: e.target.checked })}
              className="mt-0.5 h-4 w-4 accent-red"
            />
            <span className="text-sm">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <ArrowDownUp size={14} /> الأقل هو الأفضل
              </span>
              <span className="text-muted block mt-0.5">
                فعّل ده لو القياس زمني (مثلاً زمن جري 100 متر) — يعني التحسن هنا معناه إن الرقم يقل، مش يزيد.
              </span>
            </span>
          </label>

          {error && <div className="bg-danger-soft text-red text-sm rounded-lg px-3.5 py-2.5">{error}</div>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={saving}>
              {editing ? "حفظ التعديلات" : "إضافة القياس"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لو القياس ده مسجّل لأي لاعب من قبل، الحذف هيُرفض ولازم تعدّله بدل حذفه.`}
      />
    </div>
  );
}
