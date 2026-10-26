'use client';

import { apiFetch as fetch } from '@/lib/api-fetch';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/auth';
import type { VerificationFilter, TutorStatusFilter, TutorListItem, TutorDetail } from '@/components/admin-tutors/types';
import { clearAuthStorage, getStoredToken } from '@/components/admin-tutors/utils';

export function useAdminTutors() {
  const router = useRouter();

  const [tutors, setTutors] =
    useState<TutorListItem[]>([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState('');

  const [tutorsLoadError, setTutorsLoadError] =
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
      setTutorsLoadError('');

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

        if (!Array.isArray(payload?.data)) {
          throw new Error(
            'Respons daftar tutor dari server tidak valid.'
          );
        }

        setTutors(payload.data);
      } catch (caughtError: unknown) {
        setTutorsLoadError(
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

  return {
    router,
    tutors,
    loading,
    error,
    setError,
    tutorsLoadError,
    success,
    setSuccess,
    searchQuery,
    setSearchQuery,
    verificationFilter,
    setVerificationFilter,
    statusFilter,
    setStatusFilter,
    selectedTutor,
    setSelectedTutor,
    detailLoading,
    verifyTarget,
    setVerifyTarget,
    verificationLoading,
    summary,
    filteredTutors,
    openDetail,
    updateVerification,
    loadTutors,
  };
}
