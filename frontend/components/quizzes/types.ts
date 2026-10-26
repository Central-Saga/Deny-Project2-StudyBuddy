export interface QuizOption {
  id: number;
  option_text: string;
  is_correct?: boolean;
}
export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  points: number;
  order: number;
  options: QuizOption[];
}
export interface Quiz {
  id: number;
  creator_id: number;
  subject_id?: number | null;
  title: string;
  description?: string | null;
  duration_minutes?: number | null;
  max_attempts?: number | null;
  pass_score: number;
  is_published?: boolean;
  subject_name?: string | null;
  creator_name?: string | null;
  question_count: number;
  attempt_count?: number;
  attempts_used?: number;
  attempts_remaining?: number | null;
  has_in_progress_attempt?: boolean;
  can_attempt?: boolean;
  can_manage?: boolean;
  questions: QuizQuestion[];
}
export interface QuestionDraft {
  question_text: string;
  question_type: QuizQuestion['question_type'];
  points: number;
  options: { option_text: string; is_correct: boolean }[];
}
export interface QuizForm {
  title: string;
  description: string;
  duration_minutes: string;
  pass_score: string;
  max_attempts: string;
  subject_id: string;
}
export interface QuizReviewItem {
  question_id: number;
  question_text: string;
  question_type: QuizQuestion['question_type'];
  points: number;
  user_answer: {
    option_id?: number | null;
    option_text?: string | null;
    answer_text?: string | null;
  };
  correct_answer?: {
    option_id: number;
    option_text: string;
  } | null;
  is_correct: boolean | null;
  points_awarded: number;
}
export interface QuizResult {
  score: number;
  passed: boolean;
  earned_points: number;
  total_points: number;
  max_attempts: number | null;
  attempts_used: number;
  attempts_remaining: number | null;
  can_attempt: boolean;
  review: QuizReviewItem[];
}

export type QuizAnswers = Record<number, { optionId?: number; answerText?: string }>;
