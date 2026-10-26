import { useMemo } from 'react';
import type { Group } from '@/components/groups/types';

type Params = {
  groups: Group[];
  currentUserId: number | null;
  selectedGroup: Group | null;
  searchTerm: string;
};

export function useGroupsDerived({
  groups,
  currentUserId,
  selectedGroup,
  searchTerm,
}: Params) {
  const acceptedMemberCount = (group: Group) =>
    group.members?.filter(
      (member) => member.status === 'accepted'
    ).length || 0;

  const getCurrentMembership = (group: Group) =>
    group.members?.find(
      (member) => member.user_id === currentUserId
    );

  const canManageGroup = (group: Group) => {
    if (!currentUserId) {
      return false;
    }

    if (group.creator_id === currentUserId) {
      return true;
    }

    return Boolean(
      group.members?.some(
        (member) =>
          member.user_id === currentUserId &&
          member.role === 'admin' &&
          member.status === 'accepted'
      )
    );
  };

  const filteredGroups = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    if (!keyword) {
      return groups;
    }

    return groups.filter((group) => {
      return (
        group.name.toLowerCase().includes(keyword) ||
        (group.subject?.name || '')
          .toLowerCase()
          .includes(keyword) ||
        (group.subject?.code || '')
          .toLowerCase()
          .includes(keyword) ||
        (group.description || '')
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [groups, searchTerm]);

  const totalMembers = groups.reduce(
    (total, group) => total + acceptedMemberCount(group),
    0
  );

  const privateGroups = groups.filter(
    (group) => group.is_private
  ).length;

  const joinedGroups = groups.filter((group) => {
    return getCurrentMembership(group)?.status === 'accepted';
  }).length;

  const selectedAcceptedMembers =
    selectedGroup?.members?.filter(
      (member) => member.status === 'accepted'
    ) || [];

  const selectedPendingMembers =
    selectedGroup?.members?.filter(
      (member) => member.status === 'pending'
    ) || [];

  const selectedMembership = selectedGroup
    ? getCurrentMembership(selectedGroup)
    : undefined;

  const selectedCanManage = selectedGroup
    ? canManageGroup(selectedGroup)
    : false;

  const selectedIsCreator = selectedGroup
    ? currentUserId === selectedGroup.creator_id
    : false;

  return {
    acceptedMemberCount,
    getCurrentMembership,
    canManageGroup,
    filteredGroups,
    totalMembers,
    privateGroups,
    joinedGroups,
    selectedAcceptedMembers,
    selectedPendingMembers,
    selectedMembership,
    selectedCanManage,
    selectedIsCreator,
  };
}
