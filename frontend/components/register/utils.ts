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
export function saveAuthData(
  token: string,
  user: unknown
): void {
  localStorage.setItem('access_token', token);
localStorage.setItem(
    'meetspace_auth_token',
    token
  );
localStorage.setItem(
    'user_data',
    JSON.stringify(user)
  );
}

export function getApiError(
  data: unknown,
  fallback: string
): string {
  if (
    typeof data !== 'object' ||
    data === null
  ) {
    return fallback;
  }
const response = data as {
    message?: string;
    errors?: Record<string, string[]>;
  };
if (response.errors) {
    const firstError =
      Object.values(response.errors)[0];
if (
      Array.isArray(firstError) &&
      firstError.length > 0
    ) {
      return firstError[0];
    }
  }
return response.message || fallback;
}
