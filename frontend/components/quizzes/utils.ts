import { apiFetch as sharedApiFetch } from '@/lib/api-fetch';
import { API_URL } from '@/lib/auth';
import type { QuestionDraft, QuizForm } from './types';

const TOKEN_KEYS = ['access_token', 'meetspace_auth_token'];
function getToken() {
  if (typeof window === 'undefined') return '';
  for (const key of TOKEN_KEYS) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }
  return '';
}
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  return sharedApiFetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
}
export function newQuestion(): QuestionDraft {
  return {
    question_text: '',
    question_type: 'multiple_choice',
    points: 1,
    options: [
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
    ],
  };
}
export function emptyForm(): QuizForm {
  return {
    title: '',
    description: '',
    duration_minutes: '30',
    pass_score: '70',
    max_attempts: 'unlimited',
    subject_id: '',
  };
}
