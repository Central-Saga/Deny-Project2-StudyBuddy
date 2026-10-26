import { createPageMetadata } from '@/lib/metadata';
import QuizzesClient from '@/components/quizzes/QuizzesClient';

export const metadata = createPageMetadata({
  title: 'Kuis Belajar',
  description:
    'Buat, kerjakan, edit, dan kelola kuis pembelajaran di StudyBuddy.',
  path: '/dashboard/quizzes',
  isPrivate: true,
});

export default function QuizzesPage() {
  return <QuizzesClient />;
}
