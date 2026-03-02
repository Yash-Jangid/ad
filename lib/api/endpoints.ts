// ─── Centralized API Endpoint Registry ──────────────────────────────────────
// Single source of truth for ALL backend paths.
// No URL string should ever appear raw inside a component, hook, or Server Action.
// Usage: api.get(ENDPOINTS.matches.upcoming())

export const ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    login:    () => '/auth/login',
    register: () => '/auth/register',
    refresh:  () => '/auth/refresh',
    logout:   () => '/auth/logout',
    me:       () => '/auth/me',
  },

  // ── Matches ───────────────────────────────────────────────────────────────
  matches: {
    upcoming: () => '/matches/upcoming',
    live:     () => '/matches/live',
    byId:     (id: string) => `/matches/${id}`,
    sync:     () => '/matches/sync',
    /** SSE endpoint — use api.sse(), not api.get(). Pass the match ID. */
    sse:      (id: string) => `/matches/${id}/stream`,
  },

  // ── Predictions ───────────────────────────────────────────────────────────
  predictions: {
    place:   () => '/predictions',
    my:      (page = 1, limit = 20) => `/predictions/my?page=${page}&limit=${limit}`,
    byMatch: (matchId: string) => `/predictions/match/${matchId}`,
  },

  // ── Leaderboard ───────────────────────────────────────────────────────────
  leaderboard: {
    top:    (limit = 50) => `/leaderboard?limit=${limit}`,
    myRank: () => '/leaderboard/my-rank',
  },

  // ── Ledger ────────────────────────────────────────────────────────────────
  ledger: {
    myBalance: () => '/ledger/balance',
    myHistory: (page = 1, limit = 20) => `/ledger/history?page=${page}&limit=${limit}`,
    downlineHistory: (page = 1, limit = 50) => `/ledger/downline-history?page=${page}&limit=${limit}`,
    adminTopUp: () => '/ledger/admin/top-up',
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    auditLogs: (params?: Record<string, string | number | undefined>) => {
      if (!params) return '/admin/audit-logs';
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') query.append(key, String(value));
      });
      const qs = query.toString();
      return qs ? `/admin/audit-logs?${qs}` : '/admin/audit-logs';
    },
    users:              () => '/admin/users',
    userById:           (userId: string) => `/admin/users/${userId}`,
    settle:             (matchId: string) => `/admin/matches/${matchId}/settle`,
    settleCancellation: (matchId: string) => `/admin/matches/${matchId}/cancel`,
    commissionOverride: (userId: string) => `/admin/users/${userId}/commission`,
    roles:              () => `/admin/roles`,
    roleById:           (roleId: string) => `/admin/roles/${roleId}`,
    rolesActive:        () => `/admin/roles/active`,
  },

  // ── Hierarchy ─────────────────────────────────────────────────────────────
  hierarchy: {
    promote: (userId: string) => `/hierarchy/${userId}/promote`,
    demote:  (userId: string) => `/hierarchy/${userId}/demote`,
    tree:    () => `/hierarchy/tree`,
  }
} as const;
