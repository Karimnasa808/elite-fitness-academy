// src/pages/Branches.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, MapPin, Users } from "lucide-react";
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

const emptyForm = { name: "", location: "" };

export default function Branches() {
  const { show } = useToast();
  const [branches, setBranches] = useState([]);
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
      .get("/branches")
      .then((res) => setBranches(res.data))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(branch) {
    setEditing(branch);
    setForm({ name: branch.name, location: branch.location || "" });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/branches/${editing.id}`, form);
        show("تم تعديل الفرع بنجاح");
      } else {
        await api.post("/branches", form);
        show("تم إضافة الفرع بنجاح");
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
      await api.delete(`/branches/${deleteTarget.id}`);
      show("تم حذف الفرع");
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
        title="الفروع"
        subtitle="إدارة فروع الأكاديمية المختلفة"
        action={
          <Button onClick={openAdd}>
            <Plus size={18} /> إضافة فرع
          </Button>
        }
      />

      {branches.length === 0 ? (
        <EmptyState
          title="لا توجد فروع بعد"
          message="أضف أول فرع للأكاديمية للبدء في تسجيل اللاعبين."
          action={
            <Button onClick={openAdd}>
              <Plus size={18} /> إضافة فرع
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <Card key={b.id} notched className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-bold text-lg text-ink">{b.name}</h3>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(b)}
                    className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-ink"
                    aria-label="تعديل"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(b)}
                    className="p-1.5 rounded-lg hover:bg-danger-soft text-muted hover:text-red"
                    aria-label="حذف"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {b.location && (
                <p className="text-sm text-muted flex items-center gap-1.5 mb-3">
                  <MapPin size={14} /> {b.location}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="neutral">
                  <Users size={12} className="inline ml-1" /> {b.playersCount} لاعب
                </Badge>
                <Badge variant={b.attendanceRate >= 70 ? "success" : "neutral"}>
                  {b.attendanceRate !== null ? `${b.attendanceRate}% حضور` : "بدون حضور مسجل"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "تعديل الفرع" : "إضافة فرع جديد"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="اسم الفرع" required>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: فرع المعادي"
              required
              autoFocus
            />
          </Field>
          <Field label="الموقع" hint="اختياري">
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="مثال: المعادي، القاهرة"
            />
          </Field>
          {error && <div className="bg-danger-soft text-red text-sm rounded-lg px-3.5 py-2.5">{error}</div>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={saving}>
              {editing ? "حفظ التعديلات" : "إضافة الفرع"}
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
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
      />
    </div>
  );
}
