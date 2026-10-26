import { RefreshCw } from 'lucide-react';

export default function GroupsHeader({ loading, loadGroups }: { loading: boolean; loadGroups: () => Promise<void> }) {
  return (
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Administrasi
          </p>
  
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Study Groups
          </h1>
  
          <p className="mt-1 text-sm text-slate-500">
            Monitoring grup belajar,
            anggota, dan sesi Study Buddy.
          </p>
        </div>
  
        <button
          type="button"
          onClick={() =>
            void loadGroups()
          }
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />
  
          Refresh
        </button>
      </div>
  );
}
