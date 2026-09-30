'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleOff,
  Clock3,
  Eye,
  FileQuestion,
  Flag,
  GraduationCap,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Target,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/v1'
).replace(/\/$/, '');

type QuizFilter =
  | 'all'
  | 'published'
  | 'unpublished'
  | 'admin_disabled';

interface QuizSubject {
  id: number | null;
  name: string | null;
  code: string | null;
}

interface QuizCreator {
  id: number;
  name: string | null;
  email: string | null;
}

interface AdminQuizListItem {
  id: number;
  creator_id: number;
  subject_id: number | null;
  title: string;
  slug: string;
  description?: string | null;
  duration_minutes?: number | null;
  max_attempts?: number | null;
  pass_score: number;
  is_published: boolean;
  is_admin_disabled: boolean;
  admin_disabled_at?: string | null;
  admin_disabled_by?: number | null;
  admin_disabled_reason?: string | null;
  admin_disabled_was_published?: boolean | null;
  moderator_name?: string | null;
  subject: QuizSubject;
  creator: QuizCreator;
  question_count: number;
  attempt_count: number;
  completed_attempt_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

interface QuizOption {
  id: number;
  option_text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: string;
  points: number;
  order: number;
  options: QuizOption[];
}

interface AttemptSummary {
  total: number;
  completed: number;
  in_progress: number;
  timed_out: number;
  average_score: number | null;
}

interface AdminQuizDetail
  extends Omit<
    AdminQuizListItem,
    | 'moderator_name'
    | 'attempt_count'
    | 'completed_attempt_count'
  > {
  moderator?: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
  questions: QuizQuestion[];
  attempt_summary: AttemptSummary;
}

interface DisableTarget {
  id: number;
  title: string;
}

interface RestoreTarget {
  id: number;
  title: string;
  previousPublished:
    | boolean
    | null
    | undefined;
}

function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem(
      'meetspace_auth_token'
    ) ||
    ''
  );
}

function clearAuthStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('access_token');
  localStorage.removeItem(
    'meetspace_auth_token'
  );
  localStorage.removeItem('user_data');
}

function formatDateTime(
  value?: string | null
): string {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

type QuizStatusLike = Pick<
  AdminQuizListItem,
  'is_published' | 'is_admin_disabled'
>;

function getStatusLabel(
  quiz: QuizStatusLike
): string {
  if (quiz.is_admin_disabled) {
    return 'Admin Disabled';
  }

  return quiz.is_published
    ? 'Published'
    : 'Unpublished';
}

function getStatusClass(
  quiz: QuizStatusLike
): string {
  if (quiz.is_admin_disabled) {
    return (
      'border-red-200 bg-red-50 ' +
      'text-red-700'
    );
  }

  if (quiz.is_published) {
    return (
      'border-emerald-200 ' +
      'bg-emerald-50 text-emerald-700'
    );
  }

  return (
    'border-slate-200 ' +
    'bg-slate-100 text-slate-600'
  );
}

export default function AdminQuizzesPage() {
  const router = useRouter();

  const [quizzes, setQuizzes] =
    useState<AdminQuizListItem[]>([]);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<QuizFilter>('all');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [
    selectedQuiz,
    setSelectedQuiz,
  ] =
    useState<AdminQuizDetail | null>(
      null
    );

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    disableTarget,
    setDisableTarget,
  ] =
    useState<DisableTarget | null>(
      null
    );

  const [
    disableReason,
    setDisableReason,
  ] = useState('');

  const [
    disableLoading,
    setDisableLoading,
  ] = useState(false);

  const [
    restoreTarget,
    setRestoreTarget,
  ] =
    useState<RestoreTarget | null>(
      null
    );

  const [
    restoreLoading,
    setRestoreLoading,
  ] = useState(false);

  const handleUnauthorized =
    useCallback(
      (status: number): boolean => {
        if (status === 401) {
          clearAuthStorage();
          router.replace('/login');
          return true;
        }

        if (status === 403) {
          router.replace('/dashboard');
          return true;
        }

        return false;
      },
      [router]
    );

  const loadQuizzes =
    useCallback(async () => {
      const token = getStoredToken();

      if (!token) {
        clearAuthStorage();
        router.replace('/login');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch(
          `${API_URL}/admin/quizzes`,
          {
            method: 'GET',
            headers: {
              Accept:
                'application/json',
              Authorization:
                `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        );

        if (
          handleUnauthorized(
            response.status
          )
        ) {
          return;
        }

        const payload =
          await response
            .json()
            .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              'Gagal mengambil daftar kuis.'
          );
        }

        setQuizzes(
          Array.isArray(payload?.data)
            ? payload.data
            : []
        );
      } catch (
        caughtError: unknown
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Terjadi kesalahan saat mengambil daftar kuis.'
        );
      } finally {
        setLoading(false);
      }
    }, [
      handleUnauthorized,
      router,
    ]);

  useEffect(() => {
    void loadQuizzes();
  }, [loadQuizzes]);

  const summary = useMemo(
    () => ({
      total: quizzes.length,

      published: quizzes.filter(
        (quiz) =>
          quiz.is_published &&
          !quiz.is_admin_disabled
      ).length,

      unpublished: quizzes.filter(
        (quiz) =>
          !quiz.is_published &&
          !quiz.is_admin_disabled
      ).length,

      adminDisabled: quizzes.filter(
        (quiz) =>
          quiz.is_admin_disabled
      ).length,
    }),
    [quizzes]
  );

  const filteredQuizzes = useMemo(
    () => {
      const normalized =
        searchQuery
          .trim()
          .toLowerCase();

      return quizzes.filter(
        (quiz) => {
          if (
            statusFilter ===
              'published' &&
            (
              !quiz.is_published ||
              quiz.is_admin_disabled
            )
          ) {
            return false;
          }

          if (
            statusFilter ===
              'unpublished' &&
            (
              quiz.is_published ||
              quiz.is_admin_disabled
            )
          ) {
            return false;
          }

          if (
            statusFilter ===
              'admin_disabled' &&
            !quiz.is_admin_disabled
          ) {
            return false;
          }

          if (!normalized) {
            return true;
          }

          const searchable = [
            quiz.title,
            quiz.description,
            quiz.creator?.name,
            quiz.creator?.email,
            quiz.subject?.name,
            quiz.subject?.code,
          ];

          return searchable.some(
            (value) =>
              String(value || '')
                .toLowerCase()
                .includes(normalized)
          );
        }
      );
    },
    [
      quizzes,
      searchQuery,
      statusFilter,
    ]
  );

  const openDetail = async (
    quiz: AdminQuizListItem
  ) => {
    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setDetailLoading(true);
    setError('');
    setSelectedQuiz(null);

    try {
      const response = await fetch(
        `${API_URL}/admin/quizzes/${quiz.id}`,
        {
          method: 'GET',
          headers: {
            Accept:
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );

      if (
        handleUnauthorized(
          response.status
        )
      ) {
        return;
      }

      const payload =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            'Gagal mengambil detail kuis.'
        );
      }

      if (payload?.data) {
        setSelectedQuiz(
          payload.data
        );
      }
    } catch (
      caughtError: unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal mengambil detail kuis.'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const disableQuiz = async () => {
    if (!disableTarget) return;

    const reason =
      disableReason.trim();

    if (reason.length < 10) {
      setError(
        'Alasan moderasi minimal 10 karakter.'
      );
      return;
    }

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setDisableLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/admin/quizzes/${disableTarget.id}/disable`,
        {
          method: 'POST',
          headers: {
            Accept:
              'application/json',
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason,
          }),
        }
      );

      if (
        handleUnauthorized(
          response.status
        )
      ) {
        return;
      }

      const payload =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        const firstError =
          payload?.errors
            ? Object.values(
                payload.errors
              ).flat()[0]
            : null;

        throw new Error(
          String(
            firstError ||
              payload?.message ||
              'Gagal menonaktifkan kuis.'
          )
        );
      }

      setSuccess(
        payload?.message ||
          'Kuis berhasil dinonaktifkan.'
      );

      setDisableTarget(null);
      setDisableReason('');
      setSelectedQuiz(null);

      await loadQuizzes();
    } catch (
      caughtError: unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal menonaktifkan kuis.'
      );
    } finally {
      setDisableLoading(false);
    }
  };

  const restoreQuiz = async () => {
    if (!restoreTarget) return;

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setRestoreLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/admin/quizzes/${restoreTarget.id}/restore`,
        {
          method: 'POST',
          headers: {
            Accept:
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      if (
        handleUnauthorized(
          response.status
        )
      ) {
        return;
      }

      const payload =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            'Gagal memulihkan moderasi kuis.'
        );
      }

      setSuccess(
        payload?.message ||
          'Moderasi kuis berhasil dipulihkan.'
      );

      setRestoreTarget(null);
      setSelectedQuiz(null);

      await loadQuizzes();
    } catch (
      caughtError: unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal memulihkan moderasi kuis.'
      );
    } finally {
      setRestoreLoading(false);
    }
  };

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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Quiz"
          value={summary.total}
          icon={
            <FileQuestion className="h-5 w-5" />
          }
          iconClass="bg-violet-50 text-violet-600"
        />

        <SummaryCard
          label="Published"
          value={summary.published}
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          label="Unpublished"
          value={
            summary.unpublished
          }
          icon={
            <CircleOff className="h-5 w-5" />
          }
          iconClass="bg-slate-100 text-slate-600"
        />

        <SummaryCard
          label="Admin Disabled"
          value={
            summary.adminDisabled
          }
          icon={
            <ShieldAlert className="h-5 w-5" />
          }
          iconClass="bg-red-50 text-red-600"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              placeholder="Cari judul, creator, email, atau mata kuliah..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as QuizFilter
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
          >
            <option value="all">
              Semua Status
            </option>
            <option value="published">
              Published
            </option>
            <option value="unpublished">
              Unpublished
            </option>
            <option value="admin_disabled">
              Admin Disabled
            </option>
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-400">
            Menampilkan{' '}
            <span className="font-semibold text-slate-700">
              {
                filteredQuizzes.length
              }
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-slate-700">
              {quizzes.length}
            </span>{' '}
            kuis
          </p>

          {(searchQuery ||
            statusFilter !==
              'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter(
                  'all'
                );
              }}
              className="text-xs font-semibold text-violet-600 hover:text-violet-700"
            >
              Reset Filter
            </button>
          )}
        </div>
      </section>

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

      {(detailLoading ||
        selectedQuiz) && (
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
      )}

      {disableTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !disableLoading
            ) {
              setDisableTarget(
                null
              );
              setDisableReason('');
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>

              <div>
                <h2 className="!text-slate-950 text-base font-bold">
                  Nonaktifkan Quiz?
                </h2>
                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Quiz{' '}
                  <span className="font-semibold text-slate-700">
                    {
                      disableTarget.title
                    }
                  </span>{' '}
                  akan disembunyikan dari
                  pengguna. Riwayat attempt
                  tetap disimpan.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-bold text-slate-700">
                Alasan Moderasi
              </label>

              <textarea
                value={disableReason}
                onChange={(event) =>
                  setDisableReason(
                    event.target.value
                  )
                }
                rows={4}
                maxLength={500}
                placeholder="Jelaskan alasan quiz dinonaktifkan..."
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-50"
              />

              <div className="mt-1.5 flex justify-between text-[10px]">
                <span
                  className={
                    disableReason
                      .trim().length <
                    10
                      ? 'text-red-500'
                      : 'text-emerald-600'
                  }
                >
                  Minimal 10 karakter
                </span>

                <span className="text-slate-400">
                  {
                    disableReason.length
                  }
                  /500
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={
                  disableLoading
                }
                onClick={() => {
                  setDisableTarget(
                    null
                  );
                  setDisableReason('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  disableLoading ||
                  disableReason
                    .trim().length <
                    10
                }
                onClick={() =>
                  void disableQuiz()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {disableLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Flag className="h-3.5 w-3.5" />
                    Ya, Nonaktifkan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {restoreTarget && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !restoreLoading
            ) {
              setRestoreTarget(
                null
              );
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                <RotateCcw className="h-5 w-5 text-emerald-600" />
              </div>

              <div>
                <h2 className="!text-slate-950 text-base font-bold">
                  Pulihkan Moderasi?
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  Moderasi pada quiz{' '}
                  <span className="font-semibold text-slate-700">
                    {
                      restoreTarget.title
                    }
                  </span>{' '}
                  akan dihapus.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs leading-5 text-emerald-700">
                Status publish akan
                dikembalikan seperti sebelum
                tindakan admin:{' '}
                <span className="font-bold">
                  {restoreTarget.previousPublished
                    ? 'Published'
                    : 'Unpublished'}
                </span>
                .
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={
                  restoreLoading
                }
                onClick={() =>
                  setRestoreTarget(
                    null
                  )
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  restoreLoading
                }
                onClick={() =>
                  void restoreQuiz()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {restoreLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3.5 w-3.5" />
                    Ya, Pulihkan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 !text-slate-950 text-3xl font-bold tracking-tight">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function MetricMini({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 !text-slate-950 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function DetailMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-center gap-2 text-violet-600">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 !text-slate-950 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0">
      <span className="text-xs text-slate-400">
        {label}
      </span>
      <span className="max-w-[65%] text-right text-xs font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}