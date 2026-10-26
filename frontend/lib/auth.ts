export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || '/api/v1'
).replace(/\/$/, '');

const TOKEN_KEYS = ['access_token', 'meetspace_auth_token'] as const;

export function getAccessToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return localStorage.getItem('access_token') || '';
}

export function authHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const token = getAccessToken();

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function clearAuthSession(): void {
  TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem('user_data');
}

export function redirectToLogin(): void {
  clearAuthSession();
  window.location.replace('/login');
}
