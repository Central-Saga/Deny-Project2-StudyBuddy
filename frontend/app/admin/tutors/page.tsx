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
  BadgeCheck,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Laptop,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  UserRound,
  Users,
  X,
  XCircle,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/v1'
).replace(/\/$/, '');

type VerificationFilter =
  | 'all'
  | 'verified'
  | 'unverified';

type TutorStatusFilter =
  | 'all'
  | 'active'
  | 'inactive';

interface TutorSubject {
  id: number;
  name: string;
  code?: string | null;
  proficiency_level?: string | null;
}

interface TutorListItem {
  id: number;
  user_id: number;
  name: string;
  email: string;
  bio?: string | null;
  hourly_rate: number;
  is_verified: boolean;
  status: string;
  account_status?: string | null;
  rating_avg: number;
  reviews_count: number;
  format_online: boolean;
  format_offline: boolean;
  avatar_url?: string | null;
  university?: string | null;
  major?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  verifier_name?: string | null;
  created_at?: string | null;
  subjects: TutorSubject[];
}

interface TutorAvailability {
  id?: number;
  tutor_profile_id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring?: boolean;
}

interface TutorDetail extends TutorListItem {
  profile?: {
    avatar_url?: string | null;
    phone_number?: string | null;
    university?: string | null;
    major?: string | null;
    github_url?: string | null;
    linkedin_url?: string | null;
  } | null;
  verifier?: {
    id: number;
    name: string;
    email: string;
  } | null;
  availability: TutorAvailability[];
  requests?: {
    pending: number;
    accepted: number;
    completed: number;
    cancelled: number;
  };
  last_active_at?: string | null;
}

function getStoredToken(): string {
  if (typeof window === 'undefined') return '';

  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('meetspace_auth_token') ||
    ''
  );
}

function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('access_token');
  localStorage.removeItem('meetspace_auth_token');
  localStorage.removeItem('user_data');
}

function formatDateTime(
  value?: string | null
): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : '-';
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getDayName(dayOfWeek: number): string {
  const days = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  return days[dayOfWeek] ?? '-';
}

function getProficiencyLabel(
  value?: string | null
): string {
  switch (value) {
    case 'beginner':
      return 'Pemula';
    case 'intermediate':
      return 'Menengah';
    case 'advanced':
      return 'Mahir';
    default:
      return value || 'Mahir';
  }
}

export default function AdminTutorsPage() {
  const router = useRouter();

  const [tutors, setTutors] =
    useState<TutorListItem[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState('');
  const [success, setSuccess] =
    useState('');
  const [searchQuery, setSearchQuery] =
    useState('');
  const [
    verificationFilter,
    setVerificationFilter,
  ] = useState<VerificationFilter>('all');
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<TutorStatusFilter>('all');
  const [
    selectedTutor,
    setSelectedTutor,
  ] = useState<TutorDetail | null>(null);
  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);
  const [
    verifyTarget,
    setVerifyTarget,
  ] = useState<TutorListItem | TutorDetail | null>(
    null
  );
  const [
    verificationLoading,
    setVerificationLoading,
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

  const loadTutors =
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
          `${API_URL}/admin/tutors`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        );

        if (handleUnauthorized(response.status)) {
          return;
        }

        const payload = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              'Gagal mengambil daftar tutor.'
          );
        }

        setTutors(
          Array.isArray(payload?.data)
            ? payload.data
            : []
        );
      } catch (caughtError: unknown) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Terjadi kesalahan saat mengambil daftar tutor.'
        );
      } finally {
        setLoading(false);
      }
    }, [handleUnauthorized, router]);

  useEffect(() => {
    void loadTutors();
  }, [loadTutors]);

  const summary = useMemo(
    () => ({
      total: tutors.length,
      verified: tutors.filter(
        (tutor) => tutor.is_verified
      ).length,
      unverified: tutors.filter(
        (tutor) => !tutor.is_verified
      ).length,
      active: tutors.filter(
        (tutor) => tutor.status === 'active'
      ).length,
    }),
    [tutors]
  );

  const filteredTutors = useMemo(() => {
    const normalized = searchQuery
      .trim()
      .toLowerCase();

    return tutors.filter((tutor) => {
      if (
        verificationFilter === 'verified' &&
        !tutor.is_verified
      ) {
        return false;
      }

      if (
        verificationFilter === 'unverified' &&
        tutor.is_verified
      ) {
        return false;
      }

      if (
        statusFilter !== 'all' &&
        tutor.status !== statusFilter
      ) {
        return false;
      }

      if (!normalized) return true;

      const searchable = [
        tutor.name,
        tutor.email,
        tutor.bio,
        tutor.university,
        tutor.major,
        ...tutor.subjects.map(
          (subject) =>
            `${subject.code || ''} ${subject.name}`
        ),
      ];

      return searchable.some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(normalized)
      );
    });
  }, [
    tutors,
    searchQuery,
    verificationFilter,
    statusFilter,
  ]);

  const openDetail = async (
    tutor: TutorListItem
  ) => {
    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setSelectedTutor({
      ...tutor,
      availability: [],
    });
    setDetailLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/admin/tutors/${tutor.id}`,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );

      if (handleUnauthorized(response.status)) {
        return;
      }

      const payload = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.message ||
            'Gagal mengambil detail tutor.'
        );
      }

      if (payload?.data) {
        setSelectedTutor(payload.data);
      }
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal mengambil detail tutor.'
      );
      setSelectedTutor(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const updateVerification = async () => {
    if (!verifyTarget) return;

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    const newValue = !verifyTarget.is_verified;

    setVerificationLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/admin/tutors/${verifyTarget.id}/verification`,
        {
          method: 'PATCH',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            is_verified: newValue,
          }),
        }
      );

      if (handleUnauthorized(response.status)) {
        return;
      }

      const payload = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        const firstError = payload?.errors
          ? Object.values(payload.errors).flat()[0]
          : null;

        throw new Error(
          String(
            firstError ||
              payload?.message ||
              'Gagal memperbarui verifikasi tutor.'
          )
        );
      }

      setSuccess(
        payload?.message ||
          (newValue
            ? 'Tutor berhasil diverifikasi.'
            : 'Verifikasi tutor berhasil dibatalkan.')
      );

      setVerifyTarget(null);

      if (
        selectedTutor?.id === verifyTarget.id
      ) {
        setSelectedTutor(null);
      }

      await loadTutors();
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal memperbarui verifikasi tutor.'
      );
    } finally {
      setVerificationLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/60 to-indigo-50 p-6 shadow-sm lg:p-7">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-indigo-200/20 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Tutor Verification
            </div>

            <h1 className="!text-slate-950 text-2xl font-bold tracking-tight sm:text-3xl">
              Tutor Management
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Tinjau profil peer tutor, lihat mata kuliah dan jadwal yang tersedia,
              lalu verifikasi tutor yang telah diperiksa oleh administrator.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadTutors()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{error}</div>
          <button
            type="button"
            onClick={() => setError('')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">{success}</div>
          <button
            type="button"
            onClick={() => setSuccess('')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Tutor"
          value={summary.total}
          icon={<Users className="h-5 w-5" />}
          iconClass="bg-blue-50 text-blue-600"
          valueClass="!text-slate-950"
        />
        <SummaryCard
          label="Verified"
          value={summary.verified}
          icon={<BadgeCheck className="h-5 w-5" />}
          iconClass="bg-emerald-50 text-emerald-600"
          valueClass="text-emerald-600"
        />
        <SummaryCard
          label="Belum Verified"
          value={summary.unverified}
          icon={<Clock3 className="h-5 w-5" />}
          iconClass="bg-amber-50 text-amber-600"
          valueClass="text-amber-600"
        />
        <SummaryCard
          label="Tutor Aktif"
          value={summary.active}
          icon={<UserRound className="h-5 w-5" />}
          iconClass="bg-indigo-50 text-indigo-600"
          valueClass="text-indigo-600"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_200px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Cari nama, email, universitas, jurusan, atau mata kuliah..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={verificationFilter}
            onChange={(event) =>
              setVerificationFilter(
                event.target
                  .value as VerificationFilter
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              Semua Verifikasi
            </option>
            <option value="verified">
              Verified
            </option>
            <option value="unverified">
              Belum Verified
            </option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as TutorStatusFilter
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">
              Semua Status
            </option>
            <option value="active">
              Active
            </option>
            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="!text-slate-950 text-sm font-bold">
            Daftar Peer Tutor
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Menampilkan {filteredTutors.length} dari {tutors.length} tutor.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-28 animate-pulse rounded-2xl bg-slate-100"
                />
              )
            )}
          </div>
        ) : filteredTutors.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UserRound className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-sm font-bold text-slate-800">
              Tutor tidak ditemukan
            </h3>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Coba ubah kata pencarian atau filter yang sedang digunakan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredTutors.map((tutor) => (
              <article
                key={tutor.id}
                className="p-5 transition hover:bg-slate-50/70"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-md shadow-blue-100">
                      {getInitials(tutor.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-slate-900">
                          {tutor.name}
                        </h3>

                        {tutor.is_verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                            <BadgeCheck className="h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                            <Clock3 className="h-3 w-3" />
                            Belum Verified
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            tutor.status === 'active'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tutor.status === 'active'
                            ? 'Active'
                            : 'Inactive'}
                        </span>

                        {tutor.account_status ===
                          'suspended' && (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-700">
                            Account Suspended
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {tutor.email}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {tutor.subjects
                          .slice(0, 4)
                          .map((subject) => (
                            <span
                              key={subject.id}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
                            >
                              {subject.code
                                ? `${subject.code} · `
                                : ''}
                              {subject.name}
                            </span>
                          ))}

                        {tutor.subjects.length > 4 && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                            +{tutor.subjects.length - 4}{' '}
                            lainnya
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[420px]">
                    <MiniMetric
                      label="Rating"
                      value={Number(
                        tutor.rating_avg || 0
                      ).toFixed(1)}
                      icon={
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      }
                    />
                    <MiniMetric
                      label="Reviews"
                      value={String(
                        tutor.reviews_count
                      )}
                    />
                    <MiniMetric
                      label="Format"
                      value={
                        tutor.format_online &&
                        tutor.format_offline
                          ? 'Hybrid'
                          : tutor.format_online
                            ? 'Online'
                            : tutor.format_offline
                              ? 'Offline'
                              : '-'
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void openDetail(tutor)
                      }
                      className="flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                    >
                      Detail
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedTutor && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !detailLoading &&
              !verificationLoading
            ) {
              setSelectedTutor(null);
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                  Tutor Detail
                </p>
                <h2 className="mt-1 !text-slate-950 text-xl font-bold">
                  {selectedTutor.name}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {selectedTutor.email}
                </p>
              </div>

              <button
                type="button"
                disabled={
                  detailLoading ||
                  verificationLoading
                }
                onClick={() =>
                  setSelectedTutor(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex min-h-[380px] items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
                  <p className="mt-3 text-xs font-medium text-slate-500">
                    Memuat detail tutor...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 p-6">
                <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-base font-bold text-white">
                        {getInitials(
                          selectedTutor.name
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="!text-slate-950 text-base font-bold">
                            {selectedTutor.name}
                          </h3>

                          {selectedTutor.is_verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                              <BadgeCheck className="h-3 w-3" />
                              Verified
                            </span>
                          ) : (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                              Belum Verified
                            </span>
                          )}
                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {selectedTutor.bio ||
                            'Tutor belum menambahkan bio.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <InfoCard
                        label="Universitas"
                        value={
                          selectedTutor.profile
                            ?.university ||
                          selectedTutor.university ||
                          '-'
                        }
                      />
                      <InfoCard
                        label="Jurusan"
                        value={
                          selectedTutor.profile?.major ||
                          selectedTutor.major ||
                          '-'
                        }
                      />
                      <InfoCard
                        label="Email"
                        value={selectedTutor.email}
                      />
                      <InfoCard
                        label="Telepon"
                        value={
                          selectedTutor.profile
                            ?.phone_number || '-'
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Tutor Performance
                      </p>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <InfoMetric
                          icon={
                            <Star className="h-4 w-4" />
                          }
                          label="Rating"
                          value={Number(
                            selectedTutor.rating_avg ||
                              0
                          ).toFixed(1)}
                        />
                        <InfoMetric
                          icon={
                            <Users className="h-4 w-4" />
                          }
                          label="Reviews"
                          value={String(
                            selectedTutor.reviews_count
                          )}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Format Tutoring
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedTutor.format_online && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                            <Laptop className="h-3.5 w-3.5" />
                            Online
                          </span>
                        )}
                        {selectedTutor.format_offline && (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                            <MapPin className="h-3.5 w-3.5" />
                            Offline
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Mata Kuliah
                      </h3>
                    </div>

                    <div className="mt-4 space-y-2">
                      {selectedTutor.subjects.length ===
                      0 ? (
                        <p className="text-xs text-slate-400">
                          Belum ada mata kuliah.
                        </p>
                      ) : (
                        selectedTutor.subjects.map(
                          (subject) => (
                            <div
                              key={subject.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-700">
                                  {subject.name}
                                </p>
                                <p className="mt-0.5 text-[10px] text-slate-400">
                                  {subject.code ||
                                    'Tanpa kode'}
                                </p>
                              </div>
                              <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm">
                                {getProficiencyLabel(
                                  subject.proficiency_level
                                )}
                              </span>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Availability
                      </h3>
                    </div>

                    <div className="mt-4 space-y-2">
                      {selectedTutor.availability?.length ===
                      0 ? (
                        <p className="text-xs text-slate-400">
                          Belum ada jadwal availability.
                        </p>
                      ) : (
                        selectedTutor.availability?.map(
                          (slot, index) => (
                            <div
                              key={
                                slot.id ??
                                `${slot.day_of_week}-${index}`
                              }
                              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"
                            >
                              <p className="text-xs font-bold text-slate-700">
                                {getDayName(
                                  Number(
                                    slot.day_of_week
                                  )
                                )}
                              </p>
                              <span className="text-xs font-semibold text-slate-500">
                                {formatTime(
                                  slot.start_time
                                )}{' '}
                                –{' '}
                                {formatTime(
                                  slot.end_time
                                )}
                              </span>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <RequestMetric
                    label="Pending"
                    value={
                      selectedTutor.requests?.pending ??
                      0
                    }
                  />
                  <RequestMetric
                    label="Accepted"
                    value={
                      selectedTutor.requests?.accepted ??
                      0
                    }
                  />
                  <RequestMetric
                    label="Completed"
                    value={
                      selectedTutor.requests?.completed ??
                      0
                    }
                  />
                  <RequestMetric
                    label="Cancelled"
                    value={
                      selectedTutor.requests
                        ?.cancelled ?? 0
                    }
                  />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Verification Record
                      </p>

                      {selectedTutor.is_verified ? (
                        <div className="mt-2">
                          <p className="text-sm font-semibold text-emerald-700">
                            Tutor sudah diverifikasi.
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {selectedTutor.verifier
                              ?.name ||
                              selectedTutor.verifier_name ||
                              'Administrator'}{' '}
                            ·{' '}
                            {formatDateTime(
                              selectedTutor.verified_at
                            )}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          Tutor belum diverifikasi oleh administrator.
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setVerifyTarget(
                          selectedTutor
                        )
                      }
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                        selectedTutor.is_verified
                          ? 'border border-red-200 bg-white text-red-600 hover:bg-red-50'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {selectedTutor.is_verified ? (
                        <>
                          <XCircle className="h-4 w-4" />
                          Batalkan Verifikasi
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="h-4 w-4" />
                          Verify Tutor
                        </>
                      )}
                    </button>
                  </div>

                  {selectedTutor.account_status ===
                    'suspended' && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                      Akun pengguna sedang suspended. Verifikasi tutor tidak otomatis mengaktifkan kembali akun pengguna.
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      )}

      {verifyTarget && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !verificationLoading
            ) {
              setVerifyTarget(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                verifyTarget.is_verified
                  ? 'bg-red-50 text-red-600'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              {verifyTarget.is_verified ? (
                <XCircle className="h-6 w-6" />
              ) : (
                <BadgeCheck className="h-6 w-6" />
              )}
            </div>

            <h2 className="mt-4 !text-slate-950 text-lg font-bold">
              {verifyTarget.is_verified
                ? 'Batalkan Verifikasi Tutor?'
                : 'Verifikasi Tutor?'}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {verifyTarget.is_verified
                ? `Status verified ${verifyTarget.name} akan dihapus. Profil tutor tetap tersedia selama status tutor masih aktif.`
                : `Pastikan profil, mata kuliah, dan informasi tutor ${verifyTarget.name} sudah ditinjau sebelum memberikan status verified.`}
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={verificationLoading}
                onClick={() =>
                  setVerifyTarget(null)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={verificationLoading}
                onClick={() =>
                  void updateVerification()
                }
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-60 ${
                  verifyTarget.is_verified
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {verificationLoading && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {verificationLoading
                  ? 'Menyimpan...'
                  : verifyTarget.is_verified
                    ? 'Batalkan Verifikasi'
                    : 'Verify Tutor'}
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
  valueClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
  valueClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>
          <p
            className={`mt-1 text-2xl font-bold ${valueClass}`}
          >
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

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs font-bold text-slate-700">
        {icon}
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3.5 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-xs font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function InfoMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-amber-500">
        {icon}
      </div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function RequestMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-slate-400">
        tutoring request
      </p>
    </div>
  );
}