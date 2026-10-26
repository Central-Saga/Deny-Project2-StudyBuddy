import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import type {
  AdminQuizDetail,
  AdminQuizListItem,
  QuizFilter,
} from '@/components/admin-quizzes/types';
import {
  clearAuthStorage,
  getStoredToken,
} from '@/components/admin-quizzes/utils';

export function useQuizzesData() {
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

  const [quizzesLoadError, setQuizzesLoadError] =
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
      setQuizzesLoadError('');

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

        if (!Array.isArray(payload?.data)) {
          throw new Error(
            'Respons daftar kuis dari server tidak valid.'
          );
        }

        setQuizzes(payload.data);
      } catch (
        caughtError: unknown
      ) {
        setQuizzesLoadError(
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

  return {
    quizzes,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    setError,
    quizzesLoadError,
    success,
    setSuccess,
    selectedQuiz,
    setSelectedQuiz,
    detailLoading,
    handleUnauthorized,
    loadQuizzes,
    summary,
    filteredQuizzes,
    openDetail,
  };
}
