// src/components/ui/ConfirmDialog.jsx
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "تأكيد الحذف",
  message,
  confirmLabel = "حذف",
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <p className="text-sm text-ink/80 mb-5 leading-relaxed">{message}</p>
      <div className="flex gap-2 justify-start">
        <Button variant="primary" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
        <Button variant="outline" onClick={onClose}>
          إلغاء
        </Button>
      </div>
    </Modal>
  );
}
