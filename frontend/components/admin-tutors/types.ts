export type VerificationFilter =
  | 'all'
  | 'verified'
  | 'unverified';

export type TutorStatusFilter =
  | 'all'
  | 'active'
  | 'inactive';

export interface TutorSubject {
  id: number;
  name: string;
  code?: string | null;
  proficiency_level?: string | null;
}

export interface TutorListItem {
  id: number;
  user_id: number;
  name: string;
  email: string;
  bio?: string | null;
  hourly_rate: number;
  is_verified: boolean;
  status: string;
  account_status?: string | null;
  rating_avg: number;
  reviews_count: number;
  format_online: boolean;
  format_offline: boolean;
  avatar_url?: string | null;
  university?: string | null;
  major?: string | null;
  verified_by?: number | null;
  verified_at?: string | null;
  verifier_name?: string | null;
  created_at?: string | null;
  subjects: TutorSubject[];
}

export interface TutorAvailability {
  id?: number;
  tutor_profile_id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring?: boolean;
}

export interface TutorDetail extends TutorListItem {
  profile?: {
    avatar_url?: string | null;
    phone_number?: string | null;
    university?: string | null;
    major?: string | null;
    github_url?: string | null;
    linkedin_url?: string | null;
  } | null;
  verifier?: {
    id: number;
    name: string;
    email: string;
  } | null;
  availability: TutorAvailability[];
  requests?: {
    pending: number;
    accepted: number;
    completed: number;
    cancelled: number;
  };
  last_active_at?: string | null;
}
