"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  HelpCircle,
  ShieldCheck,
  ShieldX,
  X,
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

type InterrogatorFullscreenProps = {
  item: MenuItemVerdict;
  selectedCriteriaIds: readonly string[];
  language: InterrogatorLanguage;
  initialCriterionId?: string;
  onLanguageChange: (language: InterrogatorLanguage) => void;
  onOutcomeChange: (outcome: InterrogatorOutcome | null) => void;
  onClose: () => void;
};

export function InterrogatorFullscreen({
  item,
  selectedCriteriaIds,
  language,
  initialCriterionId,
  onLanguageChange,
  onOutcomeChange,
  onClose,
}: InterrogatorFullscreenProps) {
  const questions = useMemo(
    () => buildInterrogatorPlan(item, selectedCriteriaIds, language),
    [item, selectedCriteriaIds, language]
  );

  const initialIndex = useMemo(() => {
    if (!initialCriterionId) return 0;
    const found = questions.findIndex(
      (q) => q.criterionId === initialCriterionId
    );
    return found === -1 ? 0 : found;
  }, [initialCriterionId, questions]);

  const [rawActiveIndex, setRawActiveIndex] = useState(initialIndex);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const safeActiveIndex =
    questions.length === 0
      ? 0
      : Math.min(Math.max(0, rawActiveIndex), questions.length - 1);

  const active: InterrogatorQuestion | undefined = questions[safeActiveIndex];
  const currentKey = active ? `${active.criterionId}-${language}` : "";
  const isCopied = currentKey !== "" && copiedKey === currentKey;

  const goPrev = () =>
    setRawActiveIndex((index) => Math.max(0, index - 1));
  const goNext = () =>
    setRawActiveIndex((index) =>
      Math.min(questions.length - 1, index + 1)
    );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") goPrev();
      if (event.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, questions.length]);

  if (!active) {
    return null;
  }

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(active.question);
      const key = currentKey;
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current));
      }, 1600);
    } catch {
      // silently degrade
    }
  };

  const handleOutcome = (outcome: InterrogatorOutcome) => {
    onOutcomeChange(outcome);
    onClose();
  };

  const canPrev = safeActiveIndex > 0;
  const canNext = safeActiveIndex < questions.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Show this question to your waiter"
      className="fixed inset-0 z-[120] flex flex-col bg-black text-white"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            Show waiter
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">
            {item.dishName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        role="radiogroup"
        aria-label="Question language"
        className="mt-4 flex items-center gap-2 overflow-x-auto px-5"
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
                "shrink-0 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest transition-colors",
                isActive
                  ? "bg-white text-black"
                  : "border border-white/20 text-white/70 hover:bg-white/10"
              )}
            >
              {option.shortLabel}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${active.criterionId}-${language}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
            }}
            exit={{
              opacity: 0,
              y: -16,
              transition: { duration: 0.18 },
            }}
            className="max-w-2xl text-center"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/60">
              {active.criterionLabel}
            </p>
            <p
              className="mt-6 text-3xl font-semibold leading-snug text-white sm:text-4xl"
              dir={language === "ar" ? "rtl" : "ltr"}
            >
              {active.question}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-3 px-5">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canPrev}
          aria-label="Previous question"
          className="rounded-full bg-white/10 p-3 text-white transition-opacity disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          {questions.map((q, index) => (
            <span
              key={q.criterionId}
              aria-hidden="true"
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                index === safeActiveIndex ? "bg-white" : "bg-white/30"
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={!canNext}
          aria-label="Next question"
          className="rounded-full bg-white/10 p-3 text-white transition-opacity disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-6">
        <button
          type="button"
          onClick={handleCopy}
          className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20"
        >
          {isCopied ? (
            <>
              <Check className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy text
            </>
          )}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <FullscreenOutcomeButton
            tone="positive"
            Icon={ShieldCheck}
            label="Safe"
            onClick={() => handleOutcome("confirmed_safe")}
          />
          <FullscreenOutcomeButton
            tone="neutral"
            Icon={HelpCircle}
            label="Not sure"
            onClick={() => handleOutcome("uncertain")}
          />
          <FullscreenOutcomeButton
            tone="negative"
            Icon={ShieldX}
            label="Restricted"
            onClick={() => handleOutcome("confirmed_violation")}
          />
        </div>
      </div>
    </div>
  );
}

function FullscreenOutcomeButton({
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
      ? "bg-white text-black hover:bg-white/90"
      : tone === "negative"
      ? "bg-red-500 text-white hover:bg-red-500/90"
      : "border border-white/30 bg-transparent text-white hover:bg-white/10";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-semibold transition-colors",
        toneClass
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
