import { FormEvent, useState } from 'react';
import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import type {
  ApiMessage,
  Group,
  SessionFormState,
} from '@/components/groups/types';
import { emptySessionForm } from '@/components/groups/types';
import {
  getErrorMessage,
  getLocalDateValue,
  getStoredToken,
} from '@/components/groups/utils';

type Params = {
  currentUserId: number | null;
  setShowDetailModal: (show: boolean) => void;
  setErrorMsg: (message: string | null) => void;
  showSuccess: (message: string) => void;
  handleUnauthorized: () => void;
};

export function useGroupSession({
  currentUserId,
  setShowDetailModal,
  setErrorMsg,
  showSuccess,
  handleUnauthorized,
}: Params) {
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionGroup, setSessionGroup] = useState<Group | null>(null);
  const [sessionForm, setSessionForm] = useState<SessionFormState>(
    emptySessionForm
  );
  const [savingSession, setSavingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const openSessionModal = (group: Group) => {
    if (currentUserId !== group.creator_id) {
      setErrorMsg('Hanya ketua grup yang dapat membuat sesi belajar.');
      return;
    }

    setSessionGroup(group);
    setSessionError(null);
    setSessionForm({
      ...emptySessionForm,
      date: getLocalDateValue(),
      max_participants: Math.max(2, group.max_members),
    });
    setShowDetailModal(false);
    setShowSessionModal(true);
  };

  const handleCreateSession = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    if (!sessionGroup) {
      setSessionError('Grup sesi tidak ditemukan.');
      return;
    }

    if (currentUserId !== sessionGroup.creator_id) {
      setSessionError('Hanya ketua grup yang dapat membuat sesi belajar.');
      return;
    }

    if (!sessionForm.title.trim()) {
      setSessionError('Judul sesi wajib diisi.');
      return;
    }

    if (!sessionForm.date || !sessionForm.time) {
      setSessionError('Tanggal dan jam sesi wajib diisi.');
      return;
    }

    setSavingSession(true);
    setSessionError(null);
    setErrorMsg(null);

    try {
      const response = await fetch(`${API_URL}/study-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          study_group_id: sessionGroup.id,
          title: sessionForm.title.trim(),
          description: sessionForm.description.trim() || null,
          meeting_link: sessionForm.meeting_link.trim() || null,
          max_participants: Number(sessionForm.max_participants),
          scheduled_at: `${sessionForm.date} ${sessionForm.time}:00`,
          duration_minutes: Number(sessionForm.duration_minutes),
        }),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(payload, 'Gagal membuat sesi belajar.')
        );
      }

      setShowSessionModal(false);
      setSessionGroup(null);
      setSessionForm(emptySessionForm);
      showSuccess(
        payload.message ||
          'Sesi belajar berhasil dibuat. Lihat jadwal pada menu Kalender.'
      );
    } catch (error) {
      console.error('Gagal membuat sesi belajar:', error);
      setSessionError(
        error instanceof Error
          ? error.message
          : 'Gagal membuat sesi belajar.'
      );
    } finally {
      setSavingSession(false);
    }
  };

  return {
    showSessionModal,
    setShowSessionModal,
    sessionGroup,
    setSessionGroup,
    sessionForm,
    setSessionForm,
    savingSession,
    sessionError,
    setSessionError,
    openSessionModal,
    handleCreateSession,
  };
}
