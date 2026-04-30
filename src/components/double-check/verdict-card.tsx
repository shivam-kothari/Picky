"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Leaf,
  Drumstick,
  Apple,
  Info,
  HelpCircle,
  Maximize,
  MessagesSquare,
  Copy,
} from "lucide-react";

import { CRITERIA } from "@/lib/criteria";
import {
  applyOutcomeToItem,
  makeItemKey,
  buildInterrogatorPlan,
  pickFeaturedQuestion,
  type InterrogatorLanguage,
  type InterrogatorOutcome,
  type InterrogatorQuestion,
} from "@/lib/interrogator";
import {
  getInterrogatorLanguage,
  setInterrogatorLanguage,
} from "@/lib/interrogator-preferences";
import {
  getScanItemOutcomes,
  setScanItemOutcome,
} from "@/lib/scan-history";
import type { MenuItemVerdict, ScanVerdict } from "@/lib/scan";

import {
  InterrogatorPanel,
  LanguageSelector,
  OutcomeButtons,
  OutcomeBadge,
} from "./interrogator-panel";
import { InterrogatorFullscreen } from "./interrogator-fullscreen";

type VerdictCardProps = {
  result: ScanVerdict;
  entryId?: string;
  onScanAnother?: () => void;
  onScanAgain?: () => void;
};

type EffectiveItem = {
  original: MenuItemVerdict;
  effective: MenuItemVerdict;
  outcome: InterrogatorOutcome | null;
  index: number;
  key: string;
};

const labelsById = new Map(CRITERIA.map((criterion) => [criterion.id, criterion.label]));

function getIcon(id: string) {
  if (id === "vegan" || id === "vegetarian") return <Leaf className="h-4 w-4" />;
  if (id === "paleo") return <Drumstick className="h-4 w-4" />;
  if (id === "keto") return <Apple className="h-4 w-4" />;
  return <CheckCircle className="h-4 w-4" />;
}

export function VerdictCard({
  result,
  entryId,
  onScanAnother,
  onScanAgain,
}: VerdictCardProps) {
  const handleScanAnother = onScanAnother || onScanAgain;
  const isNoStandards = result.selectedCriteria.length === 0;

  const [outcomes, setOutcomes] = useState<
    Record<string, InterrogatorOutcome>
  >({});
  const [language, setLanguage] = useState<InterrogatorLanguage>("en");
  const [fullscreen, setFullscreen] = useState<{
    item: MenuItemVerdict;
    initialCriterionId?: string;
    itemKey: string;
  } | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setLanguage(getInterrogatorLanguage());
    }, 0);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!entryId) {
        setOutcomes({});
        return;
      }
      const stored = getScanItemOutcomes(entryId);
      const next: Record<string, InterrogatorOutcome> = {};
      for (const [key, record] of Object.entries(stored)) {
        next[key] = record.outcome;
      }
      setOutcomes(next);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [entryId, result]);

  const handleLanguageChange = (next: InterrogatorLanguage) => {
    setLanguage(next);
    setInterrogatorLanguage(next);
  };

  const handleOutcomeChange = (
    itemKey: string,
    nextOutcome: InterrogatorOutcome | null
  ) => {
    setOutcomes((current) => {
      const updated = { ...current };
      if (nextOutcome === null) {
        delete updated[itemKey];
      } else {
        updated[itemKey] = nextOutcome;
      }
      return updated;
    });

    if (entryId) {
      setScanItemOutcome(
        entryId,
        itemKey,
        nextOutcome,
        result.selectedCriteria
      );
    }
  };

  const effectiveItems: EffectiveItem[] = useMemo(() => {
    return result.items.map((item, index) => {
      const key = makeItemKey(item, index);
      const outcome = outcomes[key] ?? null;
      const effective = outcome ? applyOutcomeToItem(item, outcome) : item;
      return { original: item, effective, outcome, index, key };
    });
  }, [result.items, outcomes]);

  if (isNoStandards) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white border border-border p-6 rounded-2xl shadow-sm text-center">
          <Info className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            No Standards Selected
          </h2>
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

  const safeItems = effectiveItems.filter(
    (entry) => entry.effective.status === "SAFE"
  );
  const verifyItems = effectiveItems.filter(
    (entry) => entry.effective.status === "VERIFY"
  );
  const vetoedItems = effectiveItems.filter(
    (entry) => entry.effective.status === "VETOED"
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto pb-12">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Menu Analysis
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {result.summary}
        </p>
      </div>

      {result.selectedCriteria.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.selectedCriteria.map((id) => (
            <div
              key={id}
              className="px-3 py-1.5 border border-border bg-white rounded-full flex items-center gap-2 text-xs font-medium text-foreground"
            >
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
        <ItemSection
          title="Okay to Eat"
          Icon={CheckCircle}
          tone="safe"
          items={safeItems}
          selectedCriteria={result.selectedCriteria}
          language={language}
          onLanguageChange={handleLanguageChange}
          onOutcomeChange={handleOutcomeChange}
          onOpenFullscreen={(item, key, criterionId) =>
            setFullscreen({ item, itemKey: key, initialCriterionId: criterionId })
          }
        />
      )}

      {verifyItems.length > 0 && (
        <ItemSection
          title="Ask Waitstaff"
          Icon={HelpCircle}
          tone="verify"
          items={verifyItems}
          selectedCriteria={result.selectedCriteria}
          language={language}
          onLanguageChange={handleLanguageChange}
          onOutcomeChange={handleOutcomeChange}
          onOpenFullscreen={(item, key, criterionId) =>
            setFullscreen({ item, itemKey: key, initialCriterionId: criterionId })
          }
        />
      )}

      {vetoedItems.length > 0 && (
        <ItemSection
          title="Avoid"
          Icon={AlertTriangle}
          tone="vetoed"
          items={vetoedItems}
          selectedCriteria={result.selectedCriteria}
          language={language}
          onLanguageChange={handleLanguageChange}
          onOutcomeChange={handleOutcomeChange}
          onOpenFullscreen={(item, key, criterionId) =>
            setFullscreen({ item, itemKey: key, initialCriterionId: criterionId })
          }
        />
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

      {fullscreen && (
        <InterrogatorFullscreen
          item={fullscreen.item}
          selectedCriteriaIds={result.selectedCriteria}
          language={language}
          initialCriterionId={fullscreen.initialCriterionId}
          onLanguageChange={handleLanguageChange}
          onOutcomeChange={(outcome) =>
            handleOutcomeChange(fullscreen.itemKey, outcome)
          }
          onClose={() => setFullscreen(null)}
        />
      )}
    </div>
  );
}

type ItemSectionProps = {
  title: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "safe" | "verify" | "vetoed";
  items: EffectiveItem[];
  selectedCriteria: readonly string[];
  language: InterrogatorLanguage;
  onLanguageChange: (next: InterrogatorLanguage) => void;
  onOutcomeChange: (
    itemKey: string,
    outcome: InterrogatorOutcome | null
  ) => void;
  onOpenFullscreen: (
    item: MenuItemVerdict,
    itemKey: string,
    criterionId?: string
  ) => void;
};

function ItemSection({
  title,
  Icon,
  tone,
  items,
  selectedCriteria,
  language,
  onLanguageChange,
  onOutcomeChange,
  onOpenFullscreen,
}: ItemSectionProps) {
  const { groups, noQuestion } = useMemo(() => {
    const map = new Map<
      string,
      { question: InterrogatorQuestion; items: EffectiveItem[] }
    >();
    const noQ: EffectiveItem[] = [];

    items.forEach((entry) => {
      const showPanel =
        entry.effective.status !== "SAFE" || entry.outcome !== null;

      if (showPanel) {
        const plan = buildInterrogatorPlan(
          entry.original,
          selectedCriteria,
          language
        );
        const featured = pickFeaturedQuestion(plan);
        if (featured) {
          if (!map.has(featured.criterionId)) {
            map.set(featured.criterionId, { question: featured, items: [] });
          }
          map.get(featured.criterionId)!.items.push(entry);
          return;
        }
      }
      noQ.push(entry);
    });

    return { groups: Array.from(map.values()), noQuestion: noQ };
  }, [items, selectedCriteria, language]);

  const headingClass =
    tone === "safe"
      ? "text-secondary-foreground"
      : tone === "verify"
      ? "text-yellow-700"
      : "text-destructive";

  const cardClass =
    tone === "safe"
      ? "bg-secondary/20 border-secondary/30"
      : tone === "verify"
      ? "bg-yellow-50 border-yellow-200"
      : "bg-destructive/10 border-destructive/20";

  const dishNameClass =
    tone === "safe"
      ? "text-secondary-foreground"
      : tone === "verify"
      ? "text-yellow-900"
      : "text-destructive";

  const reasonClass =
    tone === "safe"
      ? "text-secondary-foreground/80"
      : tone === "verify"
      ? "text-yellow-800"
      : "text-destructive/80";

  return (
    <div className="space-y-3">
      <h3
        className={`text-xs font-bold tracking-widest uppercase flex items-center gap-2 ${headingClass}`}
      >
        <Icon className="h-4 w-4" /> {title}
      </h3>
      <div className="space-y-3">
        {groups.map((group) => (
          <GroupedQuestionCard
            key={group.question.criterionId}
            question={group.question}
            items={group.items}
            cardClass={cardClass}
            dishNameClass={dishNameClass}
            reasonClass={reasonClass}
            selectedCriteria={selectedCriteria}
            language={language}
            onLanguageChange={onLanguageChange}
            onOutcomeChange={onOutcomeChange}
            onOpenFullscreen={onOpenFullscreen}
          />
        ))}
        {noQuestion.map((entry) => (
          <ItemCard
            key={entry.key}
            entry={entry}
            cardClass={cardClass}
            dishNameClass={dishNameClass}
            reasonClass={reasonClass}
            selectedCriteria={selectedCriteria}
            language={language}
            onLanguageChange={onLanguageChange}
            onOutcomeChange={onOutcomeChange}
            onOpenFullscreen={onOpenFullscreen}
          />
        ))}
      </div>
    </div>
  );
}

type ItemCardProps = {
  entry: EffectiveItem;
  cardClass: string;
  dishNameClass: string;
  reasonClass: string;
  selectedCriteria: readonly string[];
  language: InterrogatorLanguage;
  onLanguageChange: (next: InterrogatorLanguage) => void;
  onOutcomeChange: (
    itemKey: string,
    outcome: InterrogatorOutcome | null
  ) => void;
  onOpenFullscreen: (
    item: MenuItemVerdict,
    itemKey: string,
    criterionId?: string
  ) => void;
};

function ItemCard({
  entry,
  cardClass,
  dishNameClass,
  reasonClass,
  selectedCriteria,
  language,
  onLanguageChange,
  onOutcomeChange,
  onOpenFullscreen,
}: ItemCardProps) {
  const { original, effective, outcome, key } = entry;
  const wasReclassified = outcome !== null && original.status !== effective.status;

  const handleOpenFullscreen = (question: InterrogatorQuestion) =>
    onOpenFullscreen(original, key, question.criterionId);

  return (
    <div className={`p-3 rounded-xl border ${cardClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-semibold text-sm ${dishNameClass}`}>
            {original.dishName}
          </p>
          <p className={`text-xs mt-1 ${reasonClass}`}>{original.reason}</p>
        </div>
        {wasReclassified && (
          <span className="shrink-0 rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Updated
          </span>
        )}
      </div>

      {effective.status !== "SAFE" || outcome !== null ? (
        <InterrogatorPanel
          item={original}
          selectedCriteriaIds={selectedCriteria}
          language={language}
          outcome={outcome}
          onLanguageChange={onLanguageChange}
          onOutcomeChange={(next) => onOutcomeChange(key, next)}
          onOpenFullscreen={handleOpenFullscreen}
        />
      ) : null}
    </div>
  );
}

function GroupedQuestionCard({
  question,
  items,
  cardClass,
  dishNameClass,
  reasonClass,
  selectedCriteria,
  language,
  onLanguageChange,
  onOutcomeChange,
  onOpenFullscreen,
}: {
  question: InterrogatorQuestion;
  items: EffectiveItem[];
  cardClass: string;
  dishNameClass: string;
  reasonClass: string;
  selectedCriteria: readonly string[];
  language: InterrogatorLanguage;
  onLanguageChange: (next: InterrogatorLanguage) => void;
  onOutcomeChange: (
    itemKey: string,
    outcome: InterrogatorOutcome | null
  ) => void;
  onOpenFullscreen: (
    item: MenuItemVerdict,
    itemKey: string,
    criterionId?: string
  ) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(question.question);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  return (
    <div className={`p-4 rounded-xl border ${cardClass}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-foreground">
          <MessagesSquare className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {question.criterionLabel} Check
          </span>
        </div>
        <LanguageSelector
          language={language}
          onLanguageChange={onLanguageChange}
        />
      </div>

      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-sm leading-snug text-foreground font-medium">
          {question.question}
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground bg-white/50"
          aria-label="Copy question"
        >
          {copied ? (
            <CheckCircle className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="space-y-2 mt-4 pt-4 border-t border-border/50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Applies to {items.length} dish{items.length === 1 ? "" : "es"}
        </p>
        {items.map((entry) => {
          const { original, effective, outcome, key } = entry;
          const wasReclassified =
            outcome !== null && original.status !== effective.status;

          return (
            <div
              key={key}
              className="bg-white/60 p-3 rounded-lg border border-border/40"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className={`font-semibold text-sm ${dishNameClass}`}>
                    {original.dishName}
                  </p>
                  <p className={`text-xs mt-0.5 ${reasonClass}`}>
                    {original.reason}
                  </p>
                </div>
                {wasReclassified && (
                  <span className="shrink-0 rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Updated
                  </span>
                )}
              </div>

              {outcome ? (
                <OutcomeBadge
                  outcome={outcome}
                  onClear={() => onOutcomeChange(key, null)}
                />
              ) : (
                <OutcomeButtons
                  onSelect={(out) => onOutcomeChange(key, out)}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
