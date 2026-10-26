import { createPageMetadata } from '@/lib/metadata';
import ProfileClient from '@/components/profile/ProfileClient';

export const metadata = createPageMetadata({ title: 'Profil', description: 'Kelola informasi profil dan preferensi belajar.', path: '/dashboard/profile', isPrivate: true });

export default function Page() {
  return <ProfileClient />;
}
