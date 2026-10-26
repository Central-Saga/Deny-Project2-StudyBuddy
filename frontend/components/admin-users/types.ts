import type { UserDto } from '@/types/api';

export type StatusFilter =
  | 'all'
  | 'active'
  | 'suspended';

export interface StatusTarget {
  user: UserDto;
  nextStatus:
    | 'active'
    | 'suspended';
}
