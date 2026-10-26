import {
  Download,
  FileText,
  HardDrive,
  RotateCcw,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import type { MaterialReport, ReportStatus } from './types';
import { InfoBox, PersonBlock } from './ReportCards';
import {
  formatDateTime,
  formatFileSize,
  getStatusClass,
  getStatusDescription,
  getStatusDotClass,
  getStatusLabel,
} from './utils';

interface ReportDetailModalProps {
  selectedReport: MaterialReport;
  detailLoading: boolean;
  downloadingId: number | null;
  openUpdateModal: (report: MaterialReport, status?: ReportStatus) => void;
  downloadMaterial: (report: MaterialReport) => Promise<void>;
  openRemoveModal: (report: MaterialReport) => void;
  openRestoreModal: (report: MaterialReport) => void;
  closeDetail: () => void;
}

export default function ReportDetailModal({
  selectedReport,
  detailLoading,
  downloadingId,
  openUpdateModal,
  downloadMaterial,
  openRemoveModal,
  openRestoreModal,
  closeDetail,
}: ReportDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeDetail();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-950">
                Detail Moderasi
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                  selectedReport.status
                )}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                    selectedReport.status
                  )}`}
                />
                {getStatusLabel(selectedReport.status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Report #{selectedReport.id} · {formatDateTime(selectedReport.created_at)}
            </p>
          </div>

          <button
            type="button"
            onClick={closeDetail}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {detailLoading ? (
          <div className="space-y-4 p-6">
            <div className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-44 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <div className="space-y-5 p-6">
            <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
              <section className="rounded-2xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900">
                        {selectedReport.material?.title ||
                          `Material #${selectedReport.material_id}`}
                      </h3>
                      {selectedReport.material?.is_removed && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
                          MATERIAL REMOVED
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedReport.material?.subject ||
                        'Subject tidak tersedia'}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {selectedReport.material?.description ||
                    'Material tidak memiliki deskripsi.'}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <InfoBox
                    label="File Type"
                    value={
                      selectedReport.material?.file_type
                        ? selectedReport.material.file_type.toUpperCase()
                        : '-'
                    }
                    icon={<FileText className="h-4 w-4" />}
                  />
                  <InfoBox
                    label="File Size"
                    value={formatFileSize(
                      selectedReport.material?.file_size
                    )}
                    icon={<HardDrive className="h-4 w-4" />}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={
                      selectedReport.material?.is_removed ||
                      downloadingId === selectedReport.id
                    }
                    onClick={() =>
                      void downloadMaterial(selectedReport)
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {downloadingId === selectedReport.id ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {selectedReport.material?.is_removed
                      ? 'Material Removed'
                      : downloadingId === selectedReport.id
                        ? 'Mengunduh...'
                        : 'Download Material'}
                  </button>
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 p-5">
                <PersonBlock
                  label="Reporter"
                  user={selectedReport.reporter}
                  fallback={`User #${selectedReport.reporter_id}`}
                />
                <PersonBlock
                  label="Uploader"
                  user={selectedReport.material?.uploader}
                  fallback="Uploader tidak tersedia"
                />
                <PersonBlock
                  label="Reviewed By"
                  user={selectedReport.reviewer}
                  fallback="Belum direview"
                />
              </section>
            </div>

            <section className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                Alasan Laporan
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {selectedReport.reason}
              </p>
            </section>

            {selectedReport.resolution_note && (
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                <div className="flex items-start gap-3">
                  <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                      Resolution Note
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {selectedReport.resolution_note}
                    </p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      Reviewed {formatDateTime(selectedReport.reviewed_at)}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-slate-200 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Moderation Actions
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {getStatusDescription(selectedReport.status)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openUpdateModal(selectedReport, 'reviewed')
                    }
                    className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Mark Reviewed
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openUpdateModal(selectedReport, 'dismissed')
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Dismiss Report
                  </button>

                  {selectedReport.material?.is_removed ? (
                    <button
                      type="button"
                      onClick={() => openRestoreModal(selectedReport)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Pulihkan Material
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openRemoveModal(selectedReport)}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Nonaktifkan Material
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
