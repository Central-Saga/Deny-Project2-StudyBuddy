import { UserCheck, UserX } from 'lucide-react';
import type { StatusTarget } from './types';

interface StatusConfirmModalProps {
  statusTarget: StatusTarget;
  statusLoading: boolean;
  setStatusTarget: (target: StatusTarget | null) => void;
  changeStatus: () => Promise<void>;
}

export default function StatusConfirmModal({
  statusTarget,
  statusLoading,
  setStatusTarget,
  changeStatus,
}: StatusConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget &&
          !statusLoading
        ) {
          setStatusTarget(null);
        }
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              statusTarget
                .nextStatus ===
              'suspended'
                ? 'bg-red-50 text-red-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {statusTarget
              .nextStatus ===
            'suspended' ? (
              <UserX className="h-5 w-5" />
            ) : (
              <UserCheck className="h-5 w-5" />
            )}
          </div>

          <div>
            <h2 className="font-bold text-slate-900">
              {statusTarget
                .nextStatus ===
              'suspended'
                ? 'Suspend akun user?'
                : 'Aktifkan akun user?'}
            </h2>

            <p className="mt-1.5 text-sm leading-6 text-slate-500">
              {statusTarget
                .nextStatus ===
              'suspended' ? (
                <>
                  Akun{' '}
                  <span className="font-semibold text-slate-700">
                    {
                      statusTarget
                        .user
                        .name
                    }
                  </span>{' '}
                  akan ditangguhkan dan
                  tidak dapat mengakses
                  fitur Study Buddy
                  sampai diaktifkan
                  kembali.
                </>
              ) : (
                <>
                  Akun{' '}
                  <span className="font-semibold text-slate-700">
                    {
                      statusTarget
                        .user
                        .name
                    }
                  </span>{' '}
                  akan diaktifkan kembali.
                </>
              )}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={
              statusLoading
            }
            onClick={() =>
              setStatusTarget(null)
            }
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={
              statusLoading
            }
            onClick={() =>
              void changeStatus()
            }
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-60 ${
              statusTarget
                .nextStatus ===
              'suspended'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {statusLoading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}

            {statusLoading
              ? 'Memproses...'
              : statusTarget
                    .nextStatus ===
                  'suspended'
                ? 'Ya, Suspend'
                : 'Ya, Aktifkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
