import type { Dispatch, SetStateAction } from 'react';
import { X } from 'lucide-react';
import type { Quiz, QuizAnswers, QuizResult } from './types';
import QuizResultView from './QuizResultView';
import QuizPreviewView from './QuizPreviewView';
import QuizAttemptView from './QuizAttemptView';

type QuizPlayerModalProps = {
  selectedQuiz: Quiz;
  setSelectedQuiz: (quiz: Quiz | null) => void;
  previewMode: boolean;
  setPreviewMode: (previewMode: boolean) => void;
  result: QuizResult | null;
  answers: QuizAnswers;
  setAnswers: Dispatch<SetStateAction<QuizAnswers>>;
  submitting: boolean;
  submitAttempt: () => Promise<void>;
  retryQuiz: () => Promise<void>;
};

export default function QuizPlayerModal({
  selectedQuiz,
  setSelectedQuiz,
  previewMode,
  setPreviewMode,
  result,
  answers,
  setAnswers,
  submitting,
  submitAttempt,
  retryQuiz,
}: QuizPlayerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-600">
              {previewMode ? 'Preview Kuis' : 'Mengerjakan Kuis'}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{selectedQuiz.title}</h2>
          </div>
          <button
            type="button"
            onClick={() => { setSelectedQuiz(null); setPreviewMode(false); }}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {result ? (
          <QuizResultView
            result={result}
            setSelectedQuiz={setSelectedQuiz}
            retryQuiz={retryQuiz}
          />
        ) : previewMode ? (
          <QuizPreviewView
            selectedQuiz={selectedQuiz}
            setSelectedQuiz={setSelectedQuiz}
            setPreviewMode={setPreviewMode}
          />
        ) : (
          <QuizAttemptView
            selectedQuiz={selectedQuiz}
            answers={answers}
            setAnswers={setAnswers}
            submitting={submitting}
            submitAttempt={submitAttempt}
          />
        )}
      </div>
    </div>
  );
}
