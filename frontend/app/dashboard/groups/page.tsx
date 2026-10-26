import { createPageMetadata } from '@/lib/metadata';
import GroupsClient from '@/components/groups/GroupsClient';

export const metadata = createPageMetadata({
  title: 'Grup Belajar',
  description:
    'Temukan grup belajar, kelola komunitas, dan proses permintaan anggota.',
  path: '/dashboard/groups',
  isPrivate: true,
});

export default function GroupsPage() {
  return <GroupsClient />;
}
