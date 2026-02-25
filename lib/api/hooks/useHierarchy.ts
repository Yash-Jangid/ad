/**
 * useHierarchy — hooks for managing a user's downline team.
 * GET /hierarchy/tree        → paginated subtree (scoped to self)
 * POST /hierarchy/downline   → create a new downline user
 * POST /ledger/transfer      → top-up a downline user's points
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/stores/authStore';

// ── Types ──────────────────────────────────────────────────────────

export interface DownlineUser {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  depth: number;
  createdAt: string;
  role: { id: string; name: string; level: number; displayName: string };
}

export interface CreateDownlinePayload {
  username: string;
  email: string;
  password: string;
  roleId: string;
}

export interface TransferPayload {
  toUserId: string;
  amount: number;
  description?: string;
}

export interface TransferResult {
  fromBalance: number;
  toBalance: number;
}

// ── Hooks ──────────────────────────────────────────────────────────

/** Fetch the calling user's scoped downline subtree. */
export function useMyTeam(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['hierarchy', 'tree', page, limit],
    queryFn: () =>
      api.get<{ data: DownlineUser[]; meta: unknown }>(
        `/hierarchy/tree?page=${page}&limit=${limit}`,
      ),
    staleTime: 30_000,
  });
}

/** Create a new user directly under the current user. */
export function useCreateDownline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDownlinePayload) =>
      api.post('/hierarchy/downline', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hierarchy', 'tree'] }),
  });
}

/** Transfer points from the current user to a downline user. */
export function useTransferPoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferPayload) =>
      api.post<TransferResult>('/ledger/transfer', payload),
    onSuccess: (data) => {
      // Instantly update the global auth store for zero-delay UI feedback
      const user = useAuthStore.getState().user;
      if (user) {
        useAuthStore.getState().setUser({ ...user, balance: data.fromBalance });
      }

      qc.invalidateQueries({ queryKey: ['hierarchy', 'tree'] });
      qc.invalidateQueries({ queryKey: ['ledger', 'balance'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
