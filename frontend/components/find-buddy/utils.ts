import type { LearningStyle } from '@/types/api';

export const LEARNING_STYLES: LearningStyle[] = [
  'Visual',
  'Diskusi',
  'Membaca Mandiri',
  'Praktik Soal',
];

export type MatchingMode = 'profile' | 'filters' | 'none';

export const DAYS = [
  { value: '', label: 'Semua Hari' },
  { value: '0', label: 'Minggu' },
  { value: '1', label: 'Senin' },
  { value: '2', label: 'Selasa' },
  { value: '3', label: 'Rabu' },
  { value: '4', label: 'Kamis' },
  { value: '5', label: 'Jumat' },
  { value: '6', label: 'Sabtu' },
];

export function getStoredToken(): string {
  if (typeof window === 'undefined') return '';
  return (
    localStorage.getItem('access_token') ||
    localStorage.getItem('meetspace_auth_token') ||
    ''
  );
}

export function getErrorMessage(payload: unknown, fallback: string): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof payload.message === 'string'
  ) {
    return payload.message;
  }
  return fallback;
}

export function getMatchingMode(payload: unknown): MatchingMode {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'matching' in payload &&
    typeof payload.matching === 'object' &&
    payload.matching !== null &&
    'mode' in payload.matching
  ) {
    const mode = payload.matching.mode;
    if (mode === 'profile' || mode === 'filters' || mode === 'none') {
      return mode;
    }
  }
  return 'none';
}
