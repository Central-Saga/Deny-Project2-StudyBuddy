export function SummaryCard({
  label,
  value,
  icon,
  iconClass,
  valueClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${valueClass}`}
          >
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

export function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-700">
        {icon}
        {value}
      </p>
    </div>
  );
}

export function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

export function InfoMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-amber-500">
        {icon}
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

export function RequestMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-slate-400">
        tutoring request
      </p>
    </div>
  );
}
