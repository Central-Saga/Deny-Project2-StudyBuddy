import { createPageMetadata } from '@/lib/metadata';
import AdminUsersClient from '@/components/admin-users/AdminUsersClient';

export const metadata = createPageMetadata({
  title: 'Kelola Pengguna',
  description: 'Lihat dan kelola status akun pengguna StudyBuddy.',
  path: '/admin/users',
  isPrivate: true,
});

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
