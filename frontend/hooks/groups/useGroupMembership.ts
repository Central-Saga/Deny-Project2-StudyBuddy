import { useState } from 'react';
import { apiFetch as fetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import type {
  ApiMessage,
  Group,
  GroupMember,
} from '@/components/groups/types';
import { getErrorMessage, getStoredToken } from '@/components/groups/utils';

type Params = {
  selectedGroup: Group | null;
  setSelectedGroup: (group: Group | null) => void;
  setErrorMsg: (message: string | null) => void;
  showSuccess: (message: string) => void;
  handleUnauthorized: () => void;
  fetchGroups: (silent?: boolean) => Promise<void>;
  fetchGroupDetail: (groupId: number) => Promise<Group | null>;
};

export function useGroupMembership({
  selectedGroup,
  setSelectedGroup,
  setErrorMsg,
  showSuccess,
  handleUnauthorized,
  fetchGroups,
  fetchGroupDetail,
}: Params) {
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [membershipActionGroupId, setMembershipActionGroupId] =
    useState<number | null>(null);
  const [memberActionId, setMemberActionId] = useState<number | null>(null);

  const openDetailModal = async (group: Group) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
    await fetchGroupDetail(group.id);
  };

  const handleToggleJoin = async (group: Group) => {
    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    setMembershipActionGroupId(group.id);
    setErrorMsg(null);

    try {
      const response = await fetch(
        `${API_URL}/groups/${group.id}/toggle-join`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
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
            'Gagal memperbarui keanggotaan grup.'
          )
        );
      }

      showSuccess(
        payload.message || 'Keanggotaan grup berhasil diperbarui.'
      );

      await fetchGroups(true);

      if (showDetailModal && selectedGroup?.id === group.id) {
        await fetchGroupDetail(group.id);
      }
    } catch (error) {
      console.error('Gagal memperbarui membership:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal memperbarui keanggotaan grup.'
      );
    } finally {
      setMembershipActionGroupId(null);
    }
  };

  const handleMemberStatus = async (
    group: Group,
    member: GroupMember,
    status: 'accepted' | 'rejected'
  ) => {
    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    setMemberActionId(member.id);
    setErrorMsg(null);

    try {
      const response = await fetch(
        `${API_URL}/groups/${group.id}/members/${member.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
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
            'Gagal memproses permintaan anggota.'
          )
        );
      }

      showSuccess(
        payload.message || 'Permintaan anggota berhasil diproses.'
      );

      await fetchGroups(true);
      await fetchGroupDetail(group.id);
    } catch (error) {
      console.error('Gagal memproses anggota:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal memproses permintaan anggota.'
      );
    } finally {
      setMemberActionId(null);
    }
  };

  const openDeleteConfirmation = (group: Group) => {
    setGroupToDelete(group);
    setShowDetailModal(false);
    setShowDeleteModal(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) {
      return;
    }

    const token = getStoredToken();

    if (!token) {
      handleUnauthorized();
      return;
    }

    setDeleting(true);
    setErrorMsg(null);

    try {
      const response = await fetch(
        `${API_URL}/groups/${groupToDelete.id}`,
        {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const payload: ApiMessage = await response.json();

      if (!response.ok) {
        throw new Error(
          getErrorMessage(payload, 'Gagal menghapus grup.')
        );
      }

      setShowDeleteModal(false);
      setGroupToDelete(null);
      setSelectedGroup(null);

      showSuccess(payload.message || 'Grup berhasil dihapus.');

      await fetchGroups(true);
    } catch (error) {
      console.error('Gagal menghapus grup:', error);

      setErrorMsg(
        error instanceof Error
          ? error.message
          : 'Gagal menghapus grup.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return {
    showDetailModal,
    setShowDetailModal,
    showDeleteModal,
    setShowDeleteModal,
    groupToDelete,
    setGroupToDelete,
    deleting,
    membershipActionGroupId,
    memberActionId,
    openDetailModal,
    handleToggleJoin,
    handleMemberStatus,
    openDeleteConfirmation,
    handleDeleteGroup,
  };
}
