import { FormEvent, useState } from 'react';
import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import type {
  ApiMessage,
  Group,
  GroupFormState,
  Subject,
} from '@/components/groups/types';
import { emptyGroupForm } from '@/components/groups/types';
import { getErrorMessage, getStoredToken } from '@/components/groups/utils';

type Params = {
  subjects: Subject[];
  setShowDetailModal: (show: boolean) => void;
  setErrorMsg: (message: string | null) => void;
  showSuccess: (message: string) => void;
  handleUnauthorized: () => void;
  fetchGroups: (silent?: boolean) => Promise<void>;
};

export function useGroupForm({
  subjects,
  setShowDetailModal,
  setErrorMsg,
  showSuccess,
  handleUnauthorized,
  fetchGroups,
}: Params) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormState>(
    emptyGroupForm
  );

  const openCreateModal = () => {
    setFormMode('create');
    setEditingGroup(null);
    setFormError(null);
    setGroupForm({
      ...emptyGroupForm,
      subject_id:
        subjects.length > 0
          ? String(subjects[0].id)
          : '',
    });
    setShowFormModal(true);
  };

  const openEditModal = (group: Group) => {
    setFormMode('edit');
    setEditingGroup(group);
    setFormError(null);
    setGroupForm({
      name: group.name,
      subject_id: group.subject_id
        ? String(group.subject_id)
        : '',
      description: group.description || '',
      max_members: group.max_members,
      is_private: group.is_private,
    });
    setShowDetailModal(false);
    setShowFormModal(true);
  };

  const handleSaveGroup = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    if (!groupForm.name.trim()) {
      setFormError('Nama grup wajib diisi.');
      return;
    }

    if (!groupForm.subject_id) {
      setFormError('Silakan pilih mata kuliah.');
      return;
    }

    if (
      groupForm.max_members < 2 ||
      groupForm.max_members > 100
    ) {
      setFormError('Kapasitas grup harus antara 2 sampai 100 anggota.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setErrorMsg(null);

    try {
      const isEditing = formMode === 'edit' && editingGroup;

      const response = await fetch(
        isEditing
          ? `${API_URL}/groups/${editingGroup.id}`
          : `${API_URL}/groups`,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: groupForm.name.trim(),
            subject_id: Number(groupForm.subject_id),
            description:
              groupForm.description.trim() || null,
            max_members: Number(groupForm.max_members),
            is_private: groupForm.is_private,
          }),
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            payload,
            isEditing
              ? 'Gagal memperbarui grup.'
              : 'Gagal membuat grup.'
          )
        );
      }

      setShowFormModal(false);
      setEditingGroup(null);
      setGroupForm(emptyGroupForm);

      showSuccess(
        isEditing
          ? payload.message || 'Grup berhasil diperbarui.'
          : 'Grup belajar berhasil dibuat.'
      );

      await fetchGroups(true);
    } catch (error) {
      console.error('Gagal menyimpan grup:', error);

      setFormError(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan grup.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    submitting,
    formError,
    setFormError,
    showFormModal,
    setShowFormModal,
    formMode,
    editingGroup,
    setEditingGroup,
    groupForm,
    setGroupForm,
    openCreateModal,
    openEditModal,
    handleSaveGroup,
  };
}
