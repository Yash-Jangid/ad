'use client';

import React, { useState, useTransition } from 'react';
import { Users, Shield, Percent } from 'lucide-react';
import { Text } from '@/components/atoms/Text';
import { Icon } from '@/components/atoms/Icon';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { UserAvatar } from '@/components/molecules/UserAvatar';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { formatPoints, formatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import type { User } from '@/lib/api/types';

// ─── Commission editor ────────────────────────────────────────────────────────

function CommissionCell({ user, onSave }: { user: User; onSave: (userId: string, rate: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(user.role.commissionRate));
  const [isPending, start] = useTransition();

  const commit = () => {
    const rate = parseFloat(draft);
    if (isNaN(rate) || rate < 0 || rate > 100) return;
    start(async () => {
      await onSave(user.id, rate);
      setEditing(false);
    });
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="w-20 bg-background border border-primary/40 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          disabled={isPending}
          onClick={commit}
          className="text-xs px-2 py-1 rounded bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-50 transition-colors"
        >
          {isPending ? '…' : 'Save'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary transition-colors group"
      title="Click to edit commission"
    >
      <Icon icon={Percent} size={12} />
      {user.role.commissionRate}%
      <span className="opacity-0 group-hover:opacity-100 text-text-tertiary ml-1">(edit)</span>
    </button>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({ user, onCommissionSave }: { user: User; onCommissionSave: (userId: string, rate: number) => Promise<void> }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-background-secondary/50 transition-colors">
      <UserAvatar name={user.name} size="sm" />

      <div className="min-w-0">
        <Text variant="small" weight="medium" truncate>{user.name}</Text>
        <Text variant="caption" color="tertiary" truncate>{user.email}</Text>
      </div>

      <div className="flex items-center gap-1.5">
        <Icon icon={Shield} size={13} className="text-primary shrink-0" />
        <Text variant="caption" color="secondary">{user.role.name}</Text>
      </div>

      <Text variant="caption" className="font-mono text-right">{formatPoints(user.balance)} pts</Text>

      <CommissionCell user={user} onSave={onCommissionSave} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get<User[]>(ENDPOINTS.admin.users()),
    staleTime: 30_000,
  });

  const handleCommissionSave = async (userId: string, rate: number) => {
    await api.patch(ENDPOINTS.admin.commissionOverride(userId), { commissionRate: rate });
    void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const filtered = (users ?? []).filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <Text variant="h2" weight="bold">Manage Users</Text>
        <div className="flex items-center gap-2 text-text-tertiary">
          <Icon icon={Users} size={16} />
          <Text variant="caption" color="tertiary">{filtered.length} users</Text>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm bg-background-secondary border border-border rounded-lg px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:ring-2 focus:ring-primary/40 transition"
      />

      <section className="glass-card rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 px-4 py-2 border-b border-border bg-background-secondary">
          {['', 'Name / Email', 'Role', 'Balance', 'Commission'].map((h) => (
            <Text key={h} variant="caption" color="tertiary" weight="semibold">{h}</Text>
          ))}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Text variant="small" color="secondary">{search ? 'No users match your search.' : 'No users found.'}</Text>
          </div>
        ) : (
          filtered.map((u) => (
            <UserRow key={u.id} user={u} onCommissionSave={handleCommissionSave} />
          ))
        )}
      </section>
    </div>
  );
}
