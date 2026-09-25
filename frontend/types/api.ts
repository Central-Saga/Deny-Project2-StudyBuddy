export interface UserProfileDto {
  bio?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  university?: string | null;
  major?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
}

export interface SubjectDto {
  id: number;
  code?: string | null;
  name: string;
  proficiency_level?: 'beginner' | 'intermediate' | 'advanced';
  type?: 'learning' | 'teaching';
}

export interface AvailabilityDto {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  timezone?: string | null;
  is_recurring?: boolean;
}

export type LearningStyle =
  | 'Visual'
  | 'Diskusi'
  | 'Membaca Mandiri'
  | 'Praktik Soal';

export interface UserDto {
  id: number;
  name: string;
  email: string;
  course?: string | null;
  skills?: string[];
  learning_styles?: LearningStyle[];
  subjects?: SubjectDto[];
  availabilities?: AvailabilityDto[];
  last_active_at?: string | null;
  bio?: string | null;
  profile?: UserProfileDto | null;
  created_at?: string | null;
}

export type BuddyConnectionStatus = 'pending' | 'accepted' | null;
export type BuddyConnectionDirection = 'incoming' | 'outgoing' | null;

export interface BuddyDto extends UserDto {
  match_score?: number;
  matched_subjects?: SubjectDto[];
  availability_match?: boolean;
  learning_style_match?: boolean;
  is_connected?: boolean;
  connection_id?: number | null;
  connection_status?: BuddyConnectionStatus;
  connection_direction?: BuddyConnectionDirection;
}

export interface BuddyDetailDto extends BuddyDto {
  related_groups?: Array<{
    id: number;
    name: string;
    slug?: string | null;
    description?: string | null;
    max_members?: number;
    members_count?: number;
    is_private?: boolean;
    is_full?: boolean;
    membership_status?: string | null;
    subject?: SubjectDto | null;
  }>;
}

export interface StudyGroupDto {
  id: number;
  name: string;
  slug?: string | null;
  subject?: SubjectDto | null;
  subject_id?: number | null;
}

export type StudySessionStatus =
  | 'scheduled'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface StudySessionDto {
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
  status: StudySessionStatus;
  participants_count?: number;
  study_group?: StudyGroupDto | null;
  subject?: SubjectDto | null;
}

export interface MaterialDto {
  id: number;
  group_id: number;
  uploaded_by: number;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isUserDto(value: unknown): value is UserDto {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.email === 'string'
  );
}

export function isBuddyDto(value: unknown): value is BuddyDto {
  return isUserDto(value);
}

export function isSubjectDto(value: unknown): value is SubjectDto {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string'
  );
}

export function isStudyGroupDto(value: unknown): value is StudyGroupDto {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.name === 'string'
  );
}

export function isStudySessionDto(
  value: unknown
): value is StudySessionDto {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.host_id === 'number' &&
    (typeof value.study_group_id === 'number' ||
      value.study_group_id === null) &&
    (typeof value.subject_id === 'number' || value.subject_id === null) &&
    typeof value.title === 'string' &&
    typeof value.max_participants === 'number' &&
    typeof value.scheduled_at === 'string' &&
    typeof value.duration_minutes === 'number' &&
    typeof value.status === 'string'
  );
}

export function isMaterialDto(value: unknown): value is MaterialDto {
  return (
    isRecord(value) &&
    typeof value.id === 'number' &&
    typeof value.group_id === 'number' &&
    typeof value.uploaded_by === 'number' &&
    typeof value.title === 'string' &&
    typeof value.file_path === 'string' &&
    typeof value.file_type === 'string' &&
    typeof value.file_size === 'number' &&
    typeof value.created_at === 'string' &&
    typeof value.updated_at === 'string'
  );
}

export function getApiPayload<T>(
  payload: unknown,
  guard: (value: unknown) => value is T
): T[] {
  let items: unknown[] = [];

  if (Array.isArray(payload)) {
    items = payload;
  } else if (isRecord(payload) && Array.isArray(payload.data)) {
    items = payload.data;
  }

  return items.filter(guard);
}

export function getApiData<T>(
  payload: unknown,
  guard: (value: unknown) => value is T
): T | null {
  if (guard(payload)) {
    return payload;
  }

  if (isRecord(payload) && guard(payload.data)) {
    return payload.data;
  }

  return null;
}

export function parseUserDto(value: string): UserDto | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isUserDto(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
