import type { Dispatch, SetStateAction } from 'react';
import { Flag, Loader2, ShieldAlert } from 'lucide-react';
import type { DisableTarget } from './types';

interface DisableQuizModalProps {
  disableTarget: DisableTarget;
  setDisableTarget: Dispatch<SetStateAction<DisableTarget | null>>;
  disableReason: string;
  setDisableReason: Dispatch<SetStateAction<string>>;
  disableLoading: boolean;
  disableQuiz: () => Promise<void>;
}

export default function DisableQuizModal({
  disableTarget,
  setDisableTarget,
  disableReason,
  setDisableReason,
  disableLoading,
  disableQuiz,
}: DisableQuizModalProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !disableLoading
        ) {
          setDisableTarget(
            null
          );
          setDisableReason('');
        }
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
            <ShieldAlert className="h-5 w-5 text-red-600" />
          </div>

          <div>
            <h2 className="!text-slate-950 text-base font-bold">
              Nonaktifkan Quiz?
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              Quiz{' '}
              <span className="font-semibold text-slate-700">
                {
                  disableTarget.title
                }
              </span>{' '}
              akan disembunyikan dari
              pengguna. Riwayat attempt
              tetap disimpan.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <label className="text-xs font-bold text-slate-700">
            Alasan Moderasi
          </label>

          <textarea
            value={disableReason}
            onChange={(event) =>
              setDisableReason(
                event.target.value
              )
            }
            rows={4}
            maxLength={500}
            placeholder="Jelaskan alasan quiz dinonaktifkan..."
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50"
          />

          <div className="mt-1.5 flex justify-between text-[10px]">
            <span
              className={
                disableReason
                  .trim().length <
                10
                  ? 'text-red-500'
                  : 'text-emerald-600'
              }
            >
              Minimal 10 karakter
            </span>

            <span className="text-slate-400">
              {
                disableReason.length
              }
              /500
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={
              disableLoading
            }
            onClick={() => {
              setDisableTarget(
                null
              );
              setDisableReason('');
            }}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={
              disableLoading ||
              disableReason
                .trim().length <
                10
            }
            onClick={() =>
              void disableQuiz()
            }
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {disableLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Flag className="h-3.5 w-3.5" />
                Ya, Nonaktifkan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
