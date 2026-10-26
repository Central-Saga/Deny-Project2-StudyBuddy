'use client';

import { AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { useQuizzes } from '@/hooks/quizzes/useQuizzes';
import QuizzesHeader from './QuizzesHeader';
import QuizStatusTabs from './QuizStatusTabs';
import QuizList from './QuizList';
import QuizPlayerModal from './QuizPlayerModal';
import DeactivateQuizModal from './DeactivateQuizModal';
import QuizFormModal from './QuizFormModal';

export default function QuizzesClient() {
  const {
    quizzes,
    subjects,
    loading,
    error,
    quizListError,
    quizStatus,
    setQuizStatus,
    selectedQuiz,
    setSelectedQuiz,
    previewMode,
    setPreviewMode,
    answers,
    setAnswers,
    submitting,
    result,
    formOpen,
    setFormOpen,
    editingQuiz,
    form,
    setForm,
    draftQuestions,
    setDraftQuestions,
    savingQuiz,
    deactivatingId,
    reactivatingId,
    deactivateTarget,
    setDeactivateTarget,
    loadData,
    openQuiz,
    openPreview,
    submitAttempt,
    retryQuiz,
    updateQuestion,
    updateOption,
    setCorrectOption,
    changeQuestionType,
    openCreate,
    openEdit,
    saveQuiz,
    deactivateQuiz,
    reactivateQuiz,
  } = useQuizzes();

  return (
    <div className="w-full space-y-6 pb-8">
      <QuizzesHeader openCreate={openCreate} />
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <QuizStatusTabs quizStatus={quizStatus} setQuizStatus={setQuizStatus} />
      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
          Memuat kuis...
        </div>
      ) : quizListError ? (
        <div
          role="alert"
          className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm"
        >
          <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
          <h2 className="mt-4 text-base font-bold text-slate-800">
            Daftar kuis belum dapat dimuat
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {quizListError}
          </p>
          <button
            type="button"
            onClick={() => void loadData(quizStatus)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Coba Lagi
          </button>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
          <h2 className="mt-4 text-base font-bold text-slate-700">
            {quizStatus === 'active' ? 'Belum ada kuis aktif' : 'Belum ada kuis nonaktif'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {quizStatus === 'active'
              ? 'Buat kuis pertama untuk mulai belajar interaktif.'
              : 'Kuis yang kamu nonaktifkan akan tersimpan di sini dan dapat diaktifkan kembali.'}
          </p>
        </div>
      ) : (
        <QuizList
          quizzes={quizzes}
          reactivatingId={reactivatingId}
          deactivatingId={deactivatingId}
          openPreview={openPreview}
          openQuiz={openQuiz}
          openEdit={openEdit}
          reactivateQuiz={reactivateQuiz}
          setDeactivateTarget={setDeactivateTarget}
        />
      )}
      {selectedQuiz && (
        <QuizPlayerModal
          selectedQuiz={selectedQuiz}
          setSelectedQuiz={setSelectedQuiz}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          result={result}
          answers={answers}
          setAnswers={setAnswers}
          submitting={submitting}
          submitAttempt={submitAttempt}
          retryQuiz={retryQuiz}
        />
      )}
      {deactivateTarget && (
        <DeactivateQuizModal
          deactivateTarget={deactivateTarget}
          deactivatingId={deactivatingId}
          setDeactivateTarget={setDeactivateTarget}
          deactivateQuiz={deactivateQuiz}
        />
      )}
      {formOpen && (
        <QuizFormModal
          editingQuiz={editingQuiz}
          form={form}
          setForm={setForm}
          subjects={subjects}
          draftQuestions={draftQuestions}
          setDraftQuestions={setDraftQuestions}
          savingQuiz={savingQuiz}
          setFormOpen={setFormOpen}
          saveQuiz={saveQuiz}
          updateQuestion={updateQuestion}
          updateOption={updateOption}
          setCorrectOption={setCorrectOption}
          changeQuestionType={changeQuestionType}
        />
      )}
    </div>
  );
}
