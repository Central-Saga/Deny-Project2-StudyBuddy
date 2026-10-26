'use client';

import { apiFetch as fetch } from '@/lib/api-fetch';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/auth';
import type { PrivacyFilter, AdminGroup, AdminGroupDetail } from '@/components/admin-groups/types';
import { clearAuthStorage, getStoredToken } from '@/components/admin-groups/utils';

export function useAdminGroups() {
  const router = useRouter();

  const [groups, setGroups] =
    useState<AdminGroup[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [groupsLoadError, setGroupsLoadError] =
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
      setGroupsLoadError('');

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

        if (!Array.isArray(payload?.data)) {
          throw new Error(
            'Respons daftar grup dari server tidak valid.'
          );
        }

        setGroups(payload.data);
      } catch (
        error: unknown
      ) {
        setGroupsLoadError(
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

  return {
    groups,
    loading,
    error,
    setError,
    groupsLoadError,
    search,
    setSearch,
    privacyFilter,
    setPrivacyFilter,
    selectedGroup,
    detailLoading,
    detailError,
    summary,
    handleSearch,
    clearSearch,
    loadGroups,
    loadGroupDetail,
    closeDetail,
  };
}
