'use client';

import React, { useState, useTransition } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Text } from '@/components/atoms/Text';
import { Icon } from '@/components/atoms/Icon';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { CONFIG } from '@/lib/constants/config';
import { formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import {
  syncMatchesAction,
  settleMatchAction,
  cancelSettlementAction,
} from '@/lib/actions/admin.actions';
import type { Match, MatchStatus } from '@/lib/api/types';

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<MatchStatus, string> = {
  UPCOMING:  'bg-info/10 text-info border-info/30',
  LIVE:      'bg-error/10 text-error border-error/30',
  COMPLETED: 'bg-success/10 text-success border-success/30',
  CANCELLED: 'bg-muted/20 text-muted-foreground border-muted/30',
};

function StatusBadge({ status }: { status: MatchStatus }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', STATUS_STYLES[status])}>
      {status}
    </span>
  );
}

// ─── Match row ────────────────────────────────────────────────────────────────

function MatchRow({ match, onRefresh }: { match: Match; onRefresh: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const run = (action: () => Promise<{ error?: string }>, label: string) => {
    startTransition(async () => {
      const result = await action();
      setFeedback(result.error ? `❌ ${result.error}` : `✅ ${label} success`);
      if (!result.error) onRefresh();
    });
  };

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-background-secondary/50 transition-colors">
      <div className="min-w-0">
        <Text variant="small" weight="semibold" truncate>{match.title}</Text>
        <Text variant="caption" color="tertiary">{formatDate(match.startTime)}</Text>
        {feedback && (
          <Text variant="caption" className="mt-0.5" color={feedback.startsWith('✅') ? 'success' : 'error'}>
            {feedback}
          </Text>
        )}
      </div>

      <StatusBadge status={match.status} />

      <div className="flex items-center gap-2">
        {(match.status === 'LIVE' || match.status === 'COMPLETED') ? (
          <button
            disabled={isPending}
            onClick={() => run(() => settleMatchAction(match.id), 'Settled')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-success/10 text-success border border-success/30 hover:bg-success/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon={CheckCircle} size={13} />
            Settle
          </button>
        ) : null}

        {match.status !== 'CANCELLED' ? (
          <button
            disabled={isPending}
            onClick={() => run(() => cancelSettlementAction(match.id), 'Cancelled')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-error/10 text-error border border-error/30 hover:bg-error/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon={XCircle} size={13} />
            Cancel
          </button>
        ) : null}
      </div>

      {isPending && <Icon icon={Clock} size={16} className="text-text-tertiary animate-spin" />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminMatchesPage() {
  const qc = useQueryClient();
  const [syncing, startSync] = useTransition();
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const { data: upcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ['admin', 'matches', 'upcoming'],
    queryFn: () => api.get<Match[]>(ENDPOINTS.matches.upcoming()),
    staleTime: CONFIG.query.staleTime,
  });

  const { data: live, isLoading: liveLoading } = useQuery({
    queryKey: ['admin', 'matches', 'live'],
    queryFn: () => api.get<Match[]>(ENDPOINTS.matches.live()),
    staleTime: CONFIG.query.liveStaleTime,
    refetchInterval: 15_000,
  });

  const allMatches = [...(live ?? []), ...(upcoming ?? [])];
  const isLoading = upcomingLoading || liveLoading;

  const handleSync = () => {
    startSync(async () => {
      const result = await syncMatchesAction();
      setSyncMsg(result.error ? `❌ ${result.error}` : '✅ Sync complete');
      void qc.invalidateQueries({ queryKey: ['admin', 'matches'] });
    });
  };

  const refresh = () => void qc.invalidateQueries({ queryKey: ['admin', 'matches'] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Text variant="h2" weight="bold">Manage Matches</Text>
        <div className="flex items-center gap-3">
          {syncMsg && <Text variant="caption" color={syncMsg.startsWith('✅') ? 'success' : 'error'}>{syncMsg}</Text>}
          <button
            disabled={syncing}
            onClick={handleSync}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Icon icon={RefreshCw} size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync from API'}
          </button>
        </div>
      </div>

      <section className="glass-card rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <Text variant="small" weight="semibold">All Matches</Text>
          <Text variant="caption" color="tertiary">{allMatches.length} total</Text>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
          </div>
        ) : allMatches.length === 0 ? (
          <div className="py-16 text-center">
            <Text variant="small" color="secondary">No matches. Click "Sync from API" to fetch.</Text>
          </div>
        ) : (
          allMatches.map((m) => <MatchRow key={m.id} match={m} onRefresh={refresh} />)
        )}
      </section>
    </div>
  );
}
