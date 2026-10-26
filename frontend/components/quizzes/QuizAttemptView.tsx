import type { Dispatch, SetStateAction } from 'react';
import { Send } from 'lucide-react';
import type { Quiz, QuizAnswers } from './types';

type QuizAttemptViewProps = {
  selectedQuiz: Quiz;
  answers: QuizAnswers;
  setAnswers: Dispatch<SetStateAction<QuizAnswers>>;
  submitting: boolean;
  submitAttempt: () => Promise<void>;
};

export default function QuizAttemptView({
  selectedQuiz,
  answers,
  setAnswers,
  submitting,
  submitAttempt,
}: QuizAttemptViewProps) {
  return (
      <div className="space-y-5 p-5 sm:p-6">
        {selectedQuiz.questions.map((question, index) => {
          const currentAnswer = answers[question.id];
          return (
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
                <textarea
                  rows={4}
                  value={currentAnswer?.answerText || ''}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [question.id]: { answerText: e.target.value },
                    }))
                  }
                  placeholder="Tulis jawabanmu..."
                  className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
              ) : (
                <div className="mt-4 space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 hover:bg-white"
                    >
                      <input
                        type="radio"
                        name={`q-${question.id}`}
                        checked={currentAnswer?.optionId === option.id}
                        onChange={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: { optionId: option.id },
                          }))
                        }
                        className="h-4 w-4 accent-blue-600"
                      />
                      <span>{option.option_text}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <button
          type="button"
          disabled={submitting}
          onClick={submitAttempt}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Mengirim...' : 'Kumpulkan Kuis'}
        </button>
      </div>
  );
}
