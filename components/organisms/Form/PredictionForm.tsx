'use client';

import React, { useTransition } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Zap } from 'lucide-react';
import { Text } from '@/components/atoms/Text';
import { Icon } from '@/components/atoms/Icon';
import { placePredictionSchema, type PlacePredictionSchema } from '@/lib/utils/validators';
import { formatOdds, formatPoints } from '@/lib/utils/formatters';
import { IdempotencyManager } from '@/lib/utils/idempotency';
import { usePlacePrediction } from '@/lib/api/hooks/usePredictions';
import { cn } from '@/lib/utils/cn';
import type { Match } from '@/lib/api/types';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PredictionFormProps {
  match: Match;
  userBalance: number;
  onSuccess?: () => void;
}

type Side = 'BACK' | 'LAY';
type Outcome = 'TEAM_A_WIN' | 'TEAM_B_WIN' | 'DRAW';

// ─── Component ────────────────────────────────────────────────────────────────

export function PredictionForm({ match, userBalance, onSuccess }: PredictionFormProps) {
  const { mutate: placePrediction, isPending } = usePlacePrediction();
  const [, startTransition] = useTransition();

  const methods = useForm<PlacePredictionSchema>({
    resolver: zodResolver(placePredictionSchema),
    defaultValues: {
      matchId: match.id,
      side: 'BACK',
      outcome: 'TEAM_A_WIN',
      idempotencyKey: IdempotencyManager.getKey(`prediction-${match.id}`),
    },
  });

  const { watch, handleSubmit, reset } = methods;
  const [side, outcome, amount] = watch(['side', 'outcome', 'amount']);

  const selectedOdds = {
    TEAM_A_WIN: match.odds.teamAWin,
    TEAM_B_WIN: match.odds.teamBWin,
    DRAW:       match.odds.draw,
  }[outcome];

  const potentialReturn = amount && selectedOdds
    ? (amount * selectedOdds).toFixed(0)
    : '—';

  const onSubmit = handleSubmit((data) => {
    startTransition(() => {
      placePrediction(
        { matchId: data.matchId, amount: data.amount, side: data.side, outcome: data.outcome },
        {
          onSuccess: () => {
            toast.success('Prediction placed!', { description: `${formatPoints(data.amount)} staked on ${data.outcome}` });
            reset({ ...methods.getValues(), idempotencyKey: IdempotencyManager.getKey(`prediction-${match.id}-${Date.now()}`) });
            onSuccess?.();
          },
          onError: (err: Error) => {
            toast.error('Failed to place prediction', { description: err.message });
          },
        }
      );
    });
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>

        {/* Back / Lay toggle */}
        <div>
          <Text variant="caption" color="secondary" className="mb-2 uppercase tracking-wide font-medium">
            Position
          </Text>
          <div className="grid grid-cols-2 gap-2">
            {(['BACK', 'LAY'] as Side[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => methods.setValue('side', s)}
                className={cn(
                  'py-2 rounded-lg text-sm font-semibold border transition-all',
                  s === 'BACK' && side === 'BACK' && 'odds-back ring-1 ring-blue-500/50',
                  s === 'BACK' && side !== 'BACK' && 'border-border text-text-secondary hover:odds-back',
                  s === 'LAY'  && side === 'LAY'  && 'odds-lay ring-1 ring-pink-500/50',
                  s === 'LAY'  && side !== 'LAY'  && 'border-border text-text-secondary hover:odds-lay',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Outcome selection */}
        <div>
          <Text variant="caption" color="secondary" className="mb-2 uppercase tracking-wide font-medium">
            Outcome
          </Text>
          <div className="space-y-2">
            {([
              { key: 'TEAM_A_WIN' as Outcome, label: match.teamA, odds: match.odds.teamAWin },
              { key: 'TEAM_B_WIN' as Outcome, label: match.teamB, odds: match.odds.teamBWin },
              { key: 'DRAW'       as Outcome, label: 'Draw',      odds: match.odds.draw      },
            ] satisfies { key: Outcome; label: string; odds: number }[]).map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => methods.setValue('outcome', o.key)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all',
                  outcome === o.key
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border bg-background-secondary text-text-primary hover:border-primary/30'
                )}
              >
                <span className="font-medium">{o.label}</span>
                <span className="font-mono text-xs opacity-75">{formatOdds(o.odds)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Text variant="caption" color="secondary" className="uppercase tracking-wide font-medium">
              Stake (pts)
            </Text>
            <Text variant="caption" color="tertiary">
              Balance: {formatPoints(userBalance)}
            </Text>
          </div>
          <Controller
            name="amount"
            control={methods.control}
            render={({ field, fieldState }) => (
              <div>
                <input
                  {...field}
                  type="number"
                  min={1}
                  max={userBalance}
                  placeholder="Enter amount"
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-lg border bg-background-secondary text-sm font-mono',
                    'text-text-primary placeholder:text-text-tertiary',
                    'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30',
                    fieldState.error ? 'border-error' : 'border-border'
                  )}
                />
                {fieldState.error && (
                  <Text variant="caption" color="error" className="mt-1" role="alert">
                    {fieldState.error.message}
                  </Text>
                )}
              </div>
            )}
          />
        </div>

        {/* Potential return */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background-tertiary">
          <Text variant="caption" color="secondary">Potential return</Text>
          <Text variant="caption" weight="semibold" color="success" className="font-mono">
            {potentialReturn !== '—' ? formatPoints(Number(potentialReturn)) : '—'}
          </Text>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || match.predictionsLocked}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 rounded-lg',
            'font-semibold text-sm bg-primary text-primary-foreground',
            'hover:opacity-90 active:scale-[0.99] transition-all',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus-visible:ring-2 focus-visible:ring-primary'
          )}
        >
          <Icon icon={Zap} size={16} />
          {match.predictionsLocked
            ? 'Predictions locked'
            : isPending
              ? 'Placing…'
              : `Place ${side} • ${formatOdds(selectedOdds ?? 1)}`}
        </button>
      </form>
    </FormProvider>
  );
}
