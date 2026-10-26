import { createPageMetadata } from '@/lib/metadata';
import DashboardClient from '@/components/dashboard-home/DashboardClient';

export const metadata = createPageMetadata({
  title: 'Dashboard',
  description:
    'Ringkasan aktivitas belajar, sesi mendatang, dan grup belajarmu di StudyBuddy.',
  path: '/dashboard',
  isPrivate: true,
});

export default function DashboardPage() {
  return <DashboardClient />;
}
