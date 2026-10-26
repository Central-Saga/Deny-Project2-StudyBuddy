'use client';

import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAdminQuizzes } from '@/hooks/admin-quizzes/useAdminQuizzes';
import QuizSummary from './QuizSummary';
import QuizFilters from './QuizFilters';
import QuizList from './QuizList';
import QuizDetailModal from './QuizDetailModal';
import DisableQuizModal from './DisableQuizModal';
import RestoreQuizModal from './RestoreQuizModal';

export default function AdminQuizzesClient() {
  const {
    quizzes,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    setError,
    quizzesLoadError,
    success,
    setSuccess,
    selectedQuiz,
    setSelectedQuiz,
    detailLoading,
    loadQuizzes,
    summary,
    filteredQuizzes,
    openDetail,
    disableTarget,
    setDisableTarget,
    disableReason,
    setDisableReason,
    disableLoading,
    restoreTarget,
    setRestoreTarget,
    restoreLoading,
    disableQuiz,
    restoreQuiz,
  } = useAdminQuizzes();

  if (!loading && quizzesLoadError) {
    return (
      <div
        role="alert"
        className="flex min-h-[420px] items-center justify-center p-6"
      >
        <div className="w-full max-w-xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Daftar kuis belum dapat dimuat
          </h2>

          <p className="mt-3 text-sm text-slate-500">
            {quizzesLoadError}
          </p>

          <button
            type="button"
            onClick={() => void loadQuizzes()}
            disabled={loading}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50/60 to-blue-50 p-6 shadow-sm lg:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-blue-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Quiz Management
            </div>

            <h1 className="!text-slate-950 text-2xl font-bold tracking-tight sm:text-3xl">
              Quiz Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Pantau seluruh kuis, lihat
              soal dan aktivitas pengerjaan,
              serta lakukan moderasi tanpa
              menghapus riwayat attempt.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadQuizzes()
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-violet-200 hover:bg-violet-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading
                  ? 'animate-spin'
                  : ''
              }`}
            />
            Refresh Data
          </button>
        </div>
      </section>

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            {success}
          </div>

          <button
            type="button"
            onClick={() =>
              setSuccess('')
            }
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            {error}
          </div>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <QuizSummary summary={summary} />

      <QuizFilters
        quizzes={quizzes}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        filteredQuizzes={filteredQuizzes}
      />

      <QuizList
        loading={loading}
        filteredQuizzes={filteredQuizzes}
        openDetail={openDetail}
        setDisableTarget={setDisableTarget}
        setDisableReason={setDisableReason}
        setRestoreTarget={setRestoreTarget}
      />

      {(detailLoading ||
        selectedQuiz) && (
        <QuizDetailModal
          detailLoading={detailLoading}
          selectedQuiz={selectedQuiz}
          setSelectedQuiz={setSelectedQuiz}
          setDisableTarget={setDisableTarget}
          setDisableReason={setDisableReason}
          setRestoreTarget={setRestoreTarget}
        />
      )}

      {disableTarget && (
        <DisableQuizModal
          disableTarget={disableTarget}
          setDisableTarget={setDisableTarget}
          disableReason={disableReason}
          setDisableReason={setDisableReason}
          disableLoading={disableLoading}
          disableQuiz={disableQuiz}
        />
      )}

      {restoreTarget && (
        <RestoreQuizModal
          restoreTarget={restoreTarget}
          setRestoreTarget={setRestoreTarget}
          restoreLoading={restoreLoading}
          restoreQuiz={restoreQuiz}
        />
      )}
    </div>
  );
}
