import type { Dispatch, SetStateAction } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { ReportStatus, UpdateTarget } from './types';
import { getStatusDescription } from './utils';

interface UpdateStatusModalProps {
  updateTarget: UpdateTarget;
  setUpdateTarget: Dispatch<SetStateAction<UpdateTarget | null>>;
  updateLoading: boolean;
  updateError: string;
  setUpdateError: Dispatch<SetStateAction<string>>;
  updateReportStatus: () => Promise<void>;
}

export default function UpdateStatusModal({
  updateTarget,
  setUpdateTarget,
  updateLoading,
  updateError,
  setUpdateError,
  updateReportStatus,
}: UpdateStatusModalProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !updateLoading
        ) {
          setUpdateTarget(null);
          setUpdateError('');
        }
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">
              Update Moderation Status
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              {updateTarget.report.material?.title ||
                `Material #${updateTarget.report.material_id}`}
            </p>
          </div>
        </div>

        {updateError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
            {updateError}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Status
            </label>
            <select
              value={updateTarget.status}
              disabled={updateLoading}
              onChange={(event) =>
                setUpdateTarget((current) =>
                  current
                    ? {
                        ...current,
                        status: event.target.value as ReportStatus,
                      }
                    : null
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            >
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
              {updateTarget.status === 'action_taken' && (
                <option value="action_taken" disabled>
                  Action Taken (otomatis)
                </option>
              )}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              {getStatusDescription(updateTarget.status)}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Resolution Note
              </label>
              <span className="text-[10px] text-slate-400">
                {updateTarget.resolutionNote.length}/2000
              </span>
            </div>
            <textarea
              value={updateTarget.resolutionNote}
              disabled={updateLoading}
              maxLength={2000}
              rows={5}
              onChange={(event) =>
                setUpdateTarget((current) =>
                  current
                    ? {
                        ...current,
                        resolutionNote: event.target.value,
                      }
                    : null
                )
              }
              placeholder="Tuliskan hasil review atau alasan keputusan admin..."
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            />
            {(updateTarget.status === 'dismissed' ||
              updateTarget.status === 'action_taken') && (
              <p className="mt-2 text-[11px] text-amber-600">
                Catatan minimal 10 karakter wajib untuk keputusan ini.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={updateLoading}
            onClick={() => {
              setUpdateTarget(null);
              setUpdateError('');
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={updateLoading}
            onClick={() => void updateReportStatus()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {updateLoading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {updateLoading ? 'Menyimpan...' : 'Simpan Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
