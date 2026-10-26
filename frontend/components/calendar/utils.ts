export interface Subject {
  id: number;
  name: string;
}
export interface StudyGroup {
  id: number;
  creator_id: number;
  name: string;
  slug?: string;
  subject?: Subject | null;
}
export interface StudySession {
  id: number;
  host_id: number;
  study_group_id: number | null;
  subject_id: number | null;
  title: string;
  description?: string | null;
  meeting_link?: string | null;
  max_participants: number;
  scheduled_at: string;
  duration_minutes: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  participants_count?: number;
  is_joined?: boolean;
  study_group?: StudyGroup | null;
  subject?: Subject | null;
}
export interface SessionForm {
  title: string;
  study_group_id: string;
  date: string;
  time: string;
  duration_minutes: string;
  max_participants: string;
  meeting_link: string;
  description: string;
}
const TOKEN_KEY = 'meetspace_auth_token';
export const emptyForm: SessionForm = {
  title: '',
  study_group_id: '',
  date: '',
  time: '',
  duration_minutes: '120',
  max_participants: '5',
  meeting_link: '',
  description: '',
};
export function getToken() {
  if (typeof window === 'undefined') return '';
return (
    localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem('access_token') ||
    ''
  );
}
export function getPayload<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}
// Backend memakai dateTime tanpa timezone. API saat ini menampilkan suffix Z,
// jadi nilai jam/tanggal dipertahankan sebagai wall-clock WITA agar tidak bergeser.
export function splitApiDateTime(value: string) {
  const clean = value.replace(/Z$/, '');
  const [datePart, timePart = '00:00:00'] = clean.split('T');
  return {
    date: datePart,
    time: timePart.split('.')[0].slice(0, 5),
  };
}
export function getDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date);
}
export function formatIndonesianDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins ? `${hours}j ${mins}m` : `${hours} jam`;
}
export function getCalendarDays(cursorDate: Date) {
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}
