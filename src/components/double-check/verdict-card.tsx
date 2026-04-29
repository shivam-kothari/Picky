import { AlertTriangle, CheckCircle, Leaf, Drumstick, Apple, Info, HelpCircle, Maximize } from "lucide-react";
import { CRITERIA } from "@/lib/criteria";
import type { ScanVerdict } from "@/lib/scan";

type VerdictCardProps = {
  result: ScanVerdict;
  onScanAnother?: () => void;
  onScanAgain?: () => void;
};

const labelsById = new Map(CRITERIA.map((criterion) => [criterion.id, criterion.label]));

function getIcon(id: string) {
  if (id === "vegan" || id === "vegetarian") return <Leaf className="h-4 w-4" />;
  if (id === "paleo") return <Drumstick className="h-4 w-4" />;
  if (id === "keto") return <Apple className="h-4 w-4" />;
  return <CheckCircle className="h-4 w-4" />;
}

export function VerdictCard({ result, onScanAnother, onScanAgain }: VerdictCardProps) {
  const handleScanAnother = onScanAnother || onScanAgain;
  const isNoStandards = result.selectedCriteria.length === 0;

  if (isNoStandards) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white border border-border p-6 rounded-2xl shadow-sm text-center">
          <Info className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Standards Selected</h2>
          <p className="text-muted-foreground">{result.summary}</p>
        </div>
        {handleScanAnother && (
          <button
            onClick={handleScanAnother}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  const safeItems = result.items.filter((item) => item.status === "SAFE");
  const vetoedItems = result.items.filter((item) => item.status === "VETOED");
  const verifyItems = result.items.filter((item) => item.status === "VERIFY");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto pb-12">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Menu Analysis</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{result.summary}</p>
      </div>

      {result.selectedCriteria.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.selectedCriteria.map((id) => (
            <div key={id} className="px-3 py-1.5 border border-border bg-white rounded-full flex items-center gap-2 text-xs font-medium text-foreground">
              {getIcon(id)}
              <span>{labelsById.get(id) || id}</span>
            </div>
          ))}
        </div>
      )}

      {result.items.length === 0 && (
        <div className="p-4 bg-muted text-center rounded-xl text-muted-foreground">
          No menu items were detected in the image.
        </div>
      )}

      {safeItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-secondary-foreground tracking-widest uppercase flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Okay to Eat
          </h3>
          <div className="space-y-2">
            {safeItems.map((item, i) => (
              <div key={i} className="bg-secondary/20 border border-secondary/30 p-3 rounded-xl">
                <p className="font-semibold text-secondary-foreground text-sm">{item.dishName}</p>
                <p className="text-xs text-secondary-foreground/80 mt-1">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {verifyItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-yellow-700 tracking-widest uppercase flex items-center gap-2">
            <HelpCircle className="h-4 w-4" /> Ask Waitstaff
          </h3>
          <div className="space-y-2">
            {verifyItems.map((item, i) => (
              <div key={i} className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
                <p className="font-semibold text-yellow-900 text-sm">{item.dishName}</p>
                <p className="text-xs text-yellow-800 mt-1">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {vetoedItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-destructive tracking-widest uppercase flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Avoid
          </h3>
          <div className="space-y-2">
            {vetoedItems.map((item, i) => (
              <div key={i} className="bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
                <p className="font-semibold text-destructive text-sm">{item.dishName}</p>
                <p className="text-xs text-destructive/80 mt-1">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {handleScanAnother && (
        <div className="sticky bottom-20 mt-8 pt-4 pb-6 z-10 bg-background/95 backdrop-blur-md -mx-6 px-6 shadow-[0_-20px_20px_-15px_rgba(255,255,255,1)]">
          <button
            onClick={handleScanAnother}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
          >
            <Maximize className="h-5 w-5" />
            Scan Another Page
          </button>
        </div>
      )}
    </div>
  );
}
