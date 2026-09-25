export interface UserProfileDto {
  bio?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  university?: string | null;
  major?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  course?: string | null;
  skills?: string[];
  bio?: string | null;
  profile?: UserProfileDto | null;
  created_at?: string | null;
}

export interface SubjectDto {
  id: number;
  name: string;
}

export interface StudyGroupDto {
  id: number;
  name: string;
  slug?: string | null;
  subject?: SubjectDto | null;
  subject_id?: number | null;
}

export type StudySessionStatus =
  | "scheduled"
  | "ongoing"
  | "completed"
  | "cancelled";

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
  return typeof value === "object" && value !== null;
}

export function isUserDto(value: unknown): value is UserDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.email === "string"
  );
}

export function isSubjectDto(value: unknown): value is SubjectDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string"
  );
}

export function isStudyGroupDto(value: unknown): value is StudyGroupDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string"
  );
}

export function isStudySessionDto(
  value: unknown
): value is StudySessionDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.host_id === "number" &&
    (typeof value.study_group_id === "number" ||
      value.study_group_id === null) &&
    (typeof value.subject_id === "number" ||
      value.subject_id === null) &&
    typeof value.title === "string" &&
    typeof value.max_participants === "number" &&
    typeof value.scheduled_at === "string" &&
    typeof value.duration_minutes === "number" &&
    typeof value.status === "string"
  );
}

export function isMaterialDto(value: unknown): value is MaterialDto {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.group_id === "number" &&
    typeof value.uploaded_by === "number" &&
    typeof value.title === "string" &&
    typeof value.file_path === "string" &&
    typeof value.file_type === "string" &&
    typeof value.file_size === "number" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

export function getApiPayload<T>(
  payload: unknown,
  guard: (value: unknown) => value is T
): T[] {
  let items: unknown[] = [];

  if (Array.isArray(payload)) {
    items = payload;
  } else if (
    isRecord(payload) &&
    Array.isArray(payload.data)
  ) {
    items = payload.data;
  }

  return items.filter(guard);
}

export function parseUserDto(value: string): UserDto | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isUserDto(parsed) ? parsed : null;
  } catch {
    return null;
  }
}