export type MemberStatus = 'pending' | 'accepted' | 'rejected';
export type MemberRole = 'admin' | 'member';

export type Subject = {
  id: number;
  code?: string | null;
  name: string;
};

export type GroupMember = {
  id: number;
  study_group_id: number;
  user_id: number;
  role: MemberRole;
  status: MemberStatus;
  joined_at?: string | null;
  user?: {
    id: number;
    name: string;
    profile?: {
      avatar_url?: string | null;
    } | null;
  } | null;
};

export type Group = {
  id: number;
  creator_id: number;
  subject_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  max_members: number;
  is_private: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  creator?: {
    id: number;
    name: string;
    profile?: {
      avatar_url?: string | null;
    } | null;
  } | null;
  subject?: Subject | null;
  members?: GroupMember[];
};

export type GroupFormState = {
  name: string;
  subject_id: string;
  description: string;
  max_members: number;
  is_private: boolean;
};

export type SessionFormState = {
  title: string;
  description: string;
  meeting_link: string;
  date: string;
  time: string;
  max_participants: number;
  duration_minutes: number;
};

export type ApiMessage = {
  message?: string;
  errors?: Record<string, string[]>;
  data?: Group;
  user?: {
    id: number;
  };
};

export const emptyGroupForm: GroupFormState = {
  name: '',
  subject_id: '',
  description: '',
  max_members: 10,
  is_private: false,
};

export const emptySessionForm: SessionFormState = {
  title: '',
  description: '',
  meeting_link: '',
  date: '',
  time: '19:00',
  max_participants: 10,
  duration_minutes: 60,
};
