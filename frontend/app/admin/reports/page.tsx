import { createPageMetadata } from '@/lib/metadata';
import AdminReportsClient from '@/components/admin-reports/AdminReportsClient';

export const metadata = createPageMetadata({
  title: 'Laporan Material',
  description: 'Tinjau laporan material dan lakukan tindakan moderasi di StudyBuddy.',
  path: '/admin/reports',
  isPrivate: true,
});

export default function AdminReportsPage() {
  return <AdminReportsClient />;
}
