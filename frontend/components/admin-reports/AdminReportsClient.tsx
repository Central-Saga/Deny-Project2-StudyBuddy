'use client';

import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAdminReports } from '@/hooks/admin-reports/useAdminReports';
import { SummaryCard } from './ReportCards';
import ReportsQueue from './ReportsQueue';
import ReportDetailModal from './ReportDetailModal';
import UpdateStatusModal from './UpdateStatusModal';
import RemoveMaterialModal from './RemoveMaterialModal';
import RestoreMaterialModal from './RestoreMaterialModal';

export default function AdminReportsClient() {
  const {
    reports,
    loading,
    error,
    setError,
    reportsLoadError,
    success,
    setSuccess,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedReport,
    detailLoading,
    downloadingId,
    loadReports,
    summary,
    filteredReports,
    openDetail,
    downloadMaterial,
    updateTarget,
    setUpdateTarget,
    updateLoading,
    updateError,
    setUpdateError,
    removeTarget,
    setRemoveTarget,
    removeLoading,
    removeError,
    setRemoveError,
    restoreTarget,
    setRestoreTarget,
    restoreLoading,
    restoreError,
    setRestoreError,
    openUpdateModal,
    updateReportStatus,
    openRemoveModal,
    removeMaterial,
    openRestoreModal,
    restoreMaterial,
    closeDetail,
  } = useAdminReports();

  if (!loading && reportsLoadError) {
    return (
      <div
        role="alert"
        className="flex min-h-[420px] items-center justify-center p-6"
      >
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Daftar laporan belum dapat dimuat
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            {reportsLoadError}
          </p>

          <button
            type="button"
            onClick={() => void loadReports()}
            disabled={loading}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50 p-6 shadow-sm lg:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Moderation Center
            </div>

            <h1 className="text-2xl font-bold tracking-tight !text-slate-900 sm:text-3xl">
              Material Reports
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tinjau laporan pengguna, periksa material, dokumentasikan keputusan,
              dan lakukan tindakan moderasi tanpa kehilangan riwayat laporan.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadReports()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700 hover:shadow-md disabled:translate-y-0 disabled:opacity-50 lg:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Refresh Data
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{error}</div>
          <button type="button" onClick={() => setError('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{success}</div>
          <button type="button" onClick={() => setSuccess('')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Reports"
          value={summary.total}
          description="Seluruh laporan masuk"
          icon={<FileWarning className="h-5 w-5" />}
          iconClass="bg-violet-50 text-violet-600"
        />
        <SummaryCard
          label="Pending"
          value={summary.pending}
          description="Memerlukan perhatian"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-600"
          valueClass="text-amber-600"
        />
        <SummaryCard
          label="Reviewed"
          value={summary.reviewed}
          description="Sudah diperiksa admin"
          icon={<ShieldCheck className="h-5 w-5" />}
          iconClass="bg-blue-50 text-blue-600"
          valueClass="text-blue-600"
        />
        <SummaryCard
          label="Resolved"
          value={summary.resolved}
          description="Dismissed / Action Taken"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-600"
        />
      </div>

      <ReportsQueue
        reports={reports}
        loading={loading}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredReports={filteredReports}
        openDetail={openDetail}
        openUpdateModal={openUpdateModal}
      />

      {selectedReport && (
        <ReportDetailModal
          selectedReport={selectedReport}
          detailLoading={detailLoading}
          downloadingId={downloadingId}
          openUpdateModal={openUpdateModal}
          downloadMaterial={downloadMaterial}
          openRemoveModal={openRemoveModal}
          openRestoreModal={openRestoreModal}
          closeDetail={closeDetail}
        />
      )}

      {updateTarget && (
        <UpdateStatusModal
          updateTarget={updateTarget}
          setUpdateTarget={setUpdateTarget}
          updateLoading={updateLoading}
          updateError={updateError}
          setUpdateError={setUpdateError}
          updateReportStatus={updateReportStatus}
        />
      )}

      {removeTarget && (
        <RemoveMaterialModal
          removeTarget={removeTarget}
          setRemoveTarget={setRemoveTarget}
          removeLoading={removeLoading}
          removeError={removeError}
          setRemoveError={setRemoveError}
          removeMaterial={removeMaterial}
        />
      )}

      {restoreTarget && (
        <RestoreMaterialModal
          restoreTarget={restoreTarget}
          setRestoreTarget={setRestoreTarget}
          restoreLoading={restoreLoading}
          restoreError={restoreError}
          setRestoreError={setRestoreError}
          restoreMaterial={restoreMaterial}
        />
      )}
    </div>
  );
}
