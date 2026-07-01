// src/pages/Players.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Trash2, ArrowLeftRight, ChevronLeft } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { Field, Input, Select } from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Spinner";

const emptyForm = { name: "", birthDate: "", height: "", weight: "", sport: "", originalClub: "", branchId: "" };

export default function Players() {
  const { show } = useToast();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [transferTarget, setTransferTarget] = useState(null);
  const [transferBranchId, setTransferBranchId] = useState("");
  const [transferring, setTransferring] = useState(false);

  function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (branchFilter) params.set("branchId", branchFilter);
    Promise.all([api.get(`/players?${params}`), api.get("/branches")])
      .then(([pRes, bRes]) => {
        setPlayers(pRes.data);
        setBranches(bRes.data);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, branchFilter]);

  function openAdd() {
    setEditing(null);
    setForm({ ...emptyForm, branchId: branches[0]?.id || "" });
    setError("");
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name,
      birthDate: p.birthDate || "",
      height: p.height ?? "",
      weight: p.weight ?? "",
      sport: p.sport || "",
      originalClub: p.originalClub || "",
      branchId: p.branchId,
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/players/${editing.id}`, form);
        show("تم تعديل بيانات اللاعب");
      } else {
        await api.post("/players", form);
        show("تم إضافة اللاعب بنجاح");
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
      await api.delete(`/players/${deleteTarget.id}`);
      show("تم حذف اللاعب");
      setDeleteTarget(null);
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setDeleting(false);
    }
  }

  function openTransfer(p) {
    setTransferTarget(p);
    setTransferBranchId(branches.find((b) => b.id !== p.branchId)?.id || "");
  }

  async function handleTransfer(e) {
    e.preventDefault();
    setTransferring(true);
    try {
      await api.post(`/players/${transferTarget.id}/transfer`, { newBranchId: transferBranchId });
      show("تم نقل اللاعب للفرع الجديد");
      setTransferTarget(null);
      load();
    } catch (err) {
      show(getErrorMessage(err), "error");
    } finally {
      setTransferring(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="اللاعبين"
        subtitle="إدارة بيانات كل اللاعبين في الأكاديمية"
        action={
          <Button onClick={openAdd} disabled={branches.length === 0}>
            <Plus size={18} /> إضافة لاعب
          </Button>
        }
      />

      {branches.length === 0 && !loading ? (
        <EmptyState
          title="أضف فرع أولاً"
          message="لازم يكون فيه فرع واحد على الأقل قبل إضافة اللاعبين."
          action={<Button onClick={() => navigate("/branches")}>الذهاب لصفحة الفروع</Button>}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-[220px] max-w-xs">
              <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم..."
                className="pr-10"
              />
            </div>
            <Select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} className="max-w-[200px]">
              <option value="">كل الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>

          {loading ? (
            <PageLoader />
          ) : players.length === 0 ? (
            <EmptyState title="لا يوجد لاعبين" message="جرّب تغيير البحث أو الفلتر، أو أضف لاعب جديد." />
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ink text-white text-right">
                      <th className="px-4 py-3 font-semibold">الاسم</th>
                      <th className="px-4 py-3 font-semibold">السن</th>
                      <th className="px-4 py-3 font-semibold">الرياضة</th>
                      <th className="px-4 py-3 font-semibold">النادي الأصلي</th>
                      <th className="px-4 py-3 font-semibold">الفرع</th>
                      <th className="px-4 py-3 font-semibold">نسبة الحضور</th>
                      <th className="px-4 py-3 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((p, idx) => (
                      <tr key={p.id} className={`border-b border-border last:border-0 ${idx % 2 === 1 ? "bg-cream/50" : ""}`}>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/players/${p.id}`)}
                            className="font-semibold text-ink hover:text-red transition-colors flex items-center gap-1"
                          >
                            {p.name}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-ink/80">{p.age ?? "—"}</td>
                        <td className="px-4 py-3 text-ink/80">{p.sport || "—"}</td>
                        <td className="px-4 py-3 text-ink/80">{p.originalClub || "—"}</td>
                        <td className="px-4 py-3 text-ink/80">{p.branchName}</td>
                        <td className="px-4 py-3">
                          <Badge variant={p.attendanceRate >= 70 ? "success" : "neutral"}>
                            {p.attendanceRate !== null ? `${p.attendanceRate}%` : "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => openTransfer(p)} title="نقل لفرع آخر" className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-ink">
                              <ArrowLeftRight size={16} />
                            </button>
                            <button onClick={() => openEdit(p)} title="تعديل" className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-ink">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => setDeleteTarget(p)} title="حذف" className="p-1.5 rounded-lg hover:bg-danger-soft text-muted hover:text-red">
                              <Trash2 size={16} />
                            </button>
                            <button onClick={() => navigate(`/players/${p.id}`)} title="عرض الملف" className="p-1.5 rounded-lg hover:bg-cream text-muted hover:text-ink">
                              <ChevronLeft size={16} />
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
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "تعديل بيانات اللاعب" : "إضافة لاعب جديد"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="اسم اللاعب" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="تاريخ الميلاد" hint="السن يُحسب تلقائيًا">
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
              />
            </Field>
            <Field label="الطول (سم)">
              <Input type="number" min="0" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
            </Field>
            <Field label="الوزن (كجم)">
              <Input type="number" min="0" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الرياضة">
              <Input value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} placeholder="مثال: كاراتيه، سباحة، كرة قدم" />
            </Field>
            <Field label="النادي الأصلي" hint="اختياري — النادي أو الأكاديمية اللي اللاعب جاي منها">
              <Input value={form.originalClub} onChange={(e) => setForm({ ...form, originalClub: e.target.value })} placeholder="مثال: نادي الزمالك" />
            </Field>
          </div>
          <Field label="الفرع" required>
            <Select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} required>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </Field>
          {error && <div className="bg-danger-soft text-red text-sm rounded-lg px-3.5 py-2.5">{error}</div>}
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={saving}>
              {editing ? "حفظ التعديلات" : "إضافة اللاعب"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              إلغاء
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!transferTarget} onClose={() => setTransferTarget(null)} title="نقل اللاعب لفرع آخر" maxWidth="max-w-sm">
        <form onSubmit={handleTransfer} className="space-y-4">
          <p className="text-sm text-ink/70">
            نقل <span className="font-semibold text-ink">{transferTarget?.name}</span> من{" "}
            <span className="font-semibold text-ink">{transferTarget?.branchName}</span> إلى:
          </p>
          <Field label="الفرع الجديد" required>
            <Select value={transferBranchId} onChange={(e) => setTransferBranchId(e.target.value)} required>
              {branches
                .filter((b) => b.id !== transferTarget?.branchId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
          </Field>
          <p className="text-xs text-muted">سيتم الاحتفاظ بكل بيانات اللاعب وسجل القياسات والحضور السابقة.</p>
          <div className="flex gap-2 pt-1">
            <Button type="submit" loading={transferring}>
              تأكيد النقل
            </Button>
            <Button type="button" variant="outline" onClick={() => setTransferTarget(null)}>
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
        message={`هل أنت متأكد من حذف "${deleteTarget?.name}"؟ سيتم حذف كل بياناته وقياساته وسجل حضوره.`}
      />
    </div>
  );
}
