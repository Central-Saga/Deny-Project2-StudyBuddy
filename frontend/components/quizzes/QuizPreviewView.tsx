import { CheckCircle2 } from 'lucide-react';
import type { Quiz } from './types';

type QuizPreviewViewProps = {
  selectedQuiz: Quiz;
  setSelectedQuiz: (quiz: Quiz | null) => void;
  setPreviewMode: (previewMode: boolean) => void;
};

export default function QuizPreviewView({
  selectedQuiz,
  setSelectedQuiz,
  setPreviewMode,
}: QuizPreviewViewProps) {
  return (
      <div className="space-y-5 p-5 sm:p-6">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
          Ini adalah mode preview creator. Membuka preview tidak membuat attempt, tidak mengurangi batas percobaan, dan jawaban benar ditandai untuk membantu pengecekan soal.
        </div>
        {selectedQuiz.questions.map((question, index) => (
          <div
            key={question.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-bold leading-6 text-slate-900">
                {index + 1}. {question.question_text}
              </p>
              <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                {question.points} poin
              </span>
            </div>
            {question.question_type === 'essay' ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                Ini soal esai lama. Pembuatan soal esai baru sudah dinonaktifkan karena fase Quiz saat ini memakai soal yang dapat dinilai otomatis.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {question.options.map((option) => (
                  <div
                    key={option.id}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                      option.is_correct
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        option.is_correct
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {option.is_correct && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                    <span>{option.option_text}</span>
                    {option.is_correct && (
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        Jawaban benar
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => { setSelectedQuiz(null); setPreviewMode(false); }}
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white hover:bg-slate-800"
        >
          Tutup Preview
        </button>
      </div>
  );
}
