import { UserCheck, Users, UserX } from 'lucide-react';

interface UsersSummaryProps {
  loading: boolean;
  usersLoadError: string;
  summary: { total: number; active: number; suspended: number };
}

export function UsersSummary({
  loading,
  usersLoadError,
  summary,
}: UsersSummaryProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              User Ditampilkan
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {loading || usersLoadError ? '—' : summary.total}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Aktif
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {loading || usersLoadError ? '—' : summary.active}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Suspended
            </p>

            <p className="mt-1 text-2xl font-bold text-red-600">
              {loading || usersLoadError ? '—' : summary.suspended}
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <UserX className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
