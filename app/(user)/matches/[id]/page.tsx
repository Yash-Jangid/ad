'use client';

import React, { use } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { LiveScoreboard } from '@/components/features/match/LiveScoreboard';
import { PredictionForm } from '@/components/organisms/Form/PredictionForm';
import { Text } from '@/components/atoms/Text';
import { SkeletonCard } from '@/components/skeletons/SkeletonCard';
import { useMatchById } from '@/lib/api/hooks/useMatches';
import { useAuthStore } from '@/lib/stores/authStore';
import { formatDate } from '@/lib/utils/formatters';

interface MatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = use(params);
  const { data: match, isLoading } = useMatchById(id);
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={3} />
          </div>
          <SkeletonCard lines={6} hasFooter />
        </div>
      </DashboardLayout>
    );
  }

  if (!match) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Text variant="small" color="secondary">Match not found.</Text>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Text variant="h2" weight="bold">{match.title}</Text>
          <Text variant="small" color="secondary" className="mt-1">
            {match.teamA} vs {match.teamB} · {formatDate(match.startTime)}
          </Text>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Live scoreboard + match info */}
          <div className="lg:col-span-2 space-y-4">
            <LiveScoreboard match={match} />

            {/* Match metadata */}
            <div className="glass-card rounded-xl p-4 space-y-2">
              <Text variant="caption" color="secondary" className="uppercase tracking-wide font-medium">
                Match Info
              </Text>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <Text variant="caption" color="tertiary">Status</Text>
                  <Text variant="small" weight="medium">{match.status}</Text>
                </div>
                <div>
                  <Text variant="caption" color="tertiary">Predictions</Text>
                  <Text variant="small" weight="medium">{match.predictionCount.toLocaleString()}</Text>
                </div>
              </div>
            </div>
          </div>

          {/* Prediction form */}
          <div className="glass-card rounded-xl p-5">
            <Text variant="h4" weight="semibold" className="mb-4">Place Prediction</Text>
            {user ? (
              <PredictionForm match={match} userBalance={user.balance} />
            ) : (
              <Text variant="small" color="secondary">Sign in to place a prediction.</Text>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
