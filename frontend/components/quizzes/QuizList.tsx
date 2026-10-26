import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Trash2,
} from 'lucide-react';
import type { Quiz } from './types';

type QuizListProps = {
  quizzes: Quiz[];
  reactivatingId: number | null;
  deactivatingId: number | null;
  openPreview: (quiz: Quiz) => Promise<void>;
  openQuiz: (quiz: Quiz) => Promise<void>;
  openEdit: (quiz: Quiz) => Promise<void>;
  reactivateQuiz: (quiz: Quiz) => Promise<void>;
  setDeactivateTarget: (quiz: Quiz | null) => void;
};

export default function QuizList({
  quizzes,
  reactivatingId,
  deactivatingId,
  openPreview,
  openQuiz,
  openEdit,
  reactivateQuiz,
  setDeactivateTarget,
}: QuizListProps) {
  return (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    {quizzes.map((quiz) => {
      const attemptLabel =
        quiz.max_attempts === null || quiz.max_attempts === undefined
          ? `${quiz.attempts_used ?? 0} selesai · tidak terbatas`
          : `${quiz.attempts_used ?? 0}/${quiz.max_attempts} percobaan`;
      const actionLabel = quiz.has_in_progress_attempt
        ? 'Lanjutkan Kuis'
        : (quiz.attempts_used ?? 0) > 0
          ? 'Kerjakan Lagi'
          : 'Kerjakan Kuis';
      return (
        <article
          key={quiz.id}
          className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                quiz.is_published === false
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-emerald-50 text-emerald-700'
              }`}>
                {quiz.is_published === false ? 'Nonaktif' : `Lulus ${quiz.pass_score}%`}
              </span>
              {quiz.is_published === false && (
                <span className="text-[9px] font-semibold text-slate-400">Lulus {quiz.pass_score}%</span>
              )}
            </div>
          </div>
          <h3 className="mt-5 line-clamp-2 text-base font-bold text-slate-900">
            {quiz.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
            {quiz.description || 'Tidak ada deskripsi kuis.'}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-500">
            <span>{quiz.subject_name || 'Umum'}</span>
            <span>• {quiz.question_count} soal</span>
            {quiz.duration_minutes && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {quiz.duration_minutes} menit
              </span>
            )}
          </div>
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[10px] font-semibold text-slate-500">
            Percobaan: {attemptLabel}
          </div>
          <p className="mt-3 text-[10px] text-slate-400">
            Dibuat oleh {quiz.creator_name || 'Mahasiswa'}
          </p>
          {quiz.can_manage ? (
            <button
              type="button"
              onClick={() => openPreview(quiz)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              <BookOpen className="h-4 w-4" />
              Preview Kuis
            </button>
          ) : (
            <button
              type="button"
              disabled={quiz.can_attempt === false && !quiz.has_in_progress_attempt}
              onClick={() => openQuiz(quiz)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              <BookOpen className="h-4 w-4" />
              {quiz.can_attempt === false && !quiz.has_in_progress_attempt
                ? 'Batas Percobaan Tercapai'
                : actionLabel}
            </button>
          )}
          {quiz.can_manage && (
            <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => openEdit(quiz)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </button>
              {quiz.is_published === false ? (
                <button
                  type="button"
                  disabled={reactivatingId === quiz.id}
                  onClick={() => reactivateQuiz(quiz)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                >
                  {reactivatingId === quiz.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Aktifkan Kembali
                </button>
              ) : (
                <button
                  type="button"
                  disabled={deactivatingId === quiz.id}
                  onClick={() => setDeactivateTarget(quiz)}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                >
                  {deactivatingId === quiz.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Nonaktifkan
                </button>
              )}
            </div>
          )}
        </article>
      );
    })}
  </div>
  );
}
