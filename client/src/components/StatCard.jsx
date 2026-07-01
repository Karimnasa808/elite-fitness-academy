// src/components/StatCard.jsx
import Card from "./ui/Card";

export default function StatCard({ icon: Icon, label, value, sub, accent = "red" }) {
  const accentColors = {
    red: "text-red bg-red/10",
    gold: "text-gold bg-gold/15",
    success: "text-success bg-success-soft",
    ink: "text-ink bg-ink/10",
  };

  return (
    <Card notched className="p-5 flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-muted mb-1.5">{label}</p>
        <p className="font-display font-extrabold text-3xl text-ink leading-none">{value}</p>
        {sub && <p className="text-xs text-muted mt-1.5">{sub}</p>}
      </div>
      {Icon && (
        <div className={`rounded-xl p-2.5 ${accentColors[accent]}`}>
          <Icon size={20} strokeWidth={2.2} />
        </div>
      )}
    </Card>
  );
}
