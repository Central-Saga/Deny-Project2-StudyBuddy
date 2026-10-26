import type { AdminQuizListItem } from './types';

export function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem(
      'meetspace_auth_token'
    ) ||
    ''
  );
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem('access_token');
  localStorage.removeItem(
    'meetspace_auth_token'
  );
  localStorage.removeItem('user_data');
}

export function formatDateTime(
  value?: string | null
): string {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  ).format(date);
}

export type QuizStatusLike = Pick<
  AdminQuizListItem,
  'is_published' | 'is_admin_disabled'
>;

export function getStatusLabel(
  quiz: QuizStatusLike
): string {
  if (quiz.is_admin_disabled) {
    return 'Admin Disabled';
  }

  return quiz.is_published
    ? 'Published'
    : 'Unpublished';
}

export function getStatusClass(
  quiz: QuizStatusLike
): string {
  if (quiz.is_admin_disabled) {
    return (
      'border-red-200 bg-red-50 ' +
      'text-red-700'
    );
  }

  if (quiz.is_published) {
    return (
      'border-emerald-200 ' +
      'bg-emerald-50 text-emerald-700'
    );
  }

  return (
    'border-slate-200 ' +
    'bg-slate-100 text-slate-600'
  );
}
