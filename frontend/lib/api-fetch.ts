const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (typeof window === 'undefined') {
    return fetch(input, init);
  }

  const inputUrl =
    typeof input === 'string'
      ? input
      : input instanceof Request
        ? input.url
        : input.toString();

  const apiRoot = new URL(API_BASE, window.location.origin);
  const target = new URL(inputUrl, window.location.origin);

  const basePath = apiRoot.pathname.replace(/\/+$/, '');
  const targetPath = target.pathname.replace(/\/+$/, '');

  const isApiRequest =
    target.origin === apiRoot.origin &&
    (targetPath === basePath ||
      targetPath.startsWith(`${basePath}/`));

  const isPublicAuth =
    targetPath === `${basePath}/login` ||
    targetPath === `${basePath}/register`;

  const headers = new Headers(
    init.headers ??
      (input instanceof Request ? input.headers : undefined)
  );

  if (isApiRequest) {
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (!isPublicAuth && !headers.has('Authorization')) {
      const token =
        localStorage.getItem('access_token') ||
        localStorage.getItem('meetspace_auth_token');

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
  }

  let response: Response;

  try {
    response = await fetch(input, {
      ...init,
      headers,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }

    throw new Error(
      'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.'
    );
  }

  if (
    isApiRequest &&
    !isPublicAuth &&
    response.status === 401
  ) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('meetspace_auth_token');
    localStorage.removeItem('user_data');

    if (
      window.location.pathname !== '/login' &&
      window.location.pathname !== '/register'
    ) {
      window.location.replace('/login');
    }
  }

  return response;
}