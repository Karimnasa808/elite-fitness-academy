// src/components/ui/Modal.jsx
import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({ open, onClose, title, children, maxWidth = "max-w-md" }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${maxWidth} bg-cream-card rounded-2xl border border-border shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-cream-card">
          <h2 className="font-display font-bold text-lg text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="text-muted hover:text-ink text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
