'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAdminDashboard } from '@/hooks/admin-home/useAdminDashboard';
import DashboardHero from '@/components/admin-home/DashboardHero';
import MetricsGrid from '@/components/admin-home/MetricsGrid';
import OverviewSection from '@/components/admin-home/OverviewSection';
import ActionsSection from '@/components/admin-home/ActionsSection';

export default function AdminHomeClient() {
  const {
    stats,
    loading,
    error,
    hasLoadedStats,
    loadDashboard,
    activeUserRate,
    verifiedTutorRate,
    publishedQuizRate,
    reviewedReports,
    reviewedReportRate,
    metrics,
    distribution,
  } = useAdminDashboard();

  if (!loading && error && !hasLoadedStats) {
    return (
      <main
        role="alert"
        className="flex min-h-[420px] items-center justify-center p-6"
      >
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Statistik Admin belum dapat dimuat
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <DashboardHero loading={loading} loadDashboard={loadDashboard} />

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            {error}
          </div>
        </div>
      )}

      <MetricsGrid loading={loading} metrics={metrics} />

      <OverviewSection
        stats={stats}
        activeUserRate={activeUserRate}
        verifiedTutorRate={verifiedTutorRate}
        publishedQuizRate={publishedQuizRate}
        reviewedReports={reviewedReports}
        reviewedReportRate={reviewedReportRate}
        distribution={distribution}
      />

      <ActionsSection stats={stats} />
    </div>
  );
}
