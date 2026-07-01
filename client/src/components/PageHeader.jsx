// src/components/PageHeader.jsx
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <div className="h-[3px] w-16 bg-red rounded-full mt-3" />
    </div>
  );
}
