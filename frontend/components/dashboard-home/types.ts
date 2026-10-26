export type Subject = {
  id?: number;
  name?: string | null;
};

export type MemberUser = {
  id?: number;
  name?: string | null;
};

export type GroupMember = {
  id?: number;
  user_id?: number;
  role?: string | null;
  status?: string | null;
  user?: MemberUser | null;
};

export type StudyGroup = {
  id: number;
  creator_id?: number;
  subject_id?: number;
  name: string;
  slug?: string;
  description?: string | null;
  max_members?: number;
  is_private?: boolean;
  subject?: Subject | null;
  members?: GroupMember[];
};

export type StudySession = {
  id: number;
  host_id?: number;
  study_group_id?: number;
  subject_id?: number;

  title: string;
  description?: string | null;
  meeting_link?: string | null;

  max_participants?: number;
  participants_count?: number;

  scheduled_at?: string | null;
  duration_minutes?: number;

  status?: string | null;

  study_group?: {
    id?: number;
    name?: string | null;
    slug?: string | null;
  } | null;

  subject?: Subject | null;
};

export type StudySessionResponse = {
  message?: string;
  data?: StudySession[];
};
