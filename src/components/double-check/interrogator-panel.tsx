"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  HelpCircle,
  MessagesSquare,
  ShieldCheck,
  ShieldX,
  XCircle,
} from "lucide-react";

import {
  INTERROGATOR_LANGUAGES,
  buildInterrogatorPlan,
  type InterrogatorLanguage,
  type InterrogatorOutcome,
  type InterrogatorQuestion,
} from "@/lib/interrogator";
import type { MenuItemVerdict } from "@/lib/scan";
import { cn } from "@/lib/utils";

type InterrogatorPanelProps = {
  item: MenuItemVerdict;
  selectedCriteriaIds: readonly string[];
  language: InterrogatorLanguage;
  outcome: InterrogatorOutcome | null;
  onLanguageChange: (language: InterrogatorLanguage) => void;
  onOutcomeChange: (outcome: InterrogatorOutcome | null) => void;
  onOpenFullscreen: (question: InterrogatorQuestion) => void;
  variant?: "default" | "compact";
};

const OUTCOME_LABEL: Record<InterrogatorOutcome, string> = {
  confirmed_safe: "Confirmed safe",
  uncertain: "Not sure",
  confirmed_violation: "Contains restricted",
};

export function InterrogatorPanel({
  item,
  selectedCriteriaIds,
  language,
  outcome,
  onLanguageChange,
  onOutcomeChange,
  onOpenFullscreen,
  variant = "default",
}: InterrogatorPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const questions = useMemo(
    () => buildInterrogatorPlan(item, selectedCriteriaIds, language),
    [item, selectedCriteriaIds, language]
  );

  if (questions.length === 0) return null;

  const featured = questions[0];
  const remaining = questions.slice(1);
  const isCompact = variant === "compact";

  const handleCopy = async (id: string, text: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1600);
    } catch {
      // Clipboard write blocked — silently degrade.
    }
  };

  return (
    <div
      className={cn(
        "mt-3 rounded-xl border border-border bg-white",
        isCompact ? "p-3" : "p-4"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <MessagesSquare className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Ask waitstaff
          </span>
        </div>

        <LanguageSelector
          language={language}
          onLanguageChange={onLanguageChange}
        />
      </div>

      {outcome ? (
        <OutcomeBadge
          outcome={outcome}
          onClear={() => onOutcomeChange(null)}
        />
      ) : (
        <FeaturedQuestion
          question={featured}
          isCopied={copiedId === featured.criterionId}
          onCopy={() => handleCopy(featured.criterionId, featured.question)}
          onOpenFullscreen={() => onOpenFullscreen(featured)}
        />
      )}

      {!outcome && remaining.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            aria-expanded={expanded}
          >
            {expanded ? (
              <>
                Hide other questions <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Show {remaining.length} more question{remaining.length === 1 ? "" : "s"}{" "}
                <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.ul
                key="more-questions"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 space-y-2 overflow-hidden"
              >
                {remaining.map((question) => (
                  <li
                    key={question.criterionId}
                    className="rounded-lg border border-border bg-muted/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {question.criterionLabel}
                        </p>
                        <p className="mt-1 text-sm leading-snug text-foreground">
                          {question.question}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(question.criterionId, question.question)
                        }
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        aria-label={`Copy ${question.criterionLabel} question`}
                      >
                        {copiedId === question.criterionId ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenFullscreen(question)}
                      className="mt-2 text-[11px] font-semibold text-primary hover:underline"
                    >
                      Show this to waiter
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      {!outcome && (
        <OutcomeButtons
          onSelect={(value) => {
            onOutcomeChange(value);
            setExpanded(false);
          }}
        />
      )}
    </div>
  );
}

function FeaturedQuestion({
  question,
  isCopied,
  onCopy,
  onOpenFullscreen,
}: {
  question: InterrogatorQuestion;
  isCopied: boolean;
  onCopy: () => void;
  onOpenFullscreen: () => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {question.criterionLabel}
            </p>
            {question.isLikelyCause && (
              <span className="rounded-full border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-destructive-foreground">
                Likely cause
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-snug text-foreground">
            {question.question}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Copy question"
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-primary" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenFullscreen}
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Show this to waiter
      </button>
    </div>
  );
}

function LanguageSelector({
  language,
  onLanguageChange,
}: {
  language: InterrogatorLanguage;
  onLanguageChange: (language: InterrogatorLanguage) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Question language"
      className="-mr-1 flex max-w-[60%] items-center gap-1 overflow-x-auto"
    >
      {INTERROGATOR_LANGUAGES.map((option) => {
        const isActive = option.id === language;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onLanguageChange(option.id)}
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {option.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

function OutcomeButtons({
  onSelect,
}: {
  onSelect: (outcome: InterrogatorOutcome) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <OutcomeButton
        tone="positive"
        Icon={ShieldCheck}
        label="Safe"
        onClick={() => onSelect("confirmed_safe")}
      />
      <OutcomeButton
        tone="neutral"
        Icon={HelpCircle}
        label="Not sure"
        onClick={() => onSelect("uncertain")}
      />
      <OutcomeButton
        tone="negative"
        Icon={ShieldX}
        label="Restricted"
        onClick={() => onSelect("confirmed_violation")}
      />
    </div>
  );
}

function OutcomeButton({
  tone,
  Icon,
  label,
  onClick,
}: {
  tone: "positive" | "neutral" | "negative";
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  const toneClass =
    tone === "positive"
      ? "border-secondary/40 bg-secondary/30 text-secondary-foreground hover:bg-secondary/50"
      : tone === "negative"
      ? "border-destructive/30 bg-destructive/10 text-destructive-foreground hover:bg-destructive/20"
      : "border-border bg-muted/50 text-foreground hover:bg-muted";
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-semibold transition-colors",
        toneClass
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function OutcomeBadge({
  outcome,
  onClear,
}: {
  outcome: InterrogatorOutcome;
  onClear: () => void;
}) {
  const tone =
    outcome === "confirmed_safe"
      ? "border-secondary/40 bg-secondary/30 text-secondary-foreground"
      : outcome === "confirmed_violation"
      ? "border-destructive/30 bg-destructive/10 text-destructive-foreground"
      : "border-border bg-muted/40 text-foreground";

  const Icon =
    outcome === "confirmed_safe"
      ? ShieldCheck
      : outcome === "confirmed_violation"
      ? ShieldX
      : HelpCircle;

  return (
    <div
      className={cn(
        "mt-3 flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
        tone
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold">
          {OUTCOME_LABEL[outcome]} (logged)
        </span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground/70 hover:text-foreground"
        aria-label="Clear outcome"
      >
        <XCircle className="h-3.5 w-3.5" />
        Undo
      </button>
    </div>
  );
}
