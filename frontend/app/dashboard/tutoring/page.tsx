import { createPageMetadata } from '@/lib/metadata';
import TutoringClient from '@/components/tutoring/TutoringClient';

export const metadata = createPageMetadata({
  title: 'Peer Tutoring',
  description: 'Cari tutor sebaya atau aktifkan mode tutor untuk membantu mahasiswa lain.',
  path: '/dashboard/tutoring',
  isPrivate: true,
});

export default function TutoringPage() {
  return <TutoringClient />;
}
