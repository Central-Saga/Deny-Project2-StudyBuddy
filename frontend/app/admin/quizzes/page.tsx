import { createPageMetadata } from '@/lib/metadata';
import AdminQuizzesClient from '@/components/admin-quizzes/AdminQuizzesClient';

export const metadata = createPageMetadata({
  title: 'Moderasi Kuis',
  description: 'Tinjau dan moderasi kuis yang dibuat pengguna StudyBuddy.',
  path: '/admin/quizzes',
  isPrivate: true,
});

export default function AdminQuizzesPage() {
  return <AdminQuizzesClient />;
}
