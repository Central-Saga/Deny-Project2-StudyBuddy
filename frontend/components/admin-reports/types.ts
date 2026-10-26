export type ReportStatus =
  | 'pending'
  | 'reviewed'
  | 'dismissed'
  | 'action_taken';

export type StatusFilter = 'all' | ReportStatus;

export interface SimpleUser {
  id: number;
  name: string;
  email: string;
}

export interface ReportMaterial {
  id: number;
  user_id: number;
  title: string;
  description?: string | null;
  subject?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  is_removed?: boolean;
  deleted_at?: string | null;
  uploader?: SimpleUser | null;
}

export interface MaterialReport {
  id: number;
  material_id: number;
  reporter_id: number;
  reason: string;
  status: ReportStatus;
  resolution_note?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  material?: ReportMaterial | null;
  reporter?: SimpleUser | null;
  reviewer?: SimpleUser | null;
}

export interface UpdateTarget {
  report: MaterialReport;
  status: ReportStatus;
  resolutionNote: string;
}

export interface RemoveTarget {
  report: MaterialReport;
  resolutionNote: string;
}

export interface RestoreTarget {
  report: MaterialReport;
  resolutionNote: string;
}
