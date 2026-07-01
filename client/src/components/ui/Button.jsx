// src/components/ui/Button.jsx
const variants = {
  primary: "bg-red text-white hover:bg-red-light active:bg-red-dark",
  dark: "bg-ink text-white hover:bg-ink-soft",
  outline: "bg-transparent border border-border text-ink hover:bg-cream-card",
  ghost: "bg-transparent text-ink hover:bg-cream-card",
  danger: "bg-transparent border border-red/40 text-red hover:bg-danger-soft",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  disabled = false,
  loading = false,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-body font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
      )}
      {children}
    </button>
  );
}
