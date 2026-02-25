import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { CONFIG } from '@/lib/constants/config';
import type { Match, LiveMatchScore } from '@/lib/api/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const matchKeys = {
  all:      () => ['matches'] as const,
  upcoming: () => ['matches', 'upcoming'] as const,
  live:     () => ['matches', 'live'] as const,
  byId:     (id: string) => ['matches', id] as const,
  liveScore:(id: string) => ['matches', id, 'live'] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** Upcoming matches — refreshes every 30s */
export const useUpcomingMatches = () =>
  useQuery({
    queryKey: matchKeys.upcoming(),
    queryFn:  async () => {
      const data = await api.get<Match[]>(ENDPOINTS.matches.upcoming());
      // Guard: backend returns a plain array; if shape is wrong, return empty
      return Array.isArray(data) ? data : [];
    },
    staleTime: CONFIG.query.staleTime,
    refetchInterval: 60_000,
  });

/** Live matches — refreshes every 10s while window is focused */
export const useLiveMatches = () =>
  useQuery({
    queryKey: matchKeys.live(),
    queryFn:  async () => {
      const data = await api.get<Match[]>(ENDPOINTS.matches.live());
      return Array.isArray(data) ? data : [];
    },
    staleTime: CONFIG.query.liveStaleTime,
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });

/** Single match detail */
export const useMatchById = (id: string) =>
  useQuery({
    queryKey: matchKeys.byId(id),
    queryFn:  () => api.get<Match>(ENDPOINTS.matches.byId(id)),
    staleTime: CONFIG.query.liveStaleTime,
    enabled: !!id,
  });

/**
 * Live score subscription via SSE.
 * Opens an EventSource connection and pushes data directly into React Query cache.
 * Returns the cached live score data.
 */
export const useLiveScore = (matchId: string) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!matchId) return;

    const source = api.sse(ENDPOINTS.matches.sse(matchId));

    source.onmessage = (e: MessageEvent<string>) => {
      try {
        const score = JSON.parse(e.data) as LiveMatchScore;
        // Only update cache if this SSE event is for our match
        if (score.matchId === matchId) {
          qc.setQueryData(matchKeys.liveScore(matchId), score);
        }
      } catch {
        // Malformed SSE event — ignore
      }
    };

    source.onerror = () => {
      // SSE connection lost — EventSource auto-reconnects
    };

    return () => source.close();
  }, [matchId, qc]);

  return useQuery<LiveMatchScore>({
    queryKey: matchKeys.liveScore(matchId),
    // No queryFn — data is populated by the SSE effect above
    enabled: false,
  });
};
