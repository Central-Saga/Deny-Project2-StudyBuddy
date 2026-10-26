import type { StudyGroup } from './types';

// =========================================================
// AUTH HELPERS
// =========================================================

export function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('meetspace_auth_token') ||
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

// =========================================================
// FORMATTERS
// =========================================================

export function formatDate(
  value?: string | null
): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }
  ).format(date);
}

export function formatTime(
  value?: string | null
): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  ).format(date);
}

export function getEndTime(
  value?: string | null,
  durationMinutes?: number
): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  date.setMinutes(
    date.getMinutes() +
      (durationMinutes || 0)
  );

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  ).format(date);
}

export function getInitials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return 'GR';
  }

  if (words.length === 1) {
    return words[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    words[0].charAt(0) +
    words[1].charAt(0)
  ).toUpperCase();
}

export function getActiveMemberCount(
  group: StudyGroup
): number {
  if (!Array.isArray(group.members)) {
    return 0;
  }

  return group.members.filter(
    (member) =>
      !member.status ||
      member.status === 'accepted'
  ).length;
}

export function isMyGroup(
  group: StudyGroup,
  userId?: number
): boolean {
  if (!userId) {
    return false;
  }

  if (group.creator_id === userId) {
    return true;
  }

  return Boolean(
    group.members?.some(
      (member) => {
        const memberUserId =
          member.user_id ??
          member.user?.id;

        return (
          memberUserId === userId &&
          member.status === 'accepted'
        );
      }
    )
  );
}
