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
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    auditLogs:          (page = 1, limit = 20) => `/admin/audit-logs?page=${page}&limit=${limit}`,
    users:              () => '/admin/users',
    userById:           (userId: string) => `/admin/users/${userId}`,
    settle:             (matchId: string) => `/admin/matches/${matchId}/settle`,
    settleCancellation: (matchId: string) => `/admin/matches/${matchId}/cancel`,
    commissionOverride: (userId: string) => `/admin/users/${userId}/commission`,
  },
} as const;
