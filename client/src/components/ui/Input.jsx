// src/components/ui/Input.jsx
export function Field({ label, required, error, children, hint }) {
  return (
    <label className="block">
      {label && (
        <span className="block text-sm font-semibold text-ink/80 mb-1.5">
          {label} {required && <span className="text-red">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="block text-xs text-muted mt-1">{hint}</span>}
      {error && <span className="block text-xs text-red mt-1">{error}</span>}
    </label>
  );
}

export function Input({ className = "", error, ...rest }) {
  return (
    <input
      className={`w-full rounded-lg border bg-cream-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-red ${
        error ? "border-red" : "border-border"
      } ${className}`}
      {...rest}
    />
  );
}

export function Select({ className = "", error, children, ...rest }) {
  return (
    <select
      className={`w-full rounded-lg border bg-cream-card px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-red ${
        error ? "border-red" : "border-border"
      } ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
}

export function Textarea({ className = "", error, ...rest }) {
  return (
    <textarea
      className={`w-full rounded-lg border bg-cream-card px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-red resize-none ${
        error ? "border-red" : "border-border"
      } ${className}`}
      {...rest}
    />
  );
}
