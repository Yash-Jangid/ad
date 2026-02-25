
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  nextPage: number | null;
  prevPage: number | null;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginDto {
  identifier: string;
  password: string;
  recaptchaToken?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  referralCode?: string;
  recaptchaToken?: string;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
  canHaveChild: boolean;
  isActive: boolean;
  isBettingDisabled?: boolean;
  isUserCreationDisabled?: boolean;
  balance: number;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  level: number;
  commissionRate: number;
}

// ── Match ─────────────────────────────────────────────────────────────────────

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';

export interface Odds {
  teamAWin: number;
  teamBWin: number;
  draw: number;
  calculatedAt: string;
}

export interface Match {
  id: string;
  externalId: string;
  title: string;
  teamA: string;
  teamB: string;
  status: MatchStatus;
  startTime: string;
  odds: Odds;
  streamingUrl?: string;
  streamingProvider?: string;
  predictionsLocked: boolean;
  predictionCount: number;
  totalPool: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiveMatchScore {
  matchId: string;
  teamAScore?: string;
  teamBScore?: string;
  currentInnings?: number;
  overs?: string;
  status: MatchStatus;
  updatedAt: string;
}

// ── Prediction ────────────────────────────────────────────────────────────────

export type PredictionSide = 'BACK' | 'LAY';
export type PredictionTeam = 'A' | 'B' | 'DRAW';
export type PredictionStatus = 'PENDING' | 'WON' | 'LOST' | 'REFUNDED' | 'CANCELLED';
export type PredictionOutcome = 'TEAM_A_WIN' | 'TEAM_B_WIN' | 'DRAW';

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  amount: number;
  side: PredictionSide;
  outcome: PredictionOutcome;
  status: PredictionStatus;
  oddsAtPlacement: Odds;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  match?: Pick<Match, 'id' | 'title' | 'teamA' | 'teamB'>;
}

export interface PlacePredictionDto {
  matchId: string;
  amount: number;
  side: PredictionSide;
  outcome: PredictionOutcome;
  idempotencyKey: string;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  userId: string;
  name: string;
  username: string;
  totalPoints: number;
  rank: number;
}

export interface MyRankResponse {
  userId: string;
  rank: number | null;
  totalPoints: number;
}

// ── Ledger ────────────────────────────────────────────────────────────────────

export type LedgerEntryType = 'CREDIT' | 'DEBIT' | 'COMMISSION' | 'REFUND' | 'BONUS';

export interface LedgerEntry {
  id: string;
  userId: string;
  amount: number;
  type: LedgerEntryType;
  balanceAfter: number;
  referenceId?: string;
  description: string;
  createdAt: string;
}

export interface BalanceResponse {
  userId: string;
  balance: number;
  currency: 'POINTS';
}

/** Extended balance response including aggregate totals */
export interface LedgerBalance {
  userId: string;
  balance: number;
  totalCredits: number;
  totalDebits: number;
  currency: 'POINTS';
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  resource: string;
  action: string;
  statusCode: number;
  severity: AuditSeverity;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
}
