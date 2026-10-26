import { Trophy } from 'lucide-react';
import type { Quiz, QuizResult } from './types';

type QuizResultViewProps = {
  result: QuizResult;
  setSelectedQuiz: (quiz: Quiz | null) => void;
  retryQuiz: () => Promise<void>;
};

export default function QuizResultView({
  result,
  setSelectedQuiz,
  retryQuiz,
}: QuizResultViewProps) {
  return (
      <div className="p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <Trophy className="h-8 w-8" />
        </div>
        <h3 className="mt-5 text-2xl font-bold text-slate-900">Nilai {result.score}%</h3>
        <p className="mt-2 text-sm text-slate-500">
          {result.earned_points} dari {result.total_points} poin
        </p>
        <div
          className={`mx-auto mt-5 w-fit rounded-full px-4 py-2 text-xs font-bold ${
            result.passed
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {result.passed ? 'Lulus' : 'Belum lulus'}
        </div>
        <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
          {result.max_attempts === null
            ? `Percobaan selesai: ${result.attempts_used} · tidak terbatas`
            : `Percobaan ${result.attempts_used} dari ${result.max_attempts}`}
        </div>
        {result.review.length > 0 && (
          <div className="mt-7 text-left">
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
                Review Jawaban
              </p>
              <h4 className="mt-1 text-base font-bold text-slate-900">
                Pembahasan hasil kuis
              </h4>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Jawaban benar baru ditampilkan setelah kuis dikumpulkan.
              </p>
            </div>
            <div className="space-y-3">
              {result.review.map((item, index) => {
                const isEssay = item.question_type === 'essay';
                const userAnswer = isEssay
                  ? item.user_answer?.answer_text || 'Tidak dijawab'
                  : item.user_answer?.option_text || 'Tidak dijawab';
                return (
                  <div
                    key={item.question_id}
                    className={`rounded-2xl border p-4 ${
                      isEssay
                        ? 'border-amber-200 bg-amber-50/50'
                        : item.is_correct
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold leading-6 text-slate-900">
                        {index + 1}. {item.question_text}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          isEssay
                            ? 'bg-amber-100 text-amber-700'
                            : item.is_correct
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {isEssay ? 'Esai' : item.is_correct ? 'Benar' : 'Salah'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/80 bg-white p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Jawaban kamu
                        </p>
                        <p className="mt-1.5 whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-700">
                          {userAnswer}
                        </p>
                      </div>
                      {isEssay ? (
                        <div className="rounded-xl border border-amber-100 bg-white p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">
                            Penilaian
                          </p>
                          <p className="mt-1.5 text-xs leading-5 text-slate-600">
                            Jawaban esai disimpan, tetapi belum dinilai otomatis.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/80 bg-white p-3">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                            Jawaban benar
                          </p>
                          <p className="mt-1.5 text-xs font-semibold leading-5 text-slate-700">
                            {item.correct_answer?.option_text || 'Tidak tersedia'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>Bobot {item.points} poin</span>
                      <span>Diperoleh {item.points_awarded} poin</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {result.can_attempt ? (
          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setSelectedQuiz(null)}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={retryQuiz}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Kerjakan Lagi
            </button>
          </div>
        ) : (
          <>
            <p className="mt-4 text-xs font-semibold text-amber-700">
              Batas percobaan kuis telah tercapai.
            </p>
            <button
              type="button"
              onClick={() => setSelectedQuiz(null)}
              className="mt-5 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Tutup
            </button>
          </>
        )}
      </div>
  );
}
