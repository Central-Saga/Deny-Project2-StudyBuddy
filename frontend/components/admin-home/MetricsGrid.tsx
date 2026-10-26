import type { MetricItem } from '@/components/admin-home/types';

export default function MetricsGrid({ loading, metrics }: { loading: boolean; metrics: MetricItem[] }) {
  return loading ? (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
          />
        ))}
      </section>
    ) : (
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
  
          return (
            <div
              key={metric.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${metric.accent}`}
              />
  
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    {metric.label}
                  </p>
  
                  <p className="mt-2 !text-slate-950 text-3xl font-bold tracking-tight">
                    {metric.value}
                  </p>
  
                  <p className="mt-1 text-xs text-slate-400">
                    {metric.helper}
                  </p>
                </div>
  
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${metric.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </section>
  );
}
