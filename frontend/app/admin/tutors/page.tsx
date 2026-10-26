import { createPageMetadata } from '@/lib/metadata';
import AdminTutorsClient from '@/components/admin-tutors/AdminTutorsClient';

export const metadata = createPageMetadata({
  title: 'Manajemen Tutor',
  description: 'Tinjau dan verifikasi profil tutor di StudyBuddy.',
  path: '/admin/tutors',
  isPrivate: true,
});

export default function Page() {
  return <AdminTutorsClient />;
}
