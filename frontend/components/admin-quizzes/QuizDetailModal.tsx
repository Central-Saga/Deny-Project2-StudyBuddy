import type { Dispatch, SetStateAction } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Flag,
  GraduationCap,
  Loader2,
  RotateCcw,
  ShieldAlert,
  Target,
  X,
  XCircle,
} from 'lucide-react';
import type {
  AdminQuizDetail,
  DisableTarget,
  RestoreTarget,
} from './types';
import { DetailMetric, InfoRow, MetricMini } from './QuizCards';
import {
  formatDateTime,
  getStatusClass,
  getStatusLabel,
} from './utils';

interface QuizDetailModalProps {
  detailLoading: boolean;
  selectedQuiz: AdminQuizDetail | null;
  setSelectedQuiz: Dispatch<SetStateAction<AdminQuizDetail | null>>;
  setDisableTarget: Dispatch<SetStateAction<DisableTarget | null>>;
  setDisableReason: Dispatch<SetStateAction<string>>;
  setRestoreTarget: Dispatch<SetStateAction<RestoreTarget | null>>;
}

export default function QuizDetailModal({
  detailLoading,
  selectedQuiz,
  setSelectedQuiz,
  setDisableTarget,
  setDisableReason,
  setRestoreTarget,
}: QuizDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          setSelectedQuiz(null);
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {detailLoading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
              <p className="text-xs font-semibold text-slate-500">
                Memuat detail
                kuis...
              </p>
            </div>
          </div>
        ) : selectedQuiz ? (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                      selectedQuiz
                    )}`}
                  >
                    {getStatusLabel(
                      selectedQuiz
                    )}
                  </span>

                  {selectedQuiz
                    .subject?.name && (
                    <span className="text-[10px] font-semibold text-violet-600">
                      {
                        selectedQuiz
                          .subject
                          .name
                      }
                    </span>
                  )}
                </div>

                <h2 className="mt-2 !text-slate-950 text-xl font-bold">
                  {
                    selectedQuiz.title
                  }
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Dibuat oleh{' '}
                  <span className="font-semibold text-slate-600">
                    {selectedQuiz
                      .creator
                      ?.name || '-'}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedQuiz(
                    null
                  )
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[calc(92vh-82px)] overflow-y-auto p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DetailMetric
                  icon={
                    <BookOpen className="h-4 w-4" />
                  }
                  label="Questions"
                  value={
                    selectedQuiz.question_count
                  }
                />

                <DetailMetric
                  icon={
                    <Target className="h-4 w-4" />
                  }
                  label="Pass Score"
                  value={`${selectedQuiz.pass_score}%`}
                />

                <DetailMetric
                  icon={
                    <Clock3 className="h-4 w-4" />
                  }
                  label="Duration"
                  value={
                    selectedQuiz.duration_minutes
                      ? `${selectedQuiz.duration_minutes} min`
                      : 'Unlimited'
                  }
                />

                <DetailMetric
                  icon={
                    <GraduationCap className="h-4 w-4" />
                  }
                  label="Max Attempts"
                  value={
                    selectedQuiz.max_attempts ??
                    'Unlimited'
                  }
                />
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="!text-slate-950 text-sm font-bold">
                    Quiz Information
                  </h3>

                  <div className="mt-4 space-y-3">
                    <InfoRow
                      label="Creator"
                      value={
                        selectedQuiz
                          .creator
                          ?.name ||
                        '-'
                      }
                    />
                    <InfoRow
                      label="Email"
                      value={
                        selectedQuiz
                          .creator
                          ?.email ||
                        '-'
                      }
                    />
                    <InfoRow
                      label="Subject"
                      value={
                        selectedQuiz
                          .subject
                          ?.name ||
                        '-'
                      }
                    />
                    <InfoRow
                      label="Created"
                      value={formatDateTime(
                        selectedQuiz.created_at
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <h3 className="!text-slate-950 text-sm font-bold">
                    Attempt Summary
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MetricMini
                      label="Total"
                      value={
                        selectedQuiz
                          .attempt_summary
                          ?.total || 0
                      }
                    />
                    <MetricMini
                      label="Completed"
                      value={
                        selectedQuiz
                          .attempt_summary
                          ?.completed ||
                        0
                      }
                    />
                    <MetricMini
                      label="In Progress"
                      value={
                        selectedQuiz
                          .attempt_summary
                          ?.in_progress ||
                        0
                      }
                    />
                    <MetricMini
                      label="Avg Score"
                      value={
                        selectedQuiz
                          .attempt_summary
                          ?.average_score !==
                        null
                          ? `${selectedQuiz.attempt_summary.average_score}%`
                          : '-'
                      }
                    />
                  </div>
                </div>
              </div>

              {selectedQuiz.description && (
                <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                  <h3 className="!text-slate-950 text-sm font-bold">
                    Description
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {
                      selectedQuiz.description
                    }
                  </p>
                </div>
              )}

              {selectedQuiz.is_admin_disabled && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="flex gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                    <div>
                      <h3 className="text-sm font-bold text-red-700">
                        Admin
                        Moderation
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-red-600">
                        {selectedQuiz.admin_disabled_reason ||
                          '-'}
                      </p>
                      <p className="mt-2 text-[10px] text-red-400">
                        {selectedQuiz
                          .moderator
                          ?.name
                          ? `Moderator: ${selectedQuiz.moderator.name} · `
                          : ''}
                        {formatDateTime(
                          selectedQuiz.admin_disabled_at
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="!text-slate-950 text-sm font-bold">
                      Questions &
                      Answer Key
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Jawaban benar
                      ditampilkan untuk
                      kebutuhan moderasi
                      administrator.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedQuiz.questions.map(
                    (
                      question,
                      index
                    ) => (
                      <div
                        key={
                          question.id
                        }
                        className="rounded-2xl border border-slate-200 p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-xs font-bold text-violet-700">
                            {index +
                              1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-6 text-slate-800">
                              {
                                question.question_text
                              }
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-500">
                                {
                                  question.question_type
                                }
                              </span>
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-600">
                                {
                                  question.points
                                }{' '}
                                point
                              </span>
                            </div>

                            <div className="mt-4 space-y-2">
                              {question.options.map(
                                (
                                  option
                                ) => (
                                  <div
                                    key={
                                      option.id
                                    }
                                    className={`flex items-start gap-3 rounded-xl border px-3.5 py-3 ${
                                      option.is_correct
                                        ? 'border-emerald-200 bg-emerald-50'
                                        : 'border-slate-200 bg-slate-50'
                                    }`}
                                  >
                                    {option.is_correct ? (
                                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                    ) : (
                                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                                    )}

                                    <p
                                      className={`text-xs leading-5 ${
                                        option.is_correct
                                          ? 'font-semibold text-emerald-700'
                                          : 'text-slate-600'
                                      }`}
                                    >
                                      {
                                        option.option_text
                                      }
                                    </p>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                {selectedQuiz.is_admin_disabled ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRestoreTarget({
                        id: selectedQuiz.id,
                        title:
                          selectedQuiz.title,
                        previousPublished:
                          selectedQuiz.admin_disabled_was_published,
                      });
                      setSelectedQuiz(
                        null
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Pulihkan
                    Moderasi
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDisableReason(
                        ''
                      );
                      setDisableTarget({
                        id: selectedQuiz.id,
                        title:
                          selectedQuiz.title,
                      });
                      setSelectedQuiz(
                        null
                      );
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    Nonaktifkan
                    Quiz
                  </button>
                )}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
