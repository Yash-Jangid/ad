// ─── App-Wide Route Constants ────────────────────────────────────────────────
// Single source of truth for all route strings.
// Import these wherever navigation is needed; never use raw string paths.

export const ROUTES = {
  // Public
  home: '/',

  // Auth group
  auth: {
    login: '/login',
    register: '/register',
  },

  // User group
  user: {
    dashboard:   '/dashboard',
    matches:     '/matches',
    matchDetail: (id: string) => `/matches/${id}`,
    predictions: '/predictions',
    leaderboard: '/leaderboard',
    ledger:      '/ledger',
    profile:     '/profile',
    myTeam:      '/my-team',
  },

  // Admin group
  admin: {
    root:      '/admin',
    matches:   '/admin/matches',
    users:     '/admin/users',
    auditLogs: '/admin/audit-logs',
  },
} as const;

// ─── Route Groups (for middleware / guards) ───────────────────────────────────
export const PROTECTED_ROUTES = [
  ROUTES.user.dashboard,
  ROUTES.user.matches,
  ROUTES.user.predictions,
  ROUTES.user.leaderboard,
  ROUTES.user.ledger,
  ROUTES.user.profile,
  ROUTES.user.myTeam,
  ROUTES.admin.root,
  ROUTES.admin.matches,
  ROUTES.admin.users,
  ROUTES.admin.auditLogs,
] as const;

export const ADMIN_ROUTES = [
  ROUTES.admin.root,
  ROUTES.admin.matches,
  ROUTES.admin.users,
  ROUTES.admin.auditLogs,
] as const;
