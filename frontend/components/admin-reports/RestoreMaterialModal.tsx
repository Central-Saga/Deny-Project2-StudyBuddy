import type { Dispatch, SetStateAction } from 'react';
import { RotateCcw } from 'lucide-react';
import type { RestoreTarget } from './types';

interface RestoreMaterialModalProps {
  restoreTarget: RestoreTarget;
  setRestoreTarget: Dispatch<SetStateAction<RestoreTarget | null>>;
  restoreLoading: boolean;
  restoreError: string;
  setRestoreError: Dispatch<SetStateAction<string>>;
  restoreMaterial: () => Promise<void>;
}

export default function RestoreMaterialModal({
  restoreTarget,
  setRestoreTarget,
  restoreLoading,
  restoreError,
  setRestoreError,
  restoreMaterial,
}: RestoreMaterialModalProps) {
  return (
    <div
      className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !restoreLoading
        ) {
          setRestoreTarget(null);
          setRestoreError('');
        }
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <RotateCcw className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h2 className="font-bold !text-slate-900">
              Pulihkan Material?
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Material{' '}
              <span className="font-semibold text-slate-700">
                {restoreTarget.report.material?.title ||
                  `#${restoreTarget.report.material_id}`}
              </span>{' '}
              akan ditampilkan kembali kepada pengguna.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Catatan Pemulihan
          </label>
          <textarea
            value={restoreTarget.resolutionNote}
            disabled={restoreLoading}
            onChange={(event) =>
              setRestoreTarget((current) =>
                current
                  ? {
                      ...current,
                      resolutionNote: event.target.value,
                    }
                  : null
              )
            }
            rows={4}
            maxLength={2000}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
            placeholder="Jelaskan alasan material dipulihkan..."
          />
          <div className="mt-1 flex items-center justify-between gap-3 text-[11px]">
            <span className={restoreError ? 'text-red-600' : 'text-slate-400'}>
              {restoreError || 'Minimal 10 karakter.'}
            </span>
            <span className="text-slate-400">
              {restoreTarget.resolutionNote.length}/2000
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={restoreLoading}
            onClick={() => {
              setRestoreTarget(null);
              setRestoreError('');
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={restoreLoading}
            onClick={() => void restoreMaterial()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {restoreLoading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {restoreLoading ? 'Memulihkan...' : 'Ya, Pulihkan Material'}
          </button>
        </div>
      </div>
    </div>
  );
}
