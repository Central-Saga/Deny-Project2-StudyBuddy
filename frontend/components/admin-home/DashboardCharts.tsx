export function HorizontalBarChart({
  items,
}: {
  items: Array<{
    label: string;
    value: number;
    icon: React.ComponentType<{
      className?: string;
    }>;
    barClass: string;
  }>;
}) {
  const maxValue = Math.max(
    1,
    ...items.map(
      (item) => item.value
    )
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        const width =
          item.value <= 0
            ? 0
            : Math.max(
                10,
                Math.round(
                  (item.value /
                    maxValue) *
                    100
                )
              );

        return (
          <div
            key={item.label}
            className="rounded-2xl border border-white/90 bg-white/80 p-3.5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <span className="truncate text-xs font-semibold text-slate-700">
                  {item.label}
                </span>
              </div>

              <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-800">
                {item.value}
              </span>
            </div>

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-medium uppercase tracking-wider text-slate-300">
                  Distribution
                </span>

                <span className="text-[10px] font-bold text-slate-400">
                  {width}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.barClass}`}
                  style={{
                    width: `${width}%`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DonutMetric({
  label,
  percentage: progress,
  value,
  strokeClass,
  accentClass,
}: {
  label: string;
  percentage: number;
  value: string;
  strokeClass: string;
  accentClass: string;
}) {
  const radius = 32;
  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (progress / 100) *
      circumference;

  return (
    <div className="group rounded-2xl border border-white/90 bg-white/80 p-3 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md">
      <div className="relative mx-auto h-[86px] w-[86px]">
        <svg
          viewBox="0 0 80 80"
          className="-rotate-90"
        >
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="7"
            className="stroke-slate-100"
          />

          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={
              circumference
            }
            strokeDashoffset={offset}
            className={`${strokeClass} transition-all duration-700`}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-base font-bold ${accentClass}`}
          >
            {progress}%
          </span>
        </div>
      </div>

      <p className="mt-1.5 text-center text-[11px] font-bold text-slate-700">
        {label}
      </p>

      <p className="mt-0.5 text-center text-[10px] font-medium text-slate-400">
        {value}
      </p>
    </div>
  );
}
