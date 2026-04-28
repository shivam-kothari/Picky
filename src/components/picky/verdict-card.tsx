import { Card, CardContent } from "@/components/ui/card";
import { CRITERIA } from "@/lib/criteria";
import type { ScanVerdict } from "@/lib/scan";

type VerdictCardProps = {
  result: ScanVerdict;
};

const labelsById = new Map(CRITERIA.map((criterion) => [criterion.id, criterion.label]));

export function VerdictCard({ result }: VerdictCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="space-y-4 p-8">
        <div className="space-y-2">
          <p className="text-4xl font-bold tracking-[0.18em]">{result.status}</p>
          <p className="text-lg font-medium tracking-tight">{result.dishName}</p>
          <p className="text-sm uppercase tracking-[0.24em] text-foreground/60">
            Confidence: {result.confidence}
          </p>
        </div>

        <p className="text-sm leading-relaxed text-foreground/80">
          {result.primaryReason}
        </p>

        {result.summary && (
          <p className="text-sm leading-relaxed text-foreground/70">
            {result.summary}
          </p>
        )}

        <VerdictSection
          title="Triggered"
          items={result.triggeredCriteria.map((id) => labelsById.get(id) ?? id)}
        />
        <VerdictSection title="Hidden Risks" items={result.hiddenRisks} />
        <VerdictSection title="Visible Evidence" items={result.visibleEvidence} />
        <VerdictSection title="Missing Evidence" items={result.missingEvidence} />

        {result.waitstaffQuestion && (
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-[0.68rem] uppercase tracking-[0.24em] text-foreground/60">
              Ask
            </p>
            <p className="text-sm leading-relaxed text-foreground/85">
              {result.waitstaffQuestion}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function VerdictSection({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="border-t border-border pt-4">
      <p className="mb-3 text-[0.68rem] uppercase tracking-[0.24em] text-foreground/60">
        {title}
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-foreground/80">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
