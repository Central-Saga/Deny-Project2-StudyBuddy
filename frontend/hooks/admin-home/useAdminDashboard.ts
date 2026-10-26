'use client';

import { apiFetch as fetch } from '@/lib/api-fetch';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/auth';
import { BookOpen, CalendarDays, FileQuestion, GraduationCap, Users, UsersRound } from 'lucide-react';
import type { DashboardStats } from '@/components/admin-home/types';
import { EMPTY_STATS } from '@/components/admin-home/types';
import { clearAuthStorage, getStoredToken, normalizeStats, percentage } from '@/components/admin-home/utils';

export function useAdminDashboard() {
  const router = useRouter();

  const [stats, setStats] =
    useState<DashboardStats>(
      EMPTY_STATS
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [hasLoadedStats, setHasLoadedStats] =
    useState(false);

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
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            payload?.message ||
              'Gagal mengambil statistik dashboard.'
          );
        }

        if (
          !payload ||
          typeof payload !== 'object' ||
          Array.isArray(payload)
        ) {
          throw new Error('Respons statistik Admin tidak valid.');
        }

        setStats(normalizeStats(payload));
        setHasLoadedStats(true);
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

  return {
    stats,
    loading,
    error,
    hasLoadedStats,
    loadDashboard,
    activeUserRate,
    verifiedTutorRate,
    publishedQuizRate,
    reviewedReports,
    reviewedReportRate,
    metrics,
    distribution,
  };
}
