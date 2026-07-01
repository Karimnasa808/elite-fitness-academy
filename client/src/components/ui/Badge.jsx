// src/components/ui/Badge.jsx
const variants = {
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-red",
  neutral: "bg-cream text-ink/70 border border-border",
  gold: "bg-gold/15 text-gold",
};

export default function Badge({ children, variant = "neutral", className = "" }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
