'use client';

import React, { useCallback, useRef } from 'react';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Text } from '@/components/atoms/Text';
import { Icon } from '@/components/atoms/Icon';
import { VirtualizedList } from '@/components/organisms/VirtualizedList';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { SkeletonList } from '@/components/skeletons/SkeletonList';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { CONFIG } from '@/lib/constants/config';
import { formatPoints, formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import type { LedgerEntry, LedgerBalance } from '@/lib/api/types';

// ─── Query hooks (local to this page — no shared consumers) ──────────────────

const ledgerKeys = {
  balance: () => ['ledger', 'balance'] as const,
  history: () => ['ledger', 'history'] as const,
};

function useLedgerBalance() {
  return useQuery({
    queryKey: ledgerKeys.balance(),
    queryFn: () => api.get<LedgerBalance>(ENDPOINTS.ledger.myBalance()),
    staleTime: CONFIG.query.staleTime,
    refetchInterval: 30_000,
  });
}

function useLedgerHistory() {
  return useInfiniteQuery({
    queryKey: ledgerKeys.history(),
    queryFn: ({ pageParam = 1 }) =>
      api.get<{ data: LedgerEntry[]; nextPage: number | null }>(
        ENDPOINTS.ledger.myHistory(pageParam as number)
      ),
    getNextPageParam: (last) => last.nextPage ?? undefined,
    staleTime: CONFIG.query.staleTime,
    initialPageParam: 1,
  });
}

// ─── Transaction Row ─────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: LedgerEntry }) {
  const isCredit = tx.amount > 0;

  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border last:border-0 hover:bg-background-secondary/50 transition-colors">
      <div
        className={cn(
          'p-2 rounded-lg',
          isCredit ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
        )}
      >
        <Icon icon={isCredit ? ArrowDownLeft : ArrowUpRight} size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <Text variant="small" weight="medium" truncate>
          {tx.description}
        </Text>
        <Text variant="caption" color="tertiary">
          {formatDate(tx.createdAt)}
        </Text>
      </div>

      <div className="text-right">
        <Text
          variant="small"
          weight="semibold"
          className={isCredit ? 'text-success' : 'text-error'}
        >
          {isCredit ? '+' : ''}{formatPoints(tx.amount)}
        </Text>
        <Text variant="caption" color="tertiary">
          Bal: {formatPoints(tx.balanceAfter)}
        </Text>
      </div>
    </div>
  );
}

// ─── Balance Banner ───────────────────────────────────────────────────────────

function BalanceBanner({ balance }: { balance: LedgerBalance }) {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="p-4 rounded-xl bg-primary/10 text-primary">
          <Icon icon={Wallet} size={28} />
        </div>
        <div>
          <Text variant="caption" color="tertiary" className="uppercase tracking-wide font-semibold">
            Current Balance
          </Text>
          <Text variant="h2" weight="bold" className="font-mono mt-0.5">
            {formatPoints(balance.balance)} pts
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-success mb-0.5">
            <Icon icon={TrendingUp} size={14} />
            <Text variant="caption" color="success" weight="semibold">Total In</Text>
          </div>
          <Text variant="small" weight="semibold" className="font-mono">
            {formatPoints(balance.totalCredits)} pts
          </Text>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-error mb-0.5">
            <Icon icon={TrendingDown} size={14} />
            <Text variant="caption" color="error" weight="semibold">Total Out</Text>
          </div>
          <Text variant="small" weight="semibold" className="font-mono">
            {formatPoints(balance.totalDebits)} pts
          </Text>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LedgerPage() {
  const { data: balance, isLoading: balanceLoading } = useLedgerBalance();
  const {
    data: historyData,
    isLoading: historyLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLedgerHistory();

  // Flatten all pages into a single array for VirtualizedList
  const transactions: LedgerEntry[] = historyData?.pages.flatMap((p) => p.data) ?? [];

  // Load-more sentinel via IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const sentinelCallback = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (!node) return;
      observerRef.current = new IntersectionObserver(([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      });
      observerRef.current.observe(node);
      sentinelRef.current = node;
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Text variant="h2" weight="bold">Ledger</Text>

        {/* Balance Banner */}
        {balanceLoading ? (
          <SkeletonCard lines={2} />
        ) : balance ? (
          <BalanceBanner balance={balance} />
        ) : null}

        {/* Transaction History */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <Text variant="small" weight="semibold">Transaction History</Text>
          </div>

          {historyLoading ? (
            <div className="p-4">
              <SkeletonList />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center">
              <Text variant="small" color="secondary">No transactions yet.</Text>
            </div>
          ) : (
            <>
              <VirtualizedList
                items={transactions}
                estimateSize={72}
                renderItem={(tx) => <TxRow key={tx.id} tx={tx} />}
              />
              {/* Infinite scroll sentinel */}
              <div ref={sentinelCallback} className="h-1" aria-hidden="true" />
              {isFetchingNextPage && (
                <div className="py-3 text-center">
                  <Text variant="caption" color="tertiary">Loading more…</Text>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
