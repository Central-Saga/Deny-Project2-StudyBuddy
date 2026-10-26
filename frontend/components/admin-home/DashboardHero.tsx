import { RefreshCw, Sparkles } from 'lucide-react';

export default function DashboardHero({ loading, loadDashboard }: { loading: boolean; loadDashboard: () => Promise<void> }) {
  return (
      <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/80 to-violet-50 p-6 shadow-sm lg:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl" />
  
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Study Buddy Overview
            </div>
  
            <h1 className="!text-slate-950 text-2xl font-bold tracking-tight sm:text-3xl">
              Admin Dashboard
            </h1>
  
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ringkasan kondisi platform,
              aktivitas utama, dan area yang
              membutuhkan perhatian
              administrator.
            </p>
          </div>
  
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                System Status
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                <span className="text-xs font-bold text-slate-700">
                  Operational
                </span>
              </div>
            </div>
  
            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  loading
                    ? 'animate-spin'
                    : ''
                }`}
              />
              Refresh Data
            </button>
          </div>
        </div>
      </section>
  );
}
