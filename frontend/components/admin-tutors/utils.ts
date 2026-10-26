export function getStoredToken(): string {
  if (typeof window === 'undefined') return '';

  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('meetspace_auth_token') ||
    ''
  );
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('access_token');
  localStorage.removeItem('meetspace_auth_token');
  localStorage.removeItem('user_data');
}

export function formatDateTime(
  value?: string | null
): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : '-';
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function getDayName(dayOfWeek: number): string {
  const days = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  return days[dayOfWeek] ?? '-';
}

export function getProficiencyLabel(
  value?: string | null
): string {
  switch (value) {
    case 'beginner':
      return 'Pemula';
    case 'intermediate':
      return 'Menengah';
    case 'advanced':
      return 'Mahir';
    default:
      return value || 'Mahir';
  }
}
