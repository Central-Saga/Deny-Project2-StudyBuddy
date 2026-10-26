export type PrivacyFilter =
  | 'all'
  | 'public'
  | 'private';

export interface GroupCreator {
  id: number;
  name: string;
  email: string;
}

export interface GroupSubject {
  id: number;
  code?: string | null;
  name: string;
}

export interface GroupMemberStats {
  accepted: number;
  pending: number;
  rejected: number;
  group_admins: number;
}

export interface AdminGroup {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  max_members: number;
  is_private: boolean;
  privacy: 'public' | 'private';
  creator?: GroupCreator | null;
  subject?: GroupSubject | null;
  member_stats: GroupMemberStats;
  sessions_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AdminGroupMember {
  id: number;

  user?: {
    id: number;
    name: string;
    email: string;
  } | null;

  role: string;
  status: string;
  joined_at?: string | null;
}

export interface AdminGroupSession {
  id: number;
  host_id: number;
  title: string;
  scheduled_at?: string | null;
  created_at?: string | null;
}

export interface AdminGroupDetail
  extends Omit<
    AdminGroup,
    'sessions_count'
  > {
  members: AdminGroupMember[];
  sessions: AdminGroupSession[];
}
