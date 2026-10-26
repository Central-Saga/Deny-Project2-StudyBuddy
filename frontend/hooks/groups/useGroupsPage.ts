import { useState } from 'react';
import { useGroupsData } from './useGroupsData';
import { useGroupMembership } from './useGroupMembership';
import { useGroupForm } from './useGroupForm';
import { useGroupSession } from './useGroupSession';
import { useGroupsDerived } from './useGroupsDerived';

export function useGroupsPage() {
  const data = useGroupsData();
  const [searchTerm, setSearchTerm] = useState('');

  const membership = useGroupMembership({
    selectedGroup: data.selectedGroup,
    setSelectedGroup: data.setSelectedGroup,
    setErrorMsg: data.setErrorMsg,
    showSuccess: data.showSuccess,
    handleUnauthorized: data.handleUnauthorized,
    fetchGroups: data.fetchGroups,
    fetchGroupDetail: data.fetchGroupDetail,
  });

  const form = useGroupForm({
    subjects: data.subjects,
    setShowDetailModal: membership.setShowDetailModal,
    setErrorMsg: data.setErrorMsg,
    showSuccess: data.showSuccess,
    handleUnauthorized: data.handleUnauthorized,
    fetchGroups: data.fetchGroups,
  });

  const session = useGroupSession({
    currentUserId: data.currentUserId,
    setShowDetailModal: membership.setShowDetailModal,
    setErrorMsg: data.setErrorMsg,
    showSuccess: data.showSuccess,
    handleUnauthorized: data.handleUnauthorized,
  });

  const derived = useGroupsDerived({
    groups: data.groups,
    currentUserId: data.currentUserId,
    selectedGroup: data.selectedGroup,
    searchTerm,
  });

  return {
    ...data,
    ...membership,
    ...form,
    ...session,
    ...derived,
    searchTerm,
    setSearchTerm,
  };
}

export type GroupsPageState = ReturnType<typeof useGroupsPage>;
