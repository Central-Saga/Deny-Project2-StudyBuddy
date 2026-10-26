import type { Dispatch, SetStateAction } from 'react';
import {
  Eye,
  FileQuestion,
  Flag,
  RotateCcw,
  ShieldAlert,
  UserRound,
} from 'lucide-react';
import type {
  AdminQuizListItem,
  DisableTarget,
  RestoreTarget,
} from './types';
import { MetricMini } from './QuizCards';
import {
  formatDateTime,
  getStatusClass,
  getStatusLabel,
} from './utils';

interface QuizListProps {
  loading: boolean;
  filteredQuizzes: AdminQuizListItem[];
  openDetail: (quiz: AdminQuizListItem) => Promise<void>;
  setDisableTarget: Dispatch<SetStateAction<DisableTarget | null>>;
  setDisableReason: Dispatch<SetStateAction<string>>;
  setRestoreTarget: Dispatch<SetStateAction<RestoreTarget | null>>;
}

export default function QuizList({
  loading,
  filteredQuizzes,
  openDetail,
  setDisableTarget,
  setDisableReason,
  setRestoreTarget,
}: QuizListProps) {
  return (
    <section>
      {loading ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : filteredQuizzes.length ===
        0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <FileQuestion className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-4 !text-slate-950 text-sm font-bold">
            Tidak ada kuis
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Tidak ada data yang cocok
            dengan pencarian atau filter
            saat ini.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredQuizzes.map(
            (quiz) => (
              <article
                key={quiz.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <FileQuestion className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClass(
                          quiz
                        )}`}
                      >
                        {getStatusLabel(
                          quiz
                        )}
                      </span>

                      {quiz.subject
                        ?.name && (
                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                          {quiz.subject
                            .code
                            ? `${quiz.subject.code} · `
                            : ''}
                          {
                            quiz.subject
                              .name
                          }
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 !text-slate-950 text-base font-bold">
                      {quiz.title}
                    </h2>

                    <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                      {quiz.description ||
                        'Tidak ada deskripsi.'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetricMini
                    label="Questions"
                    value={
                      quiz.question_count
                    }
                  />
                  <MetricMini
                    label="Attempts"
                    value={
                      quiz.attempt_count
                    }
                  />
                  <MetricMini
                    label="Completed"
                    value={
                      quiz.completed_attempt_count
                    }
                  />
                  <MetricMini
                    label="Pass Score"
                    value={`${quiz.pass_score}%`}
                  />
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-3.5">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-slate-400" />

                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-700">
                        {quiz.creator
                          ?.name ||
                          'Unknown Creator'}
                      </p>

                      <p className="truncate text-[10px] text-slate-400">
                        {quiz.creator
                          ?.email ||
                          '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {quiz.is_admin_disabled && (
                  <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3.5">
                    <div className="flex gap-2">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />

                      <div>
                        <p className="text-xs font-bold text-red-700">
                          Dinonaktifkan
                          Administrator
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-red-600">
                          {quiz.admin_disabled_reason ||
                            'Tidak ada alasan moderasi.'}
                        </p>

                        <p className="mt-1 text-[10px] text-red-400">
                          {quiz.moderator_name
                            ? `Oleh ${quiz.moderator_name} · `
                            : ''}
                          {formatDateTime(
                            quiz.admin_disabled_at
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      void openDetail(
                        quiz
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Detail
                  </button>

                  {quiz.is_admin_disabled ? (
                    <button
                      type="button"
                      onClick={() =>
                        setRestoreTarget({
                          id: quiz.id,
                          title:
                            quiz.title,
                          previousPublished:
                            quiz.admin_disabled_was_published,
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Pulihkan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDisableReason(
                          ''
                        );
                        setDisableTarget({
                          id: quiz.id,
                          title:
                            quiz.title,
                        });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      Nonaktifkan
                    </button>
                  )}

                  <div className="ml-auto text-[10px] text-slate-400">
                    Updated{' '}
                    {formatDateTime(
                      quiz.updated_at
                    )}
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      )}
    </section>
  );
}
