import type { ApiMessage } from './types';

export function getLocalDateValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

export function getErrorMessage(
  payload: ApiMessage,
  fallback: string
): string {
  if (payload.errors) {
    const validationMessages = Object.values(
      payload.errors
    ).flat();

    if (validationMessages.length > 0) {
      return validationMessages[0];
    }
  }

  return payload.message || fallback;
}
