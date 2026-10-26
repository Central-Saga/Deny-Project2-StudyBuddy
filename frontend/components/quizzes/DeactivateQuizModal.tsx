import { AlertTriangle, Loader2 } from 'lucide-react';
import type { Quiz } from './types';

type DeactivateQuizModalProps = {
  deactivateTarget: Quiz;
  deactivatingId: number | null;
  setDeactivateTarget: (quiz: Quiz | null) => void;
  deactivateQuiz: (quiz: Quiz) => Promise<void>;
};

export default function DeactivateQuizModal({
  deactivateTarget,
  deactivatingId,
  setDeactivateTarget,
  deactivateQuiz,
}: DeactivateQuizModalProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-lg font-bold text-slate-900">Nonaktifkan Kuis?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          <span className="font-semibold text-slate-700">{deactivateTarget.title}</span> akan
          hilang dari daftar kuis aktif. Riwayat attempt, jawaban, dan nilai tetap disimpan.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={deactivatingId === deactivateTarget.id}
            onClick={() => setDeactivateTarget(null)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={deactivatingId === deactivateTarget.id}
            onClick={() => deactivateQuiz(deactivateTarget)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {deactivatingId === deactivateTarget.id && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Nonaktifkan
          </button>
        </div>
      </div>
    </div>
  );
}
