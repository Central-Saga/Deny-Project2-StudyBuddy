import type { DashboardStats } from '@/components/admin-home/types';
import { EMPTY_STATS } from '@/components/admin-home/types';

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

export function toNumber(value: unknown): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

export function normalizeStats(
  payload: unknown
): DashboardStats {
  if (
    typeof payload !== 'object' ||
    payload === null
  ) {
    return EMPTY_STATS;
  }

  const root = payload as Record<
    string,
    unknown
  >;

  const data =
    typeof root.data === 'object' &&
    root.data !== null
      ? (root.data as Record<
          string,
          unknown
        >)
      : null;

  const nestedStats =
    data &&
    typeof data.stats === 'object' &&
    data.stats !== null
      ? (data.stats as Record<
          string,
          unknown
        >)
      : null;

  const directStats =
    typeof root.stats === 'object' &&
    root.stats !== null
      ? (root.stats as Record<
          string,
          unknown
        >)
      : null;

  const source =
    nestedStats ||
    directStats ||
    data ||
    root;

  return {
    total_users: toNumber(
      source.total_users
    ),
    active_users: toNumber(
      source.active_users
    ),
    suspended_users: toNumber(
      source.suspended_users
    ),
    total_groups: toNumber(
      source.total_groups
    ),
    total_sessions: toNumber(
      source.total_sessions
    ),
    total_materials: toNumber(
      source.total_materials
    ),
    total_quizzes: toNumber(
      source.total_quizzes
    ),
    published_quizzes: toNumber(
      source.published_quizzes
    ),
    total_tutors: toNumber(
      source.total_tutors
    ),
    verified_tutors: toNumber(
      source.verified_tutors
    ),
    total_material_reports: toNumber(
      source.total_material_reports
    ),
    pending_material_reports: toNumber(
      source.pending_material_reports
    ),
  };
}

export function percentage(
  part: number,
  total: number
): number {
  if (total <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round((part / total) * 100)
    )
  );
}
