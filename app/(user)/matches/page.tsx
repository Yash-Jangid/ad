'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { MatchCard, MatchCardSkeleton } from '@/components/features/match/MatchCard';
import { SearchBar } from '@/components/molecules/SearchBar';
import { Text } from '@/components/atoms/Text';
import { useUpcomingMatches, useLiveMatches } from '@/lib/api/hooks/useMatches';

export default function MatchesPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'live' | 'upcoming'>('all');

  const { data: live, isLoading: liveLoading } = useLiveMatches();
  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingMatches();

  const allMatches = [
    ...(filter !== 'upcoming' ? (live ?? []) : []),
    ...(filter !== 'live'     ? (upcoming ?? []) : []),
  ].filter(
    (m) =>
      !search ||
      m.teamA.toLowerCase().includes(search.toLowerCase()) ||
      m.teamB.toLowerCase().includes(search.toLowerCase()) ||
      m.title.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = liveLoading || upcomingLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Text variant="h2" weight="bold" className="flex-1">Matches</Text>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search teams or match…"
            className="sm:w-64"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2" role="tablist" aria-label="Match filter">
          {(['all', 'live', 'upcoming'] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <MatchCardSkeleton key={i} />)
            : allMatches.length > 0
              ? allMatches.map((m) => <MatchCard key={m.id} match={m} />)
              : (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-center glass-card rounded-2xl border-dashed border-2 border-border/50">
                    <Text variant="small" color="secondary">
                      {search ? 'No matches found for your search.' : 'No matches available.'}
                    </Text>
                  </div>
                )
          }
        </div>
      </div>
    </DashboardLayout>
  );
}
