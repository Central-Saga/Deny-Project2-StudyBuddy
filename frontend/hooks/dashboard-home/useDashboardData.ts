import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  parseUserDto,
  type UserDto,
} from '@/types/api';
import type {
  StudyGroup,
  StudySession,
  StudySessionResponse,
} from '@/components/dashboard-home/types';
import {
  clearAuthStorage,
  getStoredToken,
  isMyGroup,
} from '@/components/dashboard-home/utils';

export function useDashboardData() {
  const router = useRouter();

  const [userData, setUserData] =
    useState<UserDto | null>(null);

  const [groups, setGroups] =
    useState<StudyGroup[]>([]);

  const [sessions, setSessions] =
    useState<StudySession[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  // =======================================================
  // LOAD DASHBOARD DATA
  // =======================================================

  const loadDashboardData =
    useCallback(
      async (
        isRefresh = false
      ) => {
        const token =
          getStoredToken();

        if (!token) {
          clearAuthStorage();

          router.replace(
            '/login'
          );

          return;
        }

        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        try {
          // -----------------------------------------------
          // USER
          // -----------------------------------------------
          let currentUser:
            | UserDto
            | null = null;

          const savedUser =
            localStorage.getItem(
              'user_data'
            );

          if (savedUser) {
            currentUser =
              parseUserDto(
                savedUser
              );

            if (currentUser) {
              setUserData(
                currentUser
              );
            }
          }

          // -----------------------------------------------
          // REQUEST DASHBOARD DATA
          // -----------------------------------------------
          const [
            groupResponse,
            sessionResponse,
          ] = await Promise.all([
            fetch(
              `${API_URL}/groups`,
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
            ),

            fetch(
              `${API_URL}/study-sessions`,
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
            ),
          ]);

          // -----------------------------------------------
          // AUTH EXPIRED
          // -----------------------------------------------
          if (
            groupResponse.status ===
              401 ||
            sessionResponse.status ===
              401
          ) {
            clearAuthStorage();

            router.replace(
              '/login'
            );

            return;
          }

          // -----------------------------------------------
          // GROUP RESPONSE
          // GroupController returns array directly.
          // -----------------------------------------------
          if (
            !groupResponse.ok
          ) {
            throw new Error(
              'Gagal mengambil data grup belajar.'
            );
          }

          const groupPayload =
            await groupResponse.json();

          const groupList:
            StudyGroup[] =
            Array.isArray(
              groupPayload
            )
              ? groupPayload
              : Array.isArray(
                    groupPayload?.data
                  )
                ? groupPayload.data
                : [];

          setGroups(groupList);

          // -----------------------------------------------
          // SESSION RESPONSE
          // StudySessionController:
          // {
          //   message: "...",
          //   data: [...]
          // }
          // -----------------------------------------------
          if (
            !sessionResponse.ok
          ) {
            throw new Error(
              'Gagal mengambil data sesi belajar.'
            );
          }

          const sessionPayload: StudySessionResponse =
            await sessionResponse.json();

          setSessions(
            Array.isArray(
              sessionPayload.data
            )
              ? sessionPayload.data
              : []
          );
        } catch (
          requestError: unknown
        ) {
                    const expectedApiError =
            requestError instanceof Error &&
            (
              requestError.message === 'Gagal mengambil data grup belajar.' ||
              requestError.message === 'Gagal mengambil data sesi belajar.' ||
              requestError.message.includes('Tidak dapat terhubung ke server')
            );
          if (expectedApiError) {
            console.warn(
              'Dashboard API belum tersedia:',
              requestError.message
            );
          } else {
            console.error('Dashboard error:', requestError);
          }

          setError(
            requestError instanceof
              Error
              ? requestError.message
              : 'Terjadi kesalahan saat mengambil data Dashboard.'
          );
        } finally {
          setLoading(false);

          setRefreshing(false);
        }
      },
      [router]
    );

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // =======================================================
  // UPCOMING SESSIONS
  // =======================================================

  const upcomingSessions =
    useMemo(() => {
      const now =
        new Date().getTime();

      return sessions
        .filter((session) => {
          if (
            session.status ===
            'cancelled'
          ) {
            return false;
          }

          if (
            !session.scheduled_at
          ) {
            return false;
          }

          const sessionTime =
            new Date(
              session.scheduled_at
            ).getTime();

          return (
            !Number.isNaN(
              sessionTime
            ) &&
            sessionTime >= now
          );
        })
        .sort((a, b) => {
          const timeA = a
            .scheduled_at
            ? new Date(
                a.scheduled_at
              ).getTime()
            : 0;

          const timeB = b
            .scheduled_at
            ? new Date(
                b.scheduled_at
              ).getTime()
            : 0;

          return timeA - timeB;
        })
        .slice(0, 3);
    }, [sessions]);

  // =======================================================
  // MY GROUPS
  // =======================================================

  const myGroups =
    useMemo(() => {
      if (!userData?.id) {
        return [];
      }

      return groups
        .filter((group) =>
          isMyGroup(
            group,
            userData.id
          )
        )
        .slice(0, 3);
    }, [groups, userData]);

  return {
    userData,
    groups,
    sessions,
    loading,
    refreshing,
    error,
    loadDashboardData,
    upcomingSessions,
    myGroups,
  };
}
