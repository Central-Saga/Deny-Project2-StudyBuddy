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
  CalendarDays,
  Eye,
  Globe2,
  Lock,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/v1'
).replace(/\/$/, '');

type PrivacyFilter =
  | 'all'
  | 'public'
  | 'private';

interface GroupCreator {
  id: number;
  name: string;
  email: string;
}

interface GroupSubject {
  id: number;
  code?: string | null;
  name: string;
}

interface GroupMemberStats {
  accepted: number;
  pending: number;
  rejected: number;
  group_admins: number;
}

interface AdminGroup {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  max_members: number;
  is_private: boolean;
  privacy: 'public' | 'private';
  creator?: GroupCreator | null;
  subject?: GroupSubject | null;
  member_stats: GroupMemberStats;
  sessions_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

interface AdminGroupMember {
  id: number;

  user?: {
    id: number;
    name: string;
    email: string;
  } | null;

  role: string;
  status: string;
  joined_at?: string | null;
}

interface AdminGroupSession {
  id: number;
  host_id: number;
  title: string;
  scheduled_at?: string | null;
  created_at?: string | null;
}

interface AdminGroupDetail
  extends Omit<
    AdminGroup,
    'sessions_count'
  > {
  members: AdminGroupMember[];
  sessions: AdminGroupSession[];
}

function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem(
      'access_token'
    ) ||
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

  localStorage.removeItem(
    'access_token'
  );

  localStorage.removeItem(
    'meetspace_auth_token'
  );

  localStorage.removeItem(
    'user_data'
  );
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  ).format(date);
}

function formatDateTime(
  value?: string | null
): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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

export default function AdminGroupsPage() {
  const router = useRouter();

  const [groups, setGroups] =
    useState<AdminGroup[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState('');

  const [
    privacyFilter,
    setPrivacyFilter,
  ] =
    useState<PrivacyFilter>('all');

  const [
    selectedGroup,
    setSelectedGroup,
  ] =
    useState<AdminGroupDetail | null>(
      null
    );

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(false);

  const [
    detailError,
    setDetailError,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Load Groups
  |--------------------------------------------------------------------------
  */

  const loadGroups =
    useCallback(async () => {
      const token =
        getStoredToken();

      if (!token) {
        clearAuthStorage();
        router.replace('/login');

        return;
      }

      setLoading(true);
      setError('');

      try {
        const params =
          new URLSearchParams();

        if (
          appliedSearch.trim()
        ) {
          params.set(
            'search',
            appliedSearch.trim()
          );
        }

        if (
          privacyFilter !== 'all'
        ) {
          params.set(
            'privacy',
            privacyFilter
          );
        }

        const query =
          params.toString();

        const response =
          await fetch(
            `${API_URL}/admin/groups${
              query
                ? `?${query}`
                : ''
            }`,
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

        const payload =
          await response
            .json()
            .catch(() => ({}));

        if (
          response.status === 401
        ) {
          clearAuthStorage();

          router.replace('/login');

          return;
        }

        if (
          response.status === 403
        ) {
          router.replace(
            '/dashboard'
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              'Gagal mengambil data study group.'
          );
        }

        setGroups(
          Array.isArray(
            payload?.data
          )
            ? payload.data
            : []
        );
      } catch (
        error: unknown
      ) {
        setError(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat mengambil study group.'
        );
      } finally {
        setLoading(false);
      }
    }, [
      appliedSearch,
      privacyFilter,
      router,
    ]);

  useEffect(() => {
    void loadGroups();
  }, [loadGroups]);

  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(
    () => {
      const publicGroups =
        groups.filter(
          (group) =>
            !group.is_private
        ).length;

      const privateGroups =
        groups.filter(
          (group) =>
            group.is_private
        ).length;

      const pendingMembers =
        groups.reduce(
          (
            total,
            group
          ) =>
            total +
            Number(
              group.member_stats
                ?.pending || 0
            ),
          0
        );

      return {
        total: groups.length,
        public: publicGroups,
        private: privateGroups,
        pending: pendingMembers,
      };
    },
    [groups]
  );

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  const handleSearch = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setAppliedSearch(
      search.trim()
    );
  };

  const clearSearch = () => {
    setSearch('');
    setAppliedSearch('');
  };

  /*
  |--------------------------------------------------------------------------
  | Detail Group
  |--------------------------------------------------------------------------
  */

  const loadGroupDetail =
    async (
      groupId: number
    ) => {
      const token =
        getStoredToken();

      if (!token) {
        clearAuthStorage();
        router.replace('/login');

        return;
      }

      setSelectedGroup(null);
      setDetailError('');
      setDetailLoading(true);

      try {
        const response =
          await fetch(
            `${API_URL}/admin/groups/${groupId}`,
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

        const payload =
          await response
            .json()
            .catch(() => ({}));

        if (
          response.status === 401
        ) {
          clearAuthStorage();
          router.replace('/login');

          return;
        }

        if (
          response.status === 403
        ) {
          router.replace(
            '/dashboard'
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              'Gagal mengambil detail group.'
          );
        }

        setSelectedGroup(
          payload?.data || null
        );
      } catch (
        error: unknown
      ) {
        setDetailError(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat mengambil detail group.'
        );
      } finally {
        setDetailLoading(false);
      }
    };

  const closeDetail = () => {
    if (detailLoading) {
      return;
    }

    setSelectedGroup(null);
    setDetailError('');
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
            Administrasi
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Study Groups
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitoring grup belajar,
            anggota, dan sesi Study Buddy.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadGroups()
          }
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              loading
                ? 'animate-spin'
                : ''
            }`}
          />

          Refresh
        </button>
      </div>

      {/* ERROR */}
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
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Group Ditampilkan
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UsersRound className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Public
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {summary.public}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Globe2 className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Private
              </p>

              <p className="mt-1 text-2xl font-bold text-violet-600">
                {summary.private}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Lock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Pending Member
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-600">
                {summary.pending}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <UserRound className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <form
            onSubmit={handleSearch}
            className="flex flex-1 gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Cari nama atau deskripsi group..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />

              {search && (
                <button
                  type="button"
                  onClick={
                    clearSearch
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Cari
            </button>
          </form>

          <select
            value={privacyFilter}
            onChange={(event) =>
              setPrivacyFilter(
                event.target
                  .value as PrivacyFilter
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 lg:w-48"
          >
            <option value="all">
              Semua Privacy
            </option>

            <option value="public">
              Public
            </option>

            <option value="private">
              Private
            </option>
          </select>
        </div>
      </div>

      {/* GROUP LIST */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            Daftar Study Group
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Monitoring informasi dan
            aktivitas group pengguna.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UsersRound className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-800">
              Group tidak ditemukan
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Belum ada group yang sesuai
              dengan filter atau pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Group
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Creator
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Members
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Sessions
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Privacy
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Dibuat
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {groups.map(
                  (group) => (
                    <tr
                      key={group.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-[250px]">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {
                              group.name
                            }
                          </p>

                          <p className="mt-1 truncate text-[11px] text-slate-400">
                            {group.subject
                              ?.name ||
                              'Tanpa subject'}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-slate-700">
                          {group.creator
                            ?.name ||
                            '-'}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {group.creator
                            ?.email ||
                            '-'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-xs font-semibold text-slate-700">
                          {
                            group
                              .member_stats
                              .accepted
                          }
                          {' / '}
                          {
                            group.max_members
                          }
                        </div>

                        {group
                          .member_stats
                          .pending >
                          0 && (
                          <p className="mt-1 text-[10px] font-medium text-amber-600">
                            {
                              group
                                .member_stats
                                .pending
                            }{' '}
                            pending
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />

                          {
                            group.sessions_count
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {group.is_private ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                            <Lock className="h-3 w-3" />

                            Private
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <Globe2 className="h-3 w-3" />

                            Public
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(
                          group.created_at
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            void loadGroupDetail(
                              group.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-[11px] font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <Eye className="h-3.5 w-3.5" />

                          Detail
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {(detailLoading ||
        selectedGroup ||
        detailError) && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
                event.currentTarget &&
              !detailLoading
            ) {
              closeDetail();
            }
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="font-bold text-slate-900">
                  Detail Study Group
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Informasi group, member,
                  dan sesi belajar.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  detailLoading
                }
                onClick={
                  closeDetail
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {detailLoading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="h-7 w-7 animate-spin text-blue-600" />

                    <p className="text-xs font-medium text-slate-500">
                      Memuat detail
                      group...
                    </p>
                  </div>
                </div>
              ) : detailError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {detailError}
                </div>
              ) : selectedGroup ? (
                <div className="space-y-6">
                  {/* INFO */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {
                            selectedGroup.name
                          }
                        </h3>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                          {selectedGroup.description ||
                            'Tidak ada deskripsi.'}
                        </p>
                      </div>

                      {selectedGroup.is_private ? (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700">
                          <Lock className="h-3.5 w-3.5" />
                          Private
                        </span>
                      ) : (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          <Globe2 className="h-3.5 w-3.5" />
                          Public
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Subject
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {selectedGroup
                            .subject
                            ?.name ||
                            '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Creator
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {selectedGroup
                            .creator
                            ?.name ||
                            '-'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Kapasitas
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {
                            selectedGroup
                              .member_stats
                              .accepted
                          }
                          {' / '}
                          {
                            selectedGroup.max_members
                          }{' '}
                          member
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Dibuat
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-700">
                          {formatDate(
                            selectedGroup.created_at
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* MEMBER STATS */}
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl bg-emerald-50 p-4">
                      <p className="text-[11px] font-semibold text-emerald-700">
                        Accepted
                      </p>

                      <p className="mt-1 text-xl font-bold text-emerald-700">
                        {
                          selectedGroup
                            .member_stats
                            .accepted
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-amber-50 p-4">
                      <p className="text-[11px] font-semibold text-amber-700">
                        Pending
                      </p>

                      <p className="mt-1 text-xl font-bold text-amber-700">
                        {
                          selectedGroup
                            .member_stats
                            .pending
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-red-50 p-4">
                      <p className="text-[11px] font-semibold text-red-600">
                        Rejected
                      </p>

                      <p className="mt-1 text-xl font-bold text-red-600">
                        {
                          selectedGroup
                            .member_stats
                            .rejected
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-blue-50 p-4">
                      <p className="text-[11px] font-semibold text-blue-700">
                        Group Admin
                      </p>

                      <p className="mt-1 text-xl font-bold text-blue-700">
                        {
                          selectedGroup
                            .member_stats
                            .group_admins
                        }
                      </p>
                    </div>
                  </div>

                  {/* MEMBERS */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Members
                      </h3>
                    </div>

                    {selectedGroup
                      .members
                      .length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">
                        Belum ada member.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {selectedGroup.members.map(
                          (member) => (
                            <div
                              key={
                                member.id
                              }
                              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                                  {member.role ===
                                  'admin' ? (
                                    <ShieldCheck className="h-4 w-4" />
                                  ) : (
                                    <UserRound className="h-4 w-4" />
                                  )}
                                </div>

                                <div>
                                  <p className="text-xs font-bold text-slate-800">
                                    {member.user
                                      ?.name ||
                                      'User'}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    {member.user
                                      ?.email ||
                                      '-'}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-blue-700">
                                  {
                                    member.role
                                  }
                                </span>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${
                                    member.status ===
                                    'accepted'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : member.status ===
                                          'pending'
                                        ? 'bg-amber-50 text-amber-700'
                                        : 'bg-red-50 text-red-600'
                                  }`}
                                >
                                  {
                                    member.status
                                  }
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* SESSIONS */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Study Sessions
                      </h3>
                    </div>

                    {selectedGroup
                      .sessions
                      .length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400">
                        Belum ada sesi belajar.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {selectedGroup.sessions.map(
                          (
                            session
                          ) => (
                            <div
                              key={
                                session.id
                              }
                              className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-800">
                                  {
                                    session.title
                                  }
                                </p>

                                <p className="mt-1 text-[10px] text-slate-400">
                                  Host ID:{' '}
                                  {
                                    session.host_id
                                  }
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                <CalendarDays className="h-3.5 w-3.5" />

                                {formatDateTime(
                                  session.scheduled_at
                                )}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}