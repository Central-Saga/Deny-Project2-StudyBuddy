import { createPageMetadata } from '@/lib/metadata';
import AdminHomeClient from '@/components/admin-home/AdminHomeClient';

export const metadata = createPageMetadata({
  title: 'Dashboard Admin',
  description: 'Ringkasan statistik dan aktivitas platform StudyBuddy.',
  path: '/admin',
  isPrivate: true,
});

export default function Page() {
  return <AdminHomeClient />;
}
