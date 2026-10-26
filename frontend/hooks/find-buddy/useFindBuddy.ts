import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL, clearAuthSession } from '@/lib/auth';
import {
  getApiPayload,
  isBuddyDto,
  isSubjectDto,
  type BuddyDetailDto,
  type BuddyDto,
  type LearningStyle,
  type SubjectDto,
} from '@/types/api';
import {
  getErrorMessage,
  getMatchingMode,
  getStoredToken,
  type MatchingMode,
} from '@/components/find-buddy/utils';

export function useFindBuddy() {
  const router = useRouter();
  const [buddies, setBuddies] = useState<BuddyDto[]>([]);
  const [subjects, setSubjects] = useState<SubjectDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionBuddyId, setActionBuddyId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [buddyLoadError, setBuddyLoadError] = useState('');
  const [matchingMode, setMatchingMode] = useState<MatchingMode>('none');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [selectedLearningStyles, setSelectedLearningStyles] =
    useState<LearningStyle[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('20:00');
  const [detail, setDetail] = useState<BuddyDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const fetchSubjects = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const response = await fetch(`${API_URL}/subjects`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (response.status === 401) {
      clearAuthSession();
      router.replace('/login');
      return;
    }
    if (!response.ok) return;
    const payload = await response.json();
    setSubjects(getApiPayload(payload, isSubjectDto));
  }, [router]);
  const fetchBuddies = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      clearAuthSession();
      router.replace('/login');
      return;
    }
    setLoading(true);
    setBuddyLoadError('');
    setErrorMsg('');
    try {
      if (dayOfWeek !== '' && endTime <= startTime) {
        throw new Error('Jam selesai harus setelah jam mulai.');
      }
      const params = new URLSearchParams();
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      selectedSubjectIds.forEach((id) => {
        params.append('subject_ids[]', String(id));
      });
      selectedLearningStyles.forEach((style) => {
        params.append('learning_styles[]', style);
      });
      if (dayOfWeek !== '') {
        params.set('day_of_week', dayOfWeek);
        params.set('start_time', startTime);
        params.set('end_time', endTime);
      }
      const response = await fetch(
        `${API_URL}/buddies${params.toString() ? `?${params.toString()}` : ''}`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        }
      );
      if (response.status === 401) {
        clearAuthSession();
        router.replace('/login');
        return;
      }
      if (!response.ok) {
  const errorPayload = await response.json().catch(() => null);
  throw new Error(
    response.status >= 500
      ? 'Server Study Buddy sedang bermasalah. Silakan coba lagi.'
      : getErrorMessage(errorPayload, 'Gagal mengambil data buddy.')
  );
}
const payload = await response.json().catch(() => null);
if (!payload || typeof payload !== 'object') {
  throw new Error('Respons API Buddy tidak valid.');
}
      // Laravel Resource pagination mengembalikan { data: [...] }, bukan array langsung.
      setBuddies(getApiPayload(payload, isBuddyDto));
      setMatchingMode(getMatchingMode(payload));
    } catch (error) {
      const expectedApiError =
        error instanceof Error &&
        (
          error.message === 'Server Study Buddy sedang bermasalah. Silakan coba lagi.' ||
          error.message === 'Gagal mengambil data buddy.' ||
          error.message.includes('Tidak dapat terhubung ke server')
        );
      if (expectedApiError) {
        console.warn('Buddy API:', error.message);
      } else {
        console.error('Gagal mengambil data buddy:', error);
      }
      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal terhubung ke server backend.'
      );
      setBuddyLoadError(error instanceof Error ? error.message : 'Gagal terhubung ke server backend.');
    } finally {
      setLoading(false);
    }
  }, [
    dayOfWeek,
    endTime,
    router,
    searchTerm,
    selectedLearningStyles,
    selectedSubjectIds,
    startTime,
  ]);
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      clearAuthSession();
      router.replace('/login');
      return;
    }
    void fetchSubjects();
  }, [fetchSubjects, router]);
  // Pencarian otomatis: initial load memakai profil login,
  // lalu filter manual mempersempit/mengganti kriteria terkait.
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchBuddies();
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [fetchBuddies]);
  function toggleSubject(subjectId: number) {
    setSelectedSubjectIds((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId]
    );
  }
  function toggleLearningStyle(style: LearningStyle) {
    setSelectedLearningStyles((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    );
  }
  function resetFilters() {
    setSearchTerm('');
    setSelectedSubjectIds([]);
    setSelectedLearningStyles([]);
    setDayOfWeek('');
    setStartTime('18:00');
    setEndTime('20:00');
    setErrorMsg('');
    // useEffect akan memuat ulang hasil otomatis berdasarkan profil login.
  }
  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await fetchBuddies();
  }
  async function connectionRequest(buddyId: number) {
    await runBuddyAction(
      buddyId,
      `${API_URL}/buddies/${buddyId}/connect`,
      'POST'
    );
  }
  async function acceptConnection(buddy: BuddyDto) {
    if (!buddy.connection_id) return;
    await runBuddyAction(
      buddy.id,
      `${API_URL}/buddy-connections/${buddy.connection_id}/accept`,
      'PATCH'
    );
  }
  async function rejectConnection(buddy: BuddyDto) {
    if (!buddy.connection_id) return;
    await runBuddyAction(
      buddy.id,
      `${API_URL}/buddy-connections/${buddy.connection_id}/reject`,
      'PATCH'
    );
  }
  async function removeConnection(buddy: BuddyDto) {
    if (!buddy.connection_id) return;
    await runBuddyAction(
      buddy.id,
      `${API_URL}/buddy-connections/${buddy.connection_id}`,
      'DELETE'
    );
  }
  async function runBuddyAction(
    buddyId: number,
    url: string,
    method: 'POST' | 'PATCH' | 'DELETE'
  ) {
    const token = getStoredToken();
    if (!token) return;
    setActionBuddyId(buddyId);
    setErrorMsg('');
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 401) {
        clearAuthSession();
        router.replace('/login');
        return;
      }
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Aksi koneksi gagal.'));
      }
      await fetchBuddies();
      if (detail?.id === buddyId) {
        await openDetail(buddyId);
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Aksi koneksi gagal.');
    } finally {
      setActionBuddyId(null);
    }
  }
  async function openDetail(buddyId: number) {
    const token = getStoredToken();
    if (!token) return;
    setDetailLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_URL}/buddies/${buddyId}`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, 'Gagal memuat profil buddy.'));
      }
      setDetail((payload?.data || null) as BuddyDetailDto | null);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : 'Gagal memuat profil buddy.'
      );
    } finally {
      setDetailLoading(false);
    }
  }
  return {
    buddies,
    subjects,
    loading,
    actionBuddyId,
    errorMsg,
    buddyLoadError,
    matchingMode,
    searchTerm,
    setSearchTerm,
    selectedSubjectIds,
    selectedLearningStyles,
    dayOfWeek,
    setDayOfWeek,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    detail,
    setDetail,
    detailLoading,
    toggleSubject,
    toggleLearningStyle,
    resetFilters,
    submitSearch,
    connectionRequest,
    acceptConnection,
    rejectConnection,
    removeConnection,
    openDetail,
    fetchBuddies,
  };
}
