'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileQuestion,
  FileWarning,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserX,
  Users,
  UsersRound,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/v1'
).replace(/\/$/, '');

interface DashboardStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  total_groups: number;
  total_sessions: number;
  total_materials: number;
  total_quizzes: number;
  published_quizzes: number;
  total_tutors: number;
  verified_tutors: number;
  total_material_reports: number;
  pending_material_reports: number;
}

const EMPTY_STATS: DashboardStats = {
  total_users: 0,
  active_users: 0,
  suspended_users: 0,
  total_groups: 0,
  total_sessions: 0,
  total_materials: 0,
  total_quizzes: 0,
  published_quizzes: 0,
  total_tutors: 0,
  verified_tutors: 0,
  total_material_reports: 0,
  pending_material_reports: 0,
};

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

function toNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function normalizeStats(
  payload: unknown
): DashboardStats {
  if (
    typeof payload !== 'object' ||
    payload === null
  ) {
    return EMPTY_STATS;
  }

  const root = payload as Record<
    string,
    unknown
  >;

  const data =
    typeof root.data === 'object' &&
    root.data !== null
      ? (root.data as Record<
          string,
          unknown
        >)
      : null;

  const nestedStats =
    data &&
    typeof data.stats === 'object' &&
    data.stats !== null
      ? (data.stats as Record<
          string,
          unknown
        >)
      : null;

  const directStats =
    typeof root.stats === 'object' &&
    root.stats !== null
      ? (root.stats as Record<
          string,
          unknown
        >)
      : null;

  const source =
    nestedStats ||
    directStats ||
    data ||
    root;

  return {
    total_users: toNumber(
      source.total_users
    ),
    active_users: toNumber(
      source.active_users
    ),
    suspended_users: toNumber(
      source.suspended_users
    ),
    total_groups: toNumber(
      source.total_groups
    ),
    total_sessions: toNumber(
      source.total_sessions
    ),
    total_materials: toNumber(
      source.total_materials
    ),
    total_quizzes: toNumber(
      source.total_quizzes
    ),
    published_quizzes: toNumber(
      source.published_quizzes
    ),
    total_tutors: toNumber(
      source.total_tutors
    ),
    verified_tutors: toNumber(
      source.verified_tutors
    ),
    total_material_reports: toNumber(
      source.total_material_reports
    ),
    pending_material_reports: toNumber(
      source.pending_material_reports
    ),
  };
}

function percentage(
  part: number,
  total: number
): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round((part / total) * 100)
    )
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] =
    useState<DashboardStats>(
      EMPTY_STATS
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

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

  const loadDashboard =
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
          `${API_URL}/admin/dashboard`,
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
              'Gagal mengambil statistik dashboard.'
          );
        }

        setStats(
          normalizeStats(payload)
        );
      } catch (
        caughtError: unknown
      ) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Terjadi kesalahan saat mengambil dashboard.'
        );
      } finally {
        setLoading(false);
      }
    }, [
      handleUnauthorized,
      router,
    ]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeUserRate =
    percentage(
      stats.active_users,
      stats.total_users
    );

  const verifiedTutorRate =
    percentage(
      stats.verified_tutors,
      stats.total_tutors
    );

  const publishedQuizRate =
    percentage(
      stats.published_quizzes,
      stats.total_quizzes
    );

  const reviewedReports = Math.max(
    0,
    stats.total_material_reports -
      stats.pending_material_reports
  );

  const reviewedReportRate =
    percentage(
      reviewedReports,
      stats.total_material_reports
    );

  const metrics = useMemo(
    () => [
      {
        label: 'Total Users',
        value: stats.total_users,
        helper:
          `${stats.active_users} active`,
        icon: Users,
        iconClass:
          'bg-blue-50 text-blue-600',
        accent:
          'from-blue-500/10 to-transparent',
      },
      {
        label: 'Study Groups',
        value: stats.total_groups,
        helper:
          'Komunitas belajar',
        icon: UsersRound,
        iconClass:
          'bg-indigo-50 text-indigo-600',
        accent:
          'from-indigo-500/10 to-transparent',
      },
      {
        label: 'Study Sessions',
        value: stats.total_sessions,
        helper:
          'Sesi belajar',
        icon: CalendarDays,
        iconClass:
          'bg-violet-50 text-violet-600',
        accent:
          'from-violet-500/10 to-transparent',
      },
      {
        label: 'Materials',
        value: stats.total_materials,
        helper:
          'Materi tersimpan',
        icon: BookOpen,
        iconClass:
          'bg-cyan-50 text-cyan-600',
        accent:
          'from-cyan-500/10 to-transparent',
      },
      {
        label: 'Quizzes',
        value: stats.total_quizzes,
        helper:
          `${stats.published_quizzes} published`,
        icon: FileQuestion,
        iconClass:
          'bg-amber-50 text-amber-600',
        accent:
          'from-amber-500/10 to-transparent',
      },
      {
        label: 'Peer Tutors',
        value: stats.total_tutors,
        helper:
          `${stats.verified_tutors} verified`,
        icon: GraduationCap,
        iconClass:
          'bg-emerald-50 text-emerald-600',
        accent:
          'from-emerald-500/10 to-transparent',
      },
    ],
    [stats]
  );

  const distribution = useMemo(
    () => [
      {
        label: 'Users',
        value: stats.total_users,
        icon: Users,
        barClass: 'bg-blue-500',
      },
      {
        label: 'Groups',
        value: stats.total_groups,
        icon: UsersRound,
        barClass: 'bg-indigo-500',
      },
      {
        label: 'Sessions',
        value: stats.total_sessions,
        icon: CalendarDays,
        barClass: 'bg-violet-500',
      },
      {
        label: 'Materials',
        value: stats.total_materials,
        icon: BookOpen,
        barClass: 'bg-cyan-500',
      },
      {
        label: 'Quizzes',
        value: stats.total_quizzes,
        icon: FileQuestion,
        barClass: 'bg-amber-500',
      },
      {
        label: 'Tutors',
        value: stats.total_tutors,
        icon: GraduationCap,
        barClass: 'bg-emerald-500',
      },
    ],
    [stats]
  );

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/80 to-violet-50 p-6 shadow-sm lg:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-violet-300/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Study Buddy Overview
            </div>

            <h1 className="!text-slate-950 text-2xl font-bold tracking-tight sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ringkasan kondisi platform,
              aktivitas utama, dan area yang
              membutuhkan perhatian
              administrator.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                System Status
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                <span className="text-xs font-bold text-slate-700">
                  Operational
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
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
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <div
                key={metric.label}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b ${metric.accent}`}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      {metric.label}
                    </p>

                    <p className="mt-2 !text-slate-950 text-3xl font-bold tracking-tight">
                      {metric.value}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {metric.helper}
                    </p>
                  </div>

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${metric.iconClass}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/70 p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-blue-200/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-violet-200/20 blur-3xl" />

          <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                  <Activity className="h-4 w-4" />
                </div>

                <div>
                  <h2 className="!text-slate-950 text-sm font-bold">
                    Platform Distribution
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Distribusi data utama Study Buddy.
                  </p>
                </div>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-100 bg-white/90 px-3 py-1 text-[10px] font-semibold text-blue-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live snapshot
            </span>
          </div>

          <div className="relative mt-6">
            <HorizontalBarChart
              items={distribution}
            />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 shadow-sm sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-blue-200/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-violet-200/25 blur-3xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-500/20">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <h2 className="!text-slate-950 text-sm font-bold">
                  Platform Health
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Rasio penting platform.
                </p>
              </div>
            </div>

            <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
              Healthy
            </span>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-3">
            <DonutMetric
              label="Active Users"
              percentage={activeUserRate}
              value={`${stats.active_users}/${stats.total_users}`}
              strokeClass="stroke-blue-500"
              accentClass="text-blue-600"
            />

            <DonutMetric
              label="Verified Tutors"
              percentage={verifiedTutorRate}
              value={`${stats.verified_tutors}/${stats.total_tutors}`}
              strokeClass="stroke-emerald-500"
              accentClass="text-emerald-600"
            />

            <DonutMetric
              label="Published Quiz"
              percentage={publishedQuizRate}
              value={`${stats.published_quizzes}/${stats.total_quizzes}`}
              strokeClass="stroke-violet-500"
              accentClass="text-violet-600"
            />

            <DonutMetric
              label="Reports Reviewed"
              percentage={reviewedReportRate}
              value={`${reviewedReports}/${stats.total_material_reports}`}
              strokeClass="stroke-amber-500"
              accentClass="text-amber-600"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div>
              <h2 className="!text-slate-950 text-sm font-bold">
                Needs Attention
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Area yang perlu ditinjau admin.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <AttentionItem
              icon={
                <UserX className="h-4 w-4" />
              }
              label="Suspended Users"
              value={
                stats.suspended_users
              }
              href="/admin/users"
              tone="red"
            />

            <AttentionItem
              icon={
                <FileWarning className="h-4 w-4" />
              }
              label="Pending Material Reports"
              value={
                stats.pending_material_reports
              }
              href="/admin/reports"
              tone="amber"
            />

            <AttentionItem
              icon={
                <GraduationCap className="h-4 w-4" />
              }
              label="Unverified Tutors"
              value={Math.max(
                0,
                stats.total_tutors -
                  stats.verified_tutors
              )}
              href="/admin/tutors"
              tone="blue"
            />

            <AttentionItem
              icon={
                <FileQuestion className="h-4 w-4" />
              }
              label="Unpublished Quizzes"
              value={Math.max(
                0,
                stats.total_quizzes -
                  stats.published_quizzes
              )}
              href="/admin/quizzes"
              tone="slate"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="!text-slate-950 text-sm font-bold">
                Quick Management
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Akses cepat ke fitur admin.
              </p>
            </div>

            <span className="rounded-xl bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
              Shortcuts
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <QuickAction
              href="/admin/users"
              title="Manage Users"
              description="Kelola status akun pengguna."
              icon={
                <Users className="h-5 w-5" />
              }
              iconClass="bg-blue-50 text-blue-600"
            />

            <QuickAction
              href="/admin/groups"
              title="Study Groups"
              description="Pantau seluruh grup belajar."
              icon={
                <UsersRound className="h-5 w-5" />
              }
              iconClass="bg-indigo-50 text-indigo-600"
            />

            <QuickAction
              href="/admin/quizzes"
              title="Quiz Management"
              description="Moderasi dan pantau kuis."
              icon={
                <FileQuestion className="h-5 w-5" />
              }
              iconClass="bg-violet-50 text-violet-600"
            />

            <QuickAction
              href="/admin/tutors"
              title="Tutor Verification"
              description="Verifikasi peer tutor."
              icon={
                <BadgeCheck className="h-5 w-5" />
              }
              iconClass="bg-emerald-50 text-emerald-600"
            />

            <QuickAction
              href="/admin/reports"
              title="Material Reports"
              description="Tinjau laporan materi."
              icon={
                <FileWarning className="h-5 w-5" />
              }
              iconClass="bg-amber-50 text-amber-600"
            />

            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-700">
                Core Admin Ready
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-400">
                Fitur admin utama sudah terhubung
                dalam satu panel.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function HorizontalBarChart({
  items,
}: {
  items: Array<{
    label: string;
    value: number;
    icon: React.ComponentType<{
      className?: string;
    }>;
    barClass: string;
  }>;
}) {
  const maxValue = Math.max(
    1,
    ...items.map(
      (item) => item.value
    )
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        const width =
          item.value <= 0
            ? 0
            : Math.max(
                10,
                Math.round(
                  (item.value /
                    maxValue) *
                    100
                )
              );

        return (
          <div
            key={item.label}
            className="rounded-2xl border border-white/90 bg-white/80 p-3.5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                  <Icon className="h-3.5 w-3.5" />
                </div>

                <span className="truncate text-xs font-semibold text-slate-700">
                  {item.label}
                </span>
              </div>

              <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-800">
                {item.value}
              </span>
            </div>

            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[9px] font-medium uppercase tracking-wider text-slate-300">
                  Distribution
                </span>

                <span className="text-[10px] font-bold text-slate-400">
                  {width}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.barClass}`}
                  style={{
                    width: `${width}%`,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DonutMetric({
  label,
  percentage: progress,
  value,
  strokeClass,
  accentClass,
}: {
  label: string;
  percentage: number;
  value: string;
  strokeClass: string;
  accentClass: string;
}) {
  const radius = 32;
  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (progress / 100) *
      circumference;

  return (
    <div className="group rounded-2xl border border-white/90 bg-white/80 p-3 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-100 hover:shadow-md">
      <div className="relative mx-auto h-[86px] w-[86px]">
        <svg
          viewBox="0 0 80 80"
          className="-rotate-90"
        >
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="7"
            className="stroke-slate-100"
          />

          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={
              circumference
            }
            strokeDashoffset={offset}
            className={`${strokeClass} transition-all duration-700`}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-base font-bold ${accentClass}`}
          >
            {progress}%
          </span>
        </div>
      </div>

      <p className="mt-1.5 text-center text-[11px] font-bold text-slate-700">
        {label}
      </p>

      <p className="mt-0.5 text-center text-[10px] font-medium text-slate-400">
        {value}
      </p>
    </div>
  );
}

function AttentionItem({
  icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  href: string;
  tone:
    | 'red'
    | 'amber'
    | 'blue'
    | 'slate';
}) {
  const toneClasses = {
    red: 'bg-red-50 text-red-600',
    amber:
      'bg-amber-50 text-amber-600',
    blue:
      'bg-blue-50 text-blue-600',
    slate:
      'bg-slate-100 text-slate-600',
  };

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-100 hover:bg-blue-50/50"
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-700">
          {label}
        </p>

        <p className="mt-0.5 text-[10px] text-slate-400">
          Perlu perhatian admin
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-slate-900">
          {value}
        </span>

        <ArrowRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
      </div>
    </Link>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
  iconClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-slate-50/40 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40"
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>

      <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-blue-600">
        Buka halaman
        <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}