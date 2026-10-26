export type QuizFilter =
  | 'all'
  | 'published'
  | 'unpublished'
  | 'admin_disabled';

export interface QuizSubject {
  id: number | null;
  name: string | null;
  code: string | null;
}

export interface QuizCreator {
  id: number;
  name: string | null;
  email: string | null;
}

export interface AdminQuizListItem {
  id: number;
  creator_id: number;
  subject_id: number | null;
  title: string;
  slug: string;
  description?: string | null;
  duration_minutes?: number | null;
  max_attempts?: number | null;
  pass_score: number;
  is_published: boolean;
  is_admin_disabled: boolean;
  admin_disabled_at?: string | null;
  admin_disabled_by?: number | null;
  admin_disabled_reason?: string | null;
  admin_disabled_was_published?: boolean | null;
  moderator_name?: string | null;
  subject: QuizSubject;
  creator: QuizCreator;
  question_count: number;
  attempt_count: number;
  completed_attempt_count: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface QuizOption {
  id: number;
  option_text: string;
  is_correct: boolean;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: string;
  points: number;
  order: number;
  options: QuizOption[];
}

export interface AttemptSummary {
  total: number;
  completed: number;
  in_progress: number;
  timed_out: number;
  average_score: number | null;
}

export interface AdminQuizDetail
  extends Omit<
    AdminQuizListItem,
    | 'moderator_name'
    | 'attempt_count'
    | 'completed_attempt_count'
  > {
  moderator?: {
    id: number;
    name: string | null;
    email: string | null;
  } | null;
  questions: QuizQuestion[];
  attempt_summary: AttemptSummary;
}

export interface DisableTarget {
  id: number;
  title: string;
}

export interface RestoreTarget {
  id: number;
  title: string;
  previousPublished:
    | boolean
    | null
    | undefined;
}
