import type { ReportStatus } from './types';

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
  localStorage.removeItem('meetspace_auth_token');
  localStorage.removeItem('user_data');
}

export function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatFileSize(value?: number | null): string {
  if (!value || value <= 0) {
    return '-';
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function getStatusLabel(status: ReportStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'reviewed':
      return 'Reviewed';
    case 'dismissed':
      return 'Dismissed';
    case 'action_taken':
      return 'Action Taken';
    default:
      return status;
  }
}

export function getStatusClass(status: ReportStatus): string {
  switch (status) {
    case 'pending':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'reviewed':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'dismissed':
      return 'border-slate-200 bg-slate-100 text-slate-600';
    case 'action_taken':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-600';
  }
}

export function getStatusDotClass(status: ReportStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-500';
    case 'reviewed':
      return 'bg-blue-500';
    case 'dismissed':
      return 'bg-slate-400';
    case 'action_taken':
      return 'bg-emerald-500';
    default:
      return 'bg-slate-400';
  }
}

export function getStatusDescription(status: ReportStatus): string {
  switch (status) {
    case 'pending':
      return 'Laporan belum ditinjau oleh administrator.';
    case 'reviewed':
      return 'Laporan sudah diperiksa dan masih dapat ditindaklanjuti.';
    case 'dismissed':
      return 'Laporan ditutup karena tidak memerlukan tindakan lanjutan.';
    case 'action_taken':
      return 'Tindakan moderasi telah dilakukan pada laporan ini.';
    default:
      return '';
  }
}

export function getDownloadFilename(
  response: Response,
  fallback: string
): string {
  const disposition = response.headers.get('content-disposition');

  if (!disposition) {
    return fallback;
  }

  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    return decodeURIComponent(utfMatch[1].replace(/["']/g, ''));
  }

  const basicMatch = disposition.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] || fallback;
}
