import type { LearningStyle, UserDto } from '@/types/api';
export const LEARNING_STYLES: LearningStyle[] = [
  'Visual',
  'Diskusi',
  'Membaca Mandiri',
  'Praktik Soal',
];
export const DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];
export type ProfileForm = {
  name: string;
  email: string;
  course: string;
  skills: string;
  bio: string;
  phone_number: string;
  university: string;
  major: string;
  github_url: string;
  linkedin_url: string;
};
export type MeResponse = { user?: UserDto };
export type UpdateProfileResponse = {
  message?: string;
  user?: UserDto;
  errors?: Record<string, string[]>;
};
export const emptyForm: ProfileForm = {
  name: '',
  email: '',
  course: '',
  skills: '',
  bio: '',
  phone_number: '',
  university: '',
  major: '',
  github_url: '',
  linkedin_url: '',
};
export function userToForm(user: UserDto): ProfileForm {
  return {
    name: user.name || '',
    email: user.email || '',
    course: user.course || '',
    skills: Array.isArray(user.skills) ? user.skills.join(', ') : '',
    bio: user.profile?.bio ?? user.bio ?? '',
    phone_number: user.profile?.phone_number ?? '',
    university: user.profile?.university ?? '',
    major: user.profile?.major ?? '',
    github_url: user.profile?.github_url ?? '',
    linkedin_url: user.profile?.linkedin_url ?? '',
  };
}
export function getValidationMessage(
  payload: UpdateProfileResponse,
  fallback: string
): string {
  if (payload.errors) {
    const messages = Object.values(payload.errors).flat();
    if (messages.length > 0) return messages[0];
  }
  return payload.message || fallback;
}
