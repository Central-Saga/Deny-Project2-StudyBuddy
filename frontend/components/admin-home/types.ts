export interface DashboardStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  total_groups: number;
  total_sessions: number;
  total_materials: number;
  total_quizzes: number;
  published_quizzes: number;
  total_tutors: number;
  verified_tutors: number;
  total_material_reports: number;
  pending_material_reports: number;
}

export const EMPTY_STATS: DashboardStats = {
  total_users: 0,
  active_users: 0,
  suspended_users: 0,
  total_groups: 0,
  total_sessions: 0,
  total_materials: 0,
  total_quizzes: 0,
  published_quizzes: 0,
  total_tutors: 0,
  verified_tutors: 0,
  total_material_reports: 0,
  pending_material_reports: 0,
};

export interface MetricItem {
  label: string;
  value: number;
  helper: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  accent: string;
}

export interface DistributionItem {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  barClass: string;
}
