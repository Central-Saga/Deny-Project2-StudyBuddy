export function SummaryCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 !text-slate-950 text-3xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export function MetricMini({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 !text-slate-950 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

export function DetailMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center gap-2 text-violet-600">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 !text-slate-950 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

export function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs text-slate-400">
        {label}
      </span>
      <span className="max-w-[65%] text-right text-xs font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}
