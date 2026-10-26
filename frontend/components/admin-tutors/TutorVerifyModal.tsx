import { BadgeCheck, Loader2, XCircle } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { TutorListItem, TutorDetail } from '@/components/admin-tutors/types';

export default function TutorVerifyModal({
  verifyTarget,
  setVerifyTarget,
  verificationLoading,
  updateVerification,
}: {
  verifyTarget: TutorListItem | TutorDetail;
  setVerifyTarget: Dispatch<SetStateAction<TutorListItem | TutorDetail | null>>;
  verificationLoading: boolean;
  updateVerification: () => Promise<void>;
}) {
  return (
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !verificationLoading
          ) {
            setVerifyTarget(null);
          }
        }}
      >
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              verifyTarget.is_verified
                ? 'bg-red-50 text-red-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {verifyTarget.is_verified ? (
              <XCircle className="h-6 w-6" />
            ) : (
              <BadgeCheck className="h-6 w-6" />
            )}
          </div>
  
          <h2 className="mt-4 !text-slate-950 text-lg font-bold">
            {verifyTarget.is_verified
              ? 'Batalkan Verifikasi Tutor?'
              : 'Verifikasi Tutor?'}
          </h2>
  
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {verifyTarget.is_verified
              ? `Status verified ${verifyTarget.name} akan dihapus. Profil tutor tetap tersedia selama status tutor masih aktif.`
              : `Pastikan profil, mata kuliah, dan informasi tutor ${verifyTarget.name} sudah ditinjau sebelum memberikan status verified.`}
          </p>
  
          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              disabled={verificationLoading}
              onClick={() =>
                setVerifyTarget(null)
              }
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
  
            <button
              type="button"
              disabled={verificationLoading}
              onClick={() =>
                void updateVerification()
              }
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-60 ${
                verifyTarget.is_verified
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {verificationLoading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
  
              {verificationLoading
                ? 'Menyimpan...'
                : verifyTarget.is_verified
                  ? 'Batalkan Verifikasi'
                  : 'Verify Tutor'}
            </button>
          </div>
        </div>
      </div>
  );
}
