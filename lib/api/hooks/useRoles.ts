/**
 * useRoles — fetches all active roles from GET /roles.
 * Used in the Create Downline modal to render a role selector.
 */
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  level: number;
  canHaveChild: boolean;
  isActive: boolean;
}

export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get<Role[]>('/admin/roles/active'),
    staleTime: 5 * 60_000, // roles change rarely
  });
}
