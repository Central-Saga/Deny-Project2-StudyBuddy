import { AlertCircle, Flag, Loader2, X } from 'lucide-react';
import type { Material } from './types';

interface ReportMaterialModalProps {
  materialToReport: Material;
  reporting: boolean;
  reportReason: string;
  reportError: string;
  setReportReason: (value: string) => void;
  setReportError: (value: string) => void;
  closeReportModal: () => void;
  handleReportSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export default function ReportMaterialModal({
  materialToReport,
  reporting,
  reportReason,
  reportError,
  setReportReason,
  setReportError,
  closeReportModal,
  handleReportSubmit,
}: ReportMaterialModalProps) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !reporting
        ) {
          closeReportModal();
        }
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Flag className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-600">
                Material Report
              </p>
              <h2 className="mt-1 text-base font-bold text-slate-900">
                Laporkan Materi
              </h2>
            </div>
          </div>
          <button
            type="button"
            disabled={reporting}
            onClick={closeReportModal}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form
          onSubmit={handleReportSubmit}
          className="space-y-4 p-5"
        >
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Materi yang dilaporkan
            </p>
            <p className="mt-2 text-sm font-bold text-slate-800">
              {materialToReport.title}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {materialToReport.subject} · diunggah oleh{' '}
              {materialToReport.user?.name || 'Mahasiswa'}
            </p>
          </div>
          <div>
            <label
              htmlFor="material-report-reason"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-600"
            >
              Alasan Laporan
              <span className="ml-1 text-red-500">*</span>
            </label>
            <textarea
              id="material-report-reason"
              rows={5}
              required
              minLength={10}
              maxLength={1000}
              disabled={reporting}
              value={reportReason}
              onChange={(event) => {
                setReportReason(event.target.value);
                if (reportError) {
                  setReportError('');
                }
              }}
              placeholder="Jelaskan alasan materi ini perlu ditinjau admin, misalnya isi tidak sesuai, informasi menyesatkan, atau file bermasalah..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className="text-[10px] text-slate-400">
                Minimal 10 karakter.
              </p>
              <p
                className={`text-[10px] ${
                  reportReason.length > 1000
                    ? 'font-semibold text-red-500'
                    : 'text-slate-400'
                }`}
              >
                {reportReason.length}/1000
              </p>
            </div>
          </div>
          {reportError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{reportError}</span>
            </div>
          )}
          <div className="rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-800">
            Laporan akan dikirim ke administrator dengan status{' '}
            <span className="font-bold">Pending</span>. Admin kemudian
            dapat meninjau dan menentukan tindak lanjut laporan.
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={reporting}
              onClick={closeReportModal}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={
                reporting ||
                reportReason.trim().length < 10 ||
                reportReason.length > 1000
              }
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Flag className="h-4 w-4" />
                  Kirim Laporan
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
