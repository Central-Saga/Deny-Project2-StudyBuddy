import { createPageMetadata } from '@/lib/metadata';
import NotificationsClient from '@/components/notifications/NotificationsClient';

export const metadata = createPageMetadata({ title: 'Notifikasi', description: 'Lihat pembaruan dan aktivitas terbaru.', path: '/dashboard/notifications', isPrivate: true });

export default function Page() {
  return <NotificationsClient />;
}
