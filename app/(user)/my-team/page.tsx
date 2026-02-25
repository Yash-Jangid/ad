'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, UserPlus, Zap, Shield, CheckCircle, XCircle, ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Text } from '@/components/atoms/Text';
import { Icon } from '@/components/atoms/Icon';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { CreateDownlineModal } from '@/components/features/hierarchy/CreateDownlineModal';
import { TopUpModal } from '@/components/features/hierarchy/TopUpModal';
import { useMyTeam, type DownlineUser } from '@/lib/api/hooks/useHierarchy';
import { formatPoints } from '@/lib/utils/formatters';
import { useAuthStore } from '@/lib/stores/authStore';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

// ── Sub-components ────────────────────────────────────────────────────────────

function RoleBadge({ name, level }: { name: string; level: number }) {
  const colors: Record<number, string> = {
    0: 'bg-red-500/10 text-red-400 border-red-500/20',
    1: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    2: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    3: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    4: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const colorCls = colors[level] ?? 'bg-primary/10 text-primary border-primary/20';
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', colorCls)}>
      <Icon icon={Shield} size={10} />
      {name}
    </span>
  );
}

interface TeamRowProps {
  node: DownlineUser;
  onTopUp: (userId: string, username: string) => void;
}

function TeamRow({ node, onTopUp }: TeamRowProps) {
  const { id, username, email, role, isActive, depth } = node;
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-4 py-3 border-b border-border last:border-0',
        'hover:bg-background-tertiary/40 transition-colors',
      )}
      style={{ paddingLeft: `${(depth - 1) * 16 + 16}px` }}
    >
      {/* Avatar */}
      <div className="h-9 w-9 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Text variant="small" weight="semibold" className="truncate">{username}</Text>
          <RoleBadge name={role.name} level={role.level} />
          {isActive ? (
            <Icon icon={CheckCircle} size={12} className="text-success" />
          ) : (
            <Icon icon={XCircle} size={12} className="text-error" />
          )}
        </div>
        <Text variant="caption" color="tertiary" className="truncate">{email}</Text>
      </div>

      {/* Depth indicator */}
      <div className="hidden sm:flex items-center gap-1 text-text-tertiary">
        {Array.from({ length: depth - 1 }).map((_, i) => (
          <Icon key={i} icon={ChevronRight} size={12} />
        ))}
        <Text variant="caption" color="tertiary">L{depth}</Text>
      </div>

      {/* Top-Up button */}
      <button
        onClick={() => onTopUp(id, username)}
        className={cn(
          'shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium',
          'bg-primary/10 text-primary border border-primary/20',
          'hover:bg-primary hover:text-white transition-all duration-200',
        )}
      >
        <Icon icon={Zap} size={12} />
        Top-Up
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyTeamPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  
  // Guard: if user does not have permission to have a team, redirect to dashboard
  useEffect(() => {
    if (user && !user.canHaveChild) {
      router.replace(ROUTES.user.dashboard);
    }
  }, [user, router]);

  const { data, isLoading, error } = useMyTeam();
  const [showCreate, setShowCreate] = useState(false);
  const [topUpTarget, setTopUpTarget] = useState<{ userId: string; username: string } | null>(null);

  const members: DownlineUser[] = (data as { data?: DownlineUser[] } | undefined)?.data ?? [];

  // Don't render the page wrapper while determining unauthorized status
  if (user && !user.canHaveChild) {
    return null; // The useEffect will handle the redirect
  }

  const handleTopUp = (userId: string, username: string) => {
    setTopUpTarget({ userId, username });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Text variant="h2" weight="bold">My Team</Text>
            <Text variant="small" color="secondary" className="mt-1">
              Your direct and indirect downline members
            </Text>
          </div>
          <button
            id="add-team-member-btn"
            onClick={() => setShowCreate(true)}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold',
              'bg-primary text-white shadow-lg shadow-primary/20',
              'hover:opacity-90 active:scale-95 transition-all duration-200',
            )}
          >
            <Icon icon={UserPlus} size={16} />
            Add Member
          </button>
        </div>

        {/* Team count stat */}
        <div className="glass-card rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon icon={Users} size={20} className="text-primary" />
          </div>
          <div>
            <Text variant="caption" color="secondary">Total Team Members</Text>
            <Text variant="h4" weight="bold">
              {isLoading ? '…' : members.length}
            </Text>
          </div>
        </div>

        {/* Team list */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex items-center justify-between">
            <Text variant="small" weight="semibold">Team Members</Text>
            <Text variant="caption" color="tertiary">
              Indented by hierarchy depth
            </Text>
          </div>

          {isLoading && (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} lines={1} />
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="p-8 text-center">
              <Text color="secondary">Failed to load team. Please refresh.</Text>
            </div>
          )}

          {!isLoading && !error && members.length === 0 && (
            <div className="p-8 text-center space-y-3">
              <Icon icon={Users} size={40} className="text-text-tertiary mx-auto" />
              <Text color="secondary">No team members yet.</Text>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
              >
                <Icon icon={UserPlus} size={14} />
                Add your first member
              </button>
            </div>
          )}

          {!isLoading && members.map((node) => (
            <TeamRow
              key={node.id}
              node={node}
              onTopUp={handleTopUp}
            />
          ))}
        </section>
      </div>

      {/* Modals */}
      <CreateDownlineModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
      {topUpTarget && (
        <TopUpModal
          open={!!topUpTarget}
          onClose={() => setTopUpTarget(null)}
          targetUserId={topUpTarget.userId}
          targetUsername={topUpTarget.username}
        />
      )}
    </DashboardLayout>
  );
}
