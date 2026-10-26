import type { Dispatch, SetStateAction } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import type { RestoreTarget } from './types';

interface RestoreQuizModalProps {
  restoreTarget: RestoreTarget;
  setRestoreTarget: Dispatch<SetStateAction<RestoreTarget | null>>;
  restoreLoading: boolean;
  restoreQuiz: () => Promise<void>;
}

export default function RestoreQuizModal({
  restoreTarget,
  setRestoreTarget,
  restoreLoading,
  restoreQuiz,
}: RestoreQuizModalProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !restoreLoading
        ) {
          setRestoreTarget(
            null
          );
        }
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
            <RotateCcw className="h-5 w-5 text-emerald-600" />
          </div>

          <div>
            <h2 className="!text-slate-950 text-base font-bold">
              Pulihkan Moderasi?
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Moderasi pada quiz{' '}
              <span className="font-semibold text-slate-700">
                {
                  restoreTarget.title
                }
              </span>{' '}
              akan dihapus.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-xs leading-5 text-emerald-700">
            Status publish akan
            dikembalikan seperti sebelum
            tindakan admin:{' '}
            <span className="font-bold">
              {restoreTarget.previousPublished
                ? 'Published'
                : 'Unpublished'}
            </span>
            .
          </p>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={
              restoreLoading
            }
            onClick={() =>
              setRestoreTarget(
                null
              )
            }
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={
              restoreLoading
            }
            onClick={() =>
              void restoreQuiz()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {restoreLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Ya, Pulihkan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
