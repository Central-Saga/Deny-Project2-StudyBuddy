import type { Dispatch, SetStateAction } from 'react';
import { Trash2 } from 'lucide-react';
import type { RemoveTarget } from './types';

interface RemoveMaterialModalProps {
  removeTarget: RemoveTarget;
  setRemoveTarget: Dispatch<SetStateAction<RemoveTarget | null>>;
  removeLoading: boolean;
  removeError: string;
  setRemoveError: Dispatch<SetStateAction<string>>;
  removeMaterial: () => Promise<void>;
}

export default function RemoveMaterialModal({
  removeTarget,
  setRemoveTarget,
  removeLoading,
  removeError,
  setRemoveError,
  removeMaterial,
}: RemoveMaterialModalProps) {
  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !removeLoading
        ) {
          setRemoveTarget(null);
          setRemoveError('');
        }
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-red-100 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-950">
              Nonaktifkan Material Sementara?
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Material{' '}
              <strong className="font-semibold text-slate-700">
                {removeTarget.report.material?.title ||
                  `#${removeTarget.report.material_id}`}
              </strong>{' '}
              akan disembunyikan dari pengguna. File fisik tetap disimpan sehingga material masih dapat dipulihkan.
              Riwayat laporan tetap tersimpan.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/70 p-4 text-xs leading-5 text-red-700">
          Material hanya dinonaktifkan dengan soft delete. File fisik tidak
          dihapus, sehingga admin masih dapat memulihkannya nanti.
        </div>

        {removeError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-white px-4 py-3 text-xs leading-5 text-red-700">
            {removeError}
          </div>
        )}

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Catatan Tindakan
            </label>
            <span className="text-[10px] text-slate-400">
              {removeTarget.resolutionNote.length}/2000
            </span>
          </div>
          <textarea
            rows={5}
            maxLength={2000}
            disabled={removeLoading}
            value={removeTarget.resolutionNote}
            onChange={(event) =>
              setRemoveTarget((current) =>
                current
                  ? {
                      ...current,
                      resolutionNote: event.target.value,
                    }
                  : null
              )
            }
            className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-red-300 focus:ring-2 focus:ring-red-100 disabled:opacity-60"
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={removeLoading}
            onClick={() => {
              setRemoveTarget(null);
              setRemoveError('');
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={removeLoading}
            onClick={() => void removeMaterial()}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {removeLoading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {removeLoading ? 'Menonaktifkan...' : 'Ya, Nonaktifkan Material'}
          </button>
        </div>
      </div>
    </div>
  );
}
