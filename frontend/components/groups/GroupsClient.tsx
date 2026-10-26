'use client';

import { useGroupsPage } from '@/hooks/groups/useGroupsPage';
import GroupsHeader from './GroupsHeader';
import GroupsNotices from './GroupsNotices';
import GroupsOverview from './GroupsOverview';
import GroupsContent from './GroupsContent';
import GroupFormModal from './GroupFormModal';
import GroupDetailModal from './GroupDetailModal';
import GroupSessionModal from './GroupSessionModal';
import GroupDeleteModal from './GroupDeleteModal';

export default function GroupsClient() {
  const state = useGroupsPage();

  return (
    <div className="w-full space-y-6 pb-8">
      <GroupsHeader {...state} />
      <GroupsNotices {...state} />
      <GroupsOverview {...state} />
      <GroupsContent {...state} />
      <GroupFormModal {...state} />
      <GroupDetailModal {...state} />
      <GroupSessionModal {...state} />
      <GroupDeleteModal {...state} />
    </div>
  );
}
