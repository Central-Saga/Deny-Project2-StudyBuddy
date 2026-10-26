export function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      {children}
    </div>
  );
}

export function SummaryCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: number;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-slate-400">{note}</p>
    </div>
  );
}

export function InfoRow({
  label,
  value,
  icon,
  danger = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5">
      <span className="flex items-center gap-2 text-[11px] text-slate-500">
        {icon}
        {label}
      </span>
      <span
        className={`max-w-[160px] truncate text-[11px] font-semibold ${
          danger ? 'text-red-600' : 'text-slate-700'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function DetailStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}
