import { createPageMetadata } from '@/lib/metadata';
import MaterialsClient from '@/components/materials/MaterialsClient';

export const metadata = createPageMetadata({
  title: 'Materi Belajar',
  description:
    'Temukan, bagikan, dan unduh materi belajar di Study Buddy.',
  path: '/dashboard/materials',
  isPrivate: true,
});

export default function MaterialsPage() {
  return <MaterialsClient />;
}
