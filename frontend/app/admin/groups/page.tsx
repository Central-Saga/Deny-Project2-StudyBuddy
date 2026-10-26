import { createPageMetadata } from '@/lib/metadata';
import AdminGroupsClient from '@/components/admin-groups/AdminGroupsClient';

export const metadata = createPageMetadata({
  title: 'Manajemen Grup Belajar',
  description: 'Pantau dan kelola grup belajar di StudyBuddy.',
  path: '/admin/groups',
  isPrivate: true,
});

export default function Page() {
  return <AdminGroupsClient />;
}
