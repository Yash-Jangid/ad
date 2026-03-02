'use client';

import React, { useState } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, RefreshCw, Coins,
  TrendingUp, TrendingDown, Trophy, RotateCcw, BadgeDollarSign,
  type LucideIcon,
} from 'lucide-react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Text } from '@/components/atoms/Text';
import { Icon } from '@/components/atoms/Icon';
import { useDownlineLedger, type LedgerEntry } from '@/lib/api/hooks/useDownlineLedger';
import { formatPoints } from '@/lib/utils/formatters';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/cn';

// ── Helpers ────────────────────────────────────────────────────────────────────

const TX_TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon; cls: string; credit: boolean }> = {
  CREDIT:     { label: 'Credit',     icon: ArrowDownLeft,     cls: 'text-emerald-400 bg-emerald-400/10', credit: true  },
  DEBIT:      { label: 'Debit',      icon: ArrowUpRight,      cls: 'text-red-400 bg-red-400/10',         credit: false },
  WIN:        { label: 'Win',        icon: Trophy,            cls: 'text-yellow-400 bg-yellow-400/10',   credit: true  },
  REFUND:     { label: 'Refund',     icon: RotateCcw,         cls: 'text-cyan-400 bg-cyan-400/10',       credit: true  },
  COMMISSION: { label: 'Commission', icon: BadgeDollarSign,   cls: 'text-violet-400 bg-violet-400/10',   credit: true  },
  BET:        { label: 'Bet',        icon: Coins,             cls: 'text-orange-400 bg-orange-400/10',   credit: false },
};

const TX_FILTER_TYPES = ['ALL', 'CREDIT', 'DEBIT', 'WIN', 'REFUND', 'COMMISSION', 'BET'];

function getTypeConfig(type: string) {
  return TX_TYPE_CONFIG[type] ?? { label: type, icon: Coins, cls: 'text-text-secondary bg-background-tertiary', credit: true };
}

// ── Row Component ────────────────────────────────────────────────────────────────

function TxRow({ tx }: { tx: LedgerEntry }) {
  const cfg = getTypeConfig(tx.type);

  return (
    <tr className="hover:bg-background-tertiary/30 transition-colors group border-b border-border/40">
      <td className="px-4 py-3">
        <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold', cfg.cls)}>
          <Icon icon={cfg.icon} size={12} />
          {cfg.label}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className={cn('font-mono text-sm font-semibold', cfg.credit ? 'text-emerald-400' : 'text-red-400')}>
          {cfg.credit ? '+' : '-'}{formatPoints(Math.abs(Number(tx.amount)))} pts
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">{formatPoints(Number(tx.balanceAfter))} pts</td>
      <td className="px-4 py-3">
        <Text variant="caption" color="secondary" className="max-w-xs truncate" title={tx.description ?? undefined}>
          {tx.description || '—'}
        </Text>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-tertiary whitespace-nowrap">
        {tx.userId.slice(0, 8)}…
      </td>
      <td className="px-4 py-3 font-mono text-xs text-text-tertiary whitespace-nowrap">
        {format(new Date(tx.createdAt), 'MMM dd, HH:mm')}
      </td>
    </tr>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const { data, isLoading, error, refetch } = useDownlineLedger(page);

  const transactions: LedgerEntry[] = (data?.data ?? []).filter(
    tx => typeFilter === 'ALL' || tx.type === typeFilter
  );

  // Summary stats from current page
  const totalIn  = (data?.data ?? []).filter(t => getTypeConfig(t.type).credit).reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = (data?.data ?? []).filter(t => !getTypeConfig(t.type).credit).reduce((s, t) => s + Number(t.amount), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <Text variant="h2" weight="bold">Global Transactions</Text>
            <Text variant="caption" color="secondary" className="mt-0.5">
              All financial activity across your entire downline
            </Text>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary bg-background-secondary border border-border rounded-lg hover:bg-background-tertiary transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={cn(isLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-400/10 text-emerald-400">
              <TrendingDown size={20} />
            </div>
            <div>
              <Text variant="caption" color="secondary" className="uppercase tracking-wider font-semibold">Total In (Page)</Text>
              <Text variant="body" weight="bold" className="font-mono text-emerald-400">+{formatPoints(totalIn)} pts</Text>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-400/10 text-red-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <Text variant="caption" color="secondary" className="uppercase tracking-wider font-semibold">Total Out (Page)</Text>
              <Text variant="body" weight="bold" className="font-mono text-red-400">-{formatPoints(totalOut)} pts</Text>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Coins size={20} />
            </div>
            <div>
              <Text variant="caption" color="secondary" className="uppercase tracking-wider font-semibold">Total Entries</Text>
              <Text variant="body" weight="bold" className="font-mono">{data?.meta?.total ?? '—'}</Text>
            </div>
          </div>
        </div>

        {/* ── Table Panel ── */}
        <div className="glass-card rounded-2xl overflow-hidden flex flex-col">

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-background-tertiary/50 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {TX_FILTER_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                    typeFilter === t
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-background text-text-secondary border border-border hover:bg-background-tertiary'
                  )}
                >
                  {t === 'ALL' ? 'All Types' : t}
                </button>
              ))}
            </div>
            <Text variant="caption" color="secondary">
              Page {page} of {data?.meta?.totalPages ?? '?'}
            </Text>
          </div>

          {/* Table */}
          <div className="overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-background-tertiary text-xs uppercase text-text-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Balance After</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr><td colSpan={6} className="p-8 text-center text-text-secondary">Loading…</td></tr>
                )}
                {error && !isLoading && (
                  <tr><td colSpan={6} className="p-8 text-center text-error">Failed to load transactions.</td></tr>
                )}
                {!isLoading && transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <Text color="secondary">No transactions found.</Text>
                    </td>
                  </tr>
                )}
                {!isLoading && transactions.map(tx => (
                  <TxRow key={tx.id} tx={tx} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-3 border-t border-border bg-background-tertiary flex items-center justify-between text-sm text-text-secondary">
            <span>Showing {transactions.length} of {data?.meta?.total ?? 0} entries</span>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 bg-background hover:bg-background-tertiary border border-border rounded disabled:opacity-50 transition-colors"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >Prev</button>
              <span className="font-mono">{page}</span>
              <button
                className="px-3 py-1 bg-background hover:bg-background-tertiary border border-border rounded disabled:opacity-50 transition-colors"
                disabled={!data?.meta?.hasNextPage}
                onClick={() => setPage(p => p + 1)}
              >Next</button>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
