import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type { UserDto } from '@/types/api';
import type {
  StatusFilter,
  StatusTarget,
} from '@/components/admin-users/types';
import {
  clearAuthStorage,
  getStoredToken,
} from '@/components/admin-users/utils';

export function useAdminUsers() {
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

  const [usersLoadError, setUsersLoadError] =
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
      setUsersLoadError('');

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

        if (!Array.isArray(payload?.data)) {
          throw new Error(
            'Respons daftar pengguna dari server tidak valid.'
          );
        }

        setUsers(payload.data);
      } catch (
        error: unknown
      ) {
        setUsersLoadError(
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

  return {
    users,
    loading,
    statusLoading,
    error,
    setError,
    usersLoadError,
    success,
    setSuccess,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    statusTarget,
    setStatusTarget,
    loadUsers,
    summary,
    handleSearch,
    clearSearch,
    changeStatus,
  };
}
