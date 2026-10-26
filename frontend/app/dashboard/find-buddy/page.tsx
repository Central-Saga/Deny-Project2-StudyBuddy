import { createPageMetadata } from '@/lib/metadata';
import FindBuddyClient from '@/components/find-buddy/FindBuddyClient';

export const metadata = createPageMetadata({
  title: 'Cari Study Buddy',
  description: 'Temukan teman belajar yang cocok dengan mata kuliah dan gaya belajarmu.',
  path: '/dashboard/find-buddy',
  isPrivate: true,
});

export default function Page() {
  return <FindBuddyClient />;
}
