import { Text } from '@/components/atoms/Text';

export default function TreasuryPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Text variant="h3" className="font-semibold text-text-primary">
          Treasury
        </Text>
        <Text variant="body" color="secondary" className="mt-1">
          Root platform point distribution and general ledger.
        </Text>
      </div>

      <div className="flex items-center justify-center p-12 border border-dashed border-border rounded-xl">
        <Text color="secondary">Treasury module coming soon.</Text>
      </div>
    </div>
  );
}
