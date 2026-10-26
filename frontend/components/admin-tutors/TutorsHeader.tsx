import { RefreshCw, ShieldCheck } from 'lucide-react';

export default function TutorsHeader({ loading, loadTutors }: { loading: boolean; loadTutors: () => Promise<void> }) {
  return (
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50 p-6 shadow-sm lg:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-indigo-200/20 blur-3xl" />
  
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Tutor Verification
            </div>
  
            <h1 className="!text-slate-950 text-2xl font-bold tracking-tight sm:text-3xl">
              Tutor Management
            </h1>
  
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tinjau profil peer tutor, lihat mata kuliah dan jadwal yang tersedia,
              lalu verifikasi tutor yang telah diperiksa oleh administrator.
            </p>
          </div>
  
          <button
            type="button"
            onClick={() => void loadTutors()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </div>
      </section>
  );
}
