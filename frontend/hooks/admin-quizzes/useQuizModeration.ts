import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AdminQuizDetail,
  DisableTarget,
  RestoreTarget,
} from '@/components/admin-quizzes/types';
import {
  clearAuthStorage,
  getStoredToken,
} from '@/components/admin-quizzes/utils';

interface UseQuizModerationOptions {
  handleUnauthorized: (status: number) => boolean;
  loadQuizzes: () => Promise<void>;
  setSelectedQuiz: Dispatch<SetStateAction<AdminQuizDetail | null>>;
  setError: Dispatch<SetStateAction<string>>;
  setSuccess: Dispatch<SetStateAction<string>>;
}

export function useQuizModeration({
  handleUnauthorized,
  loadQuizzes,
  setSelectedQuiz,
  setError,
  setSuccess,
}: UseQuizModerationOptions) {
  const router = useRouter();

  const [
    disableTarget,
    setDisableTarget,
  ] =
    useState<DisableTarget | null>(
      null
    );

  const [
    disableReason,
    setDisableReason,
  ] = useState('');

  const [
    disableLoading,
    setDisableLoading,
  ] = useState(false);

  const [
    restoreTarget,
    setRestoreTarget,
  ] =
    useState<RestoreTarget | null>(
      null
    );

  const [
    restoreLoading,
    setRestoreLoading,
  ] = useState(false);
  const disableQuiz = async () => {
    if (!disableTarget) return;

    const reason =
      disableReason.trim();

    if (reason.length < 10) {
      setError(
        'Alasan moderasi minimal 10 karakter.'
      );
      return;
    }

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setDisableLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/admin/quizzes/${disableTarget.id}/disable`,
        {
          method: 'POST',
          headers: {
            Accept:
              'application/json',
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason,
          }),
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
        const firstError =
          payload?.errors
            ? Object.values(
                payload.errors
              ).flat()[0]
            : null;

        throw new Error(
          String(
            firstError ||
              payload?.message ||
              'Gagal menonaktifkan kuis.'
          )
        );
      }

      setSuccess(
        payload?.message ||
          'Kuis berhasil dinonaktifkan.'
      );

      setDisableTarget(null);
      setDisableReason('');
      setSelectedQuiz(null);

      await loadQuizzes();
    } catch (
      caughtError: unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal menonaktifkan kuis.'
      );
    } finally {
      setDisableLoading(false);
    }
  };

  const restoreQuiz = async () => {
    if (!restoreTarget) return;

    const token = getStoredToken();

    if (!token) {
      clearAuthStorage();
      router.replace('/login');
      return;
    }

    setRestoreLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `${API_URL}/admin/quizzes/${restoreTarget.id}/restore`,
        {
          method: 'POST',
          headers: {
            Accept:
              'application/json',
            Authorization:
              `Bearer ${token}`,
          },
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
            'Gagal memulihkan moderasi kuis.'
        );
      }

      setSuccess(
        payload?.message ||
          'Moderasi kuis berhasil dipulihkan.'
      );

      setRestoreTarget(null);
      setSelectedQuiz(null);

      await loadQuizzes();
    } catch (
      caughtError: unknown
    ) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Gagal memulihkan moderasi kuis.'
      );
    } finally {
      setRestoreLoading(false);
    }
  };

  return {
    disableTarget,
    setDisableTarget,
    disableReason,
    setDisableReason,
    disableLoading,
    restoreTarget,
    setRestoreTarget,
    restoreLoading,
    disableQuiz,
    restoreQuiz,
  };
}
