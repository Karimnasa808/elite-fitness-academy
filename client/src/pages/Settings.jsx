// src/pages/Settings.jsx
import { useRef, useState } from "react";
import { KeyRound, Download, Upload, DatabaseBackup } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import PageHeader from "../components/PageHeader";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Field, Input } from "../components/ui/Input";

export default function Settings() {
  const { coach } = useAuth();
  const { show } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirmFile, setConfirmFile] = useState(null);
  const [restoreError, setRestoreError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("كلمة المرور الجديدة وتأكيدها غير متطابقين");
      return;
    }
    if (newPassword.length < 6) {
      setError("كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setSaving(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      show("تم تغيير كلمة المرور بنجاح");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadBackup() {
    setDownloading(true);
    try {
      const token = localStorage.getItem("efa_token");
      const res = await fetch("/api/backup/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      const href = URL.createObjectURL(blob);
      a.href = href;
      a.download = `elite-fitness-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      show("تم تنزيل النسخة الاحتياطية بنجاح");
    } catch {
      show("فشل تنزيل النسخة الاحتياطية", "error");
    } finally {
      setDownloading(false);
    }
  }

  function handleFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreError("");
    setConfirmFile(file);
    e.target.value = "";
  }

  async function handleConfirmRestore() {
    if (!confirmFile) return;
    setRestoring(true);
    setRestoreError("");
    try {
      const text = await confirmFile.text();
      const json = JSON.parse(text);
      await api.post("/backup/restore", json);
      show("تم استرجاع النسخة الاحتياطية بنجاح، البيانات الجديدة ظاهرة الآن");
      setConfirmFile(null);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setRestoreError("الملف المختار ليس ملف نسخة احتياطية صحيح (JSON غير سليم)");
      } else {
        setRestoreError(getErrorMessage(err));
      }
    } finally {
      setRestoring(false);
    }
  }

  return (
    <div>
      <PageHeader title="الإعدادات" subtitle="إدارة حساب المدرب والنسخ الاحتياطي" />

      <Card className="p-5 max-w-md mb-5">
        <h3 className="font-display font-bold text-ink mb-3">بيانات الحساب</h3>
        <p className="text-sm text-ink/70">
          الاسم: <span className="font-semibold text-ink">{coach?.name}</span>
        </p>
        <p className="text-sm text-ink/70 mt-1">
          اسم المستخدم: <span className="font-semibold text-ink">{coach?.username}</span>
        </p>
      </Card>

      <Card className="p-5 max-w-md mb-5">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={18} className="text-red" />
          <h3 className="font-display font-bold text-ink">تغيير كلمة المرور</h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="كلمة المرور الحالية" required>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="كلمة المرور الجديدة" required hint="6 أحرف على الأقل">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </Field>
          <Field label="تأكيد كلمة المرور الجديدة" required>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Field>
          {error && <div className="bg-danger-soft text-red text-sm rounded-lg px-3.5 py-2.5">{error}</div>}
          <Button type="submit" loading={saving}>
            حفظ كلمة المرور الجديدة
          </Button>
        </form>
      </Card>

      <Card className="p-5 max-w-md">
        <div className="flex items-center gap-2 mb-2">
          <DatabaseBackup size={18} className="text-red" />
          <h3 className="font-display font-bold text-ink">النسخ الاحتياطي للبيانات</h3>
        </div>
        <p className="text-sm text-muted mb-4">
          نزّل نسخة من كل بيانات النظام (اللاعبين، الفروع، القياسات، الحضور) في ملف واحد، واحتفظ
          به في مكان آمن (فلاشة أو جوجل درايف). لو حصلت مشكلة في الجهاز، تقدر ترجّع كل بياناتك من
          نفس الملف.
        </p>

        <div className="flex flex-wrap gap-2 mb-5">
          <Button onClick={handleDownloadBackup} loading={downloading}>
            <Download size={16} /> تنزيل نسخة احتياطية
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} /> استرجاع من نسخة احتياطية
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileSelected}
          />
        </div>

        <div className="bg-danger-soft rounded-lg p-3">
          <p className="text-xs text-red leading-relaxed">
            ⚠️ تنبيه: استرجاع نسخة احتياطية يستبدل كل البيانات الحالية في النظام بالبيانات
            الموجودة في الملف. تأكد إنك مختار الملف الصحيح قبل المتابعة.
          </p>
        </div>
      </Card>

      <Modal
        open={!!confirmFile}
        onClose={() => {
          setConfirmFile(null);
          setRestoreError("");
        }}
        title="تأكيد استرجاع النسخة الاحتياطية"
        maxWidth="max-w-sm"
      >
        <p className="text-sm text-ink/80 mb-2">
          الملف المختار: <span className="font-semibold text-ink">{confirmFile?.name}</span>
        </p>
        <p className="text-sm text-red mb-5 leading-relaxed">
          هل أنت متأكد؟ كل البيانات الحالية في النظام (اللاعبين، الفروع، القياسات، الحضور) هتُستبدل
          بالكامل بمحتوى هذا الملف، ولا يمكن التراجع عن هذا الإجراء.
        </p>
        {restoreError && (
          <div className="bg-danger-soft text-red text-sm rounded-lg px-3.5 py-2.5 mb-4">
            {restoreError}
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={handleConfirmRestore} loading={restoring}>
            تأكيد الاسترجاع
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setConfirmFile(null);
              setRestoreError("");
            }}
          >
            إلغاء
          </Button>
        </div>
      </Modal>
    </div>
  );
}
