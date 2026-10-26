import { createPageMetadata } from '@/lib/metadata';
import CalendarClient from '@/components/calendar/CalendarClient';

export const metadata = createPageMetadata({ title: 'Kalender Belajar', description: 'Kelola kalender dan jadwal sesi belajar.', path: '/dashboard/calendar', isPrivate: true });

export default function Page() {
  return <CalendarClient />;
}
