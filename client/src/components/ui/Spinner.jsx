// src/components/ui/Spinner.jsx
export default function Spinner({ className = "h-6 w-6" }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-border border-t-red animate-spin ${className}`}
      role="status"
      aria-label="جاري التحميل"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner className="h-8 w-8" />
    </div>
  );
}
