export interface MaterialUser {
  id: number;
  name: string;
  email?: string;
  profile?: {
    avatar_url?: string | null;
  } | null;
}

export interface Material {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  user?: MaterialUser;
}
export interface MaterialsResponse {
  data: Material[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}
