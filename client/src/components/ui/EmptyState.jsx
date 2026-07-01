// src/components/ui/EmptyState.jsx
export default function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      {icon && <div className="text-4xl mb-3 opacity-60">{icon}</div>}
      <h3 className="font-display font-bold text-ink text-lg mb-1">{title}</h3>
      {message && <p className="text-sm text-muted max-w-sm mb-4">{message}</p>}
      {action}
    </div>
  );
}
