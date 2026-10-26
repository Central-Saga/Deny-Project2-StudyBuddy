import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL, clearAuthSession } from '@/lib/auth';
import type { ApiMessage, Group, Subject } from '@/components/groups/types';
import { getStoredToken } from '@/components/groups/utils';

export function useGroupsData() {
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
  const [hasLoadedGroups, setHasLoadedGroups] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMsg(message);

    window.setTimeout(() => {
      setSuccessMsg(null);
    }, 3500);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearAuthSession();
    router.replace('/login');
  }, [router]);

  const fetchGroups = useCallback(
    async (silent = false) => {
      const token = getStoredToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMsg(null);

      try {
        const [groupsResponse, subjectsResponse, meResponse] =
          await Promise.all([
            fetch(`${API_URL}/groups`, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              cache: 'no-store',
            }),
            fetch(`${API_URL}/subjects`, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              cache: 'no-store',
            }),
            fetch(`${API_URL}/me`, {
              method: 'GET',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
              cache: 'no-store',
            }),
          ]);

        if (
          groupsResponse.status === 401 ||
          subjectsResponse.status === 401 ||
          meResponse.status === 401
        ) {
          handleUnauthorized();
          return;
        }

        if (!groupsResponse.ok) {
          throw new Error('Gagal mengambil data grup.');
        }

        if (!subjectsResponse.ok) {
          throw new Error('Gagal mengambil data mata kuliah.');
        }

        if (!meResponse.ok) {
          throw new Error('Gagal mengambil data pengguna.');
        }

        const groupsPayload = await groupsResponse.json();
        const subjectsPayload = await subjectsResponse.json();
        const mePayload: ApiMessage = await meResponse.json();

        const nextGroups = Array.isArray(groupsPayload)
          ? groupsPayload
          : Array.isArray(groupsPayload?.data)
            ? groupsPayload.data
            : [];

        const nextSubjects = Array.isArray(subjectsPayload)
          ? subjectsPayload
          : Array.isArray(subjectsPayload?.data)
            ? subjectsPayload.data
            : [];

        setGroups(nextGroups);
        setSubjects(nextSubjects);
        setCurrentUserId(mePayload.user?.id ?? null);
        setHasLoadedGroups(true);
      } catch (error) {
        const expectedApiError =
          error instanceof Error &&
          (
            error.message === 'Gagal mengambil data grup.' ||
            error.message === 'Gagal mengambil data mata kuliah.' ||
            error.message === 'Gagal mengambil data pengguna.' ||
            error.message.includes('Tidak dapat terhubung ke server')
          );

        if (expectedApiError) {
          console.warn(
            'Groups API belum tersedia:',
            error.message
          );
        } else {
          console.error('Gagal memuat grup:', error);
        }

        setErrorMsg(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan saat mengambil data grup.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const fetchGroupDetail = useCallback(
    async (groupId: number) => {
      const token = getStoredToken();

      if (!token) {
        handleUnauthorized();
        return null;
      }

      setLoadingDetail(true);
      setErrorMsg(null);

      try {
        const response = await fetch(
          `${API_URL}/groups/${groupId}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          }
        );

        if (response.status === 401) {
          handleUnauthorized();
          return null;
        }

        const payload: ApiMessage & { data?: Group } =
          await response.json();

        if (!response.ok) {
          throw new Error(
            payload.message || 'Gagal mengambil detail grup.'
          );
        }

        const group = payload.data;

        if (!group) {
          throw new Error('Data detail grup tidak ditemukan.');
        }

        setSelectedGroup(group);
        return group;
      } catch (error) {
        console.error('Gagal mengambil detail grup:', error);

        setErrorMsg(
          error instanceof Error
            ? error.message
            : 'Gagal mengambil detail grup.'
        );

        return null;
      } finally {
        setLoadingDetail(false);
      }
    },
    [handleUnauthorized]
  );

  return {
    groups,
    hasLoadedGroups,
    subjects,
    currentUserId,
    loading,
    refreshing,
    loadingDetail,
    errorMsg,
    setErrorMsg,
    successMsg,
    selectedGroup,
    setSelectedGroup,
    showSuccess,
    handleUnauthorized,
    fetchGroups,
    fetchGroupDetail,
  };
}
