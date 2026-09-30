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
  CheckCircle2,
  Mail,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react';

import type {
  UserDto,
} from '@/types/api';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  '/api/v1'
).replace(/\/$/, '');

type StatusFilter =
  | 'all'
  | 'active'
  | 'suspended';

interface StatusTarget {
  user: UserDto;
  nextStatus:
    | 'active'
    | 'suspended';
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

function getInitials(
  name: string
): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'U';
  }

  if (words.length === 1) {
    return words[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[1].charAt(0)
  ).toUpperCase();
}

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] =
    useState<UserDto[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [
    statusLoading,
    setStatusLoading,
  ] = useState(false);

  const [error, setError] =
    useState('');

  const [success, setSuccess] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [
    appliedSearch,
    setAppliedSearch,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>('all');

  const [
    statusTarget,
    setStatusTarget,
  ] =
    useState<StatusTarget | null>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | Load Users
  |--------------------------------------------------------------------------
  */

  const loadUsers =
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
          statusFilter !== 'all'
        ) {
          params.set(
            'status',
            statusFilter
          );
        }

        const query =
          params.toString();

        const response =
          await fetch(
            `${API_URL}/admin/users${
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

          router.replace(
            '/login'
          );

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
              'Gagal mengambil data user.'
          );
        }

        setUsers(
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
            : 'Terjadi kesalahan saat mengambil user.'
        );
      } finally {
        setLoading(false);
      }
    }, [
      appliedSearch,
      router,
      statusFilter,
    ]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(
    () => {
      const active =
        users.filter(
          (user) =>
            user.account_status ===
            'active'
        ).length;

      const suspended =
        users.filter(
          (user) =>
            user.account_status ===
            'suspended'
        ).length;

      return {
        total: users.length,
        active,
        suspended,
      };
    },
    [users]
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
  | Change Account Status
  |--------------------------------------------------------------------------
  */

  const changeStatus =
    async () => {
      if (!statusTarget) {
        return;
      }

      const token =
        getStoredToken();

      if (!token) {
        clearAuthStorage();

        router.replace('/login');

        return;
      }

      setStatusLoading(true);
      setError('');
      setSuccess('');

      try {
        const response =
          await fetch(
            `${API_URL}/admin/users/${statusTarget.user.id}/status`,
            {
              method: 'PATCH',

              headers: {
                Accept:
                  'application/json',

                'Content-Type':
                  'application/json',

                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                account_status:
                  statusTarget.nextStatus,
              }),
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

          router.replace(
            '/login'
          );

          return;
        }

        if (
          response.status === 403
        ) {
          throw new Error(
            payload?.message ||
              'Akses ditolak.'
          );
        }

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              'Gagal mengubah status user.'
          );
        }

        setSuccess(
          payload?.message ||
            'Status akun berhasil diperbarui.'
        );

        setStatusTarget(null);

        await loadUsers();
      } catch (
        error: unknown
      ) {
        setError(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat mengubah status.'
        );
      } finally {
        setStatusLoading(false);
      }
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
            Manage Users
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Lihat dan kelola status akun
            pengguna Study Buddy.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadUsers()
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

      {/* ALERT */}
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
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                User Ditampilkan
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {summary.total}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Aktif
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {summary.active}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Suspended
              </p>

              <p className="mt-1 text-2xl font-bold text-red-600">
                {summary.suspended}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <UserX className="h-5 w-5" />
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
                placeholder="Cari nama atau email..."
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
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as StatusFilter
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100 lg:w-48"
          >
            <option value="all">
              Semua Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="suspended">
              Suspended
            </option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">
            Daftar User
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Administrator tidak ditampilkan
            pada daftar user biasa.
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Users className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-800">
              User tidak ditemukan
            </h3>

            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Belum ada user yang sesuai
              dengan filter atau kata
              pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    User
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Detail
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Bergabung
                  </th>

                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {users.map(
                  (user) => (
                    <tr
                      key={user.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-bold text-white">
                            {getInitials(
                              user.name
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="max-w-[220px] truncate text-sm font-bold text-slate-800">
                              {
                                user.name
                              }
                            </p>

                            <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                              <Mail className="h-3 w-3" />

                              <span className="max-w-[220px] truncate">
                                {
                                  user.email
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-slate-700">
                          {user.profile
                            ?.university ||
                            '-'}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {user.profile
                            ?.major ||
                            user.course ||
                            'Belum ada jurusan'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {formatDate(
                          user.created_at
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {user.account_status ===
                        'active' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

                            Suspended
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {user.account_status ===
                        'active' ? (
                          <button
                            type="button"
                            onClick={() =>
                              setStatusTarget(
                                {
                                  user,
                                  nextStatus:
                                    'suspended',
                                }
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            <UserX className="h-3.5 w-3.5" />

                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setStatusTarget(
                                {
                                  user,
                                  nextStatus:
                                    'active',
                                }
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          >
                            <UserCheck className="h-3.5 w-3.5" />

                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONFIRM STATUS */}
      {statusTarget && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget &&
              !statusLoading
            ) {
              setStatusTarget(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  statusTarget
                    .nextStatus ===
                  'suspended'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {statusTarget
                  .nextStatus ===
                'suspended' ? (
                  <UserX className="h-5 w-5" />
                ) : (
                  <UserCheck className="h-5 w-5" />
                )}
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  {statusTarget
                    .nextStatus ===
                  'suspended'
                    ? 'Suspend akun user?'
                    : 'Aktifkan akun user?'}
                </h2>

                <p className="mt-1.5 text-sm leading-6 text-slate-500">
                  {statusTarget
                    .nextStatus ===
                  'suspended' ? (
                    <>
                      Akun{' '}
                      <span className="font-semibold text-slate-700">
                        {
                          statusTarget
                            .user
                            .name
                        }
                      </span>{' '}
                      akan ditangguhkan dan
                      tidak dapat mengakses
                      fitur Study Buddy
                      sampai diaktifkan
                      kembali.
                    </>
                  ) : (
                    <>
                      Akun{' '}
                      <span className="font-semibold text-slate-700">
                        {
                          statusTarget
                            .user
                            .name
                        }
                      </span>{' '}
                      akan diaktifkan kembali.
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={
                  statusLoading
                }
                onClick={() =>
                  setStatusTarget(null)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={
                  statusLoading
                }
                onClick={() =>
                  void changeStatus()
                }
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold text-white transition disabled:opacity-60 ${
                  statusTarget
                    .nextStatus ===
                  'suspended'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusLoading && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                {statusLoading
                  ? 'Memproses...'
                  : statusTarget
                        .nextStatus ===
                      'suspended'
                    ? 'Ya, Suspend'
                    : 'Ya, Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}