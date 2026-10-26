import {
  BookOpen,
  Clock3,
  Eye,
  FileText,
  FileWarning,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import type { MaterialReport, ReportStatus, StatusFilter } from './types';
import {
  formatDateTime,
  getStatusClass,
  getStatusDotClass,
  getStatusLabel,
} from './utils';

interface ReportsQueueProps {
  reports: MaterialReport[];
  loading: boolean;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filteredReports: MaterialReport[];
  openDetail: (report: MaterialReport) => Promise<void>;
  openUpdateModal: (report: MaterialReport, status?: ReportStatus) => void;
}

export default function ReportsQueue({
  reports,
  loading,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  filteredReports,
  openDetail,
  openUpdateModal,
}: ReportsQueueProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Moderation Queue
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Menampilkan {filteredReports.length} dari {reports.length} laporan.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari material, reporter..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 sm:w-52"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
              <option value="action_taken">Action Taken</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <FileWarning className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-sm font-bold text-slate-800">
            Tidak ada laporan ditemukan
          </h3>
          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
            Ubah filter atau kata pencarian untuk melihat laporan lainnya.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredReports.map((report) => (
            <article
              key={report.id}
              className="p-5 transition hover:bg-slate-50/60 lg:p-6"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="max-w-xl truncate text-sm font-bold text-slate-900 sm:text-base">
                          {report.material?.title ||
                            `Material #${report.material_id}`}
                        </h3>

                        {report.material?.is_removed && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-600">
                            <Trash2 className="h-3 w-3" />
                            Removed
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5" />
                          {report.material?.subject ||
                            'Subject tidak tersedia'}
                        </span>
                        <span>Report #{report.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                      Alasan Laporan
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                      {report.reason}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-2">
                      <UserRound className="h-3.5 w-3.5 text-slate-400" />
                      Reporter:
                      <strong className="font-semibold text-slate-700">
                        {report.reporter?.name ||
                          `User #${report.reporter_id}`}
                      </strong>
                    </span>

                    <span className="inline-flex items-center gap-2 text-slate-400">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatDateTime(report.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-3 xl:items-end">
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${getStatusClass(
                      report.status
                    )}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${getStatusDotClass(
                        report.status
                      )}`}
                    />
                    {getStatusLabel(report.status)}
                  </span>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => void openDetail(report)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Detail
                    </button>

                    <button
                      type="button"
                      onClick={() => openUpdateModal(report)}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Review
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
