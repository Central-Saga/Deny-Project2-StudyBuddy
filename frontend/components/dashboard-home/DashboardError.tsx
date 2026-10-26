import { AlertCircle } from 'lucide-react';

type DashboardErrorProps = {
  error: string;
  loadDashboardData: (isRefresh?: boolean) => Promise<void>;
};

export default function DashboardError({
  error,
  loadDashboardData,
}: DashboardErrorProps) {
  return (
  <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
        <AlertCircle className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-bold text-red-700">
          Data Dashboard belum dapat dimuat
        </p>
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={() => loadDashboardData(true)}
      className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
    >
      Coba lagi
    </button>
  </div>
  );
}
