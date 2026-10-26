export interface Subject {
  id: number;
  name: string;
  code?: string;
}

export interface TutorSubject extends Subject {
  proficiency_level: string;
}

export interface Availability {
  id?: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_recurring?: boolean;
}

export interface Tutor {
  id: number;
  user_id: number;
  name: string;
  avatar_url?: string | null;
  bio?: string | null;
  hourly_rate: number;
  is_verified: boolean;
  rating_avg: number;
  reviews_count: number;
  format_online: boolean;
  format_offline: boolean;
  last_active_at?: string | null;
  subjects: TutorSubject[];
  availability: Availability[];
}

export interface TutorProfile {
  id: number;
  user_id: number;
  bio?: string | null;
  hourly_rate: number;
  status: "active" | "inactive";
  format_online: boolean;
  format_offline: boolean;
  subject_ids: number[];
  availability: Availability[];
}

export type RequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled";

export interface TutoringRequestRow {
  id: number;
  topic: string;
  notes?: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: RequestStatus;
  meeting_link?: string | null;
  session_format?: "online" | "offline" | null;
  location?: string | null;
  session_notes?: string | null;
  subject_name?: string;
  tutor_name?: string;
  student_name?: string;
  review_id?: number | null;
  review_rating?: number | null;
  review_comment?: string | null;
}

export type Tab = "search" | "requests" | "tutor";

export interface SessionForm {
  scheduled_at: string;
  duration_minutes: string;
  session_format: "online" | "offline";
  meeting_link: string;
  location: string;
  session_notes: string;
}

export interface ReviewForm {
  rating: number;
  comment: string;
}

export interface TutorReviewItem {
  id: number;
  rating: number;
  comment?: string | null;
  student?: {
    id: number;
    name: string;
  } | null;
  created_at?: string | null;
}

export interface TutorFilters {
  subject: string;
  format: string;
  day: string;
  time: string;
}
