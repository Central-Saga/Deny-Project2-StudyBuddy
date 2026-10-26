export function getStoredToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return (
    localStorage.getItem(
      'access_token'
    ) ||
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

  localStorage.removeItem(
    'access_token'
  );

  localStorage.removeItem(
    'meetspace_auth_token'
  );

  localStorage.removeItem(
    'user_data'
  );
}

export function formatDate(
  value?: string | null
): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  ).format(date);
}

export function formatDateTime(
  value?: string | null
): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
