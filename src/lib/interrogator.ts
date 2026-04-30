import {
  CRITERIA,
  getCriterionById,
  type Criterion,
  type InterrogatorScript,
} from "@/lib/criteria";
import type { MenuItemVerdict, ScanStatus } from "@/lib/scan";

export type InterrogatorLanguage = keyof InterrogatorScript;

export type InterrogatorOutcome =
  | "confirmed_safe"
  | "uncertain"
  | "confirmed_violation";

export type InterrogatorPriority = "high" | "medium" | "low";

export type InterrogatorQuestion = {
  criterionId: string;
  criterionLabel: string;
  priority: InterrogatorPriority;
  question: string;
  reasonHint: string;
  isLikelyCause: boolean;
};

export const INTERROGATOR_LANGUAGES: readonly {
  id: InterrogatorLanguage;
  label: string;
  shortLabel: string;
}[] = [
  { id: "en", label: "English", shortLabel: "EN" },
  { id: "fr", label: "Français", shortLabel: "FR" },
  { id: "es", label: "Español", shortLabel: "ES" },
  { id: "hi", label: "हिन्दी", shortLabel: "HI" },
  { id: "zh", label: "中文", shortLabel: "ZH" },
  { id: "ja", label: "日本語", shortLabel: "JA" },
  { id: "ar", label: "العربية", shortLabel: "AR" },
];

const VALID_LANGUAGE_IDS = new Set<string>(
  INTERROGATOR_LANGUAGES.map((language) => language.id)
);

const UNCERTAINTY_CUES: readonly string[] = [
  "may",
  "might",
  "likely",
  "possibly",
  "could",
  "unknown",
  "shared",
  "stock",
  "verify",
  "ask",
  "uncertain",
  "unclear",
  "depends",
  "varies",
  "broth",
  "sauce",
  "marinade",
  "fryer",
  "garnish",
];

const PRIORITY_RANK: Record<InterrogatorPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const STATUS_RANK: Record<ScanStatus, number> = {
  VETOED: 0,
  VERIFY: 1,
  SAFE: 2,
};

export function isInterrogatorLanguage(
  value: unknown
): value is InterrogatorLanguage {
  return typeof value === "string" && VALID_LANGUAGE_IDS.has(value);
}

/**
 * Build the deterministic, ordered list of questions for a single dish.
 * The order is stable for identical inputs:
 * 1. By priority (high -> medium -> low)
 * 2. Likely-cause questions before unrelated ones
 * 3. Alphabetical by criterion label (deterministic tie-breaker)
 */
export function buildInterrogatorPlan(
  item: MenuItemVerdict,
  selectedCriteriaIds: readonly string[],
  language: InterrogatorLanguage = "en"
): InterrogatorQuestion[] {
  if (selectedCriteriaIds.length === 0) return [];

  const reason = (item.reason || "").toLowerCase();

  const criteria = Array.from(new Set(selectedCriteriaIds))
    .map(getCriterionById)
    .filter((criterion): criterion is Criterion => criterion !== undefined);

  if (criteria.length === 0) return [];

  const questions: InterrogatorQuestion[] = criteria.map((criterion) => {
    const isLikelyCause = isCriterionRelatedToReason(criterion, reason);
    const priority = computePriority(item.status, isLikelyCause, reason);
    return {
      criterionId: criterion.id,
      criterionLabel: criterion.label,
      priority,
      question: criterion.script[language] ?? criterion.script.en,
      reasonHint: buildReasonHint(criterion, item.status, isLikelyCause),
      isLikelyCause,
    };
  });

  return [...questions].sort((a, b) => {
    const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (priorityDelta !== 0) return priorityDelta;

    if (a.isLikelyCause !== b.isLikelyCause) {
      return a.isLikelyCause ? -1 : 1;
    }

    return a.criterionLabel.localeCompare(b.criterionLabel);
  });
}

/**
 * Apply a user-selected outcome to a dish to derive the effective verdict.
 * Pure: never mutates input. The original reason is preserved so the UI
 * can still surface why the dish was originally flagged.
 */
export function applyOutcomeToItem(
  item: MenuItemVerdict,
  outcome: InterrogatorOutcome
): MenuItemVerdict {
  switch (outcome) {
    case "confirmed_safe":
      return { ...item, status: "SAFE" };
    case "confirmed_violation":
      return { ...item, status: "VETOED" };
    case "uncertain":
      return { ...item, status: "VERIFY" };
  }
}

/**
 * Stable per-item key used for tracking outcomes across re-renders and
 * across re-mounts. Combines the array index with the dish name so two
 * dishes with identical names still get distinct keys.
 */
export function makeItemKey(item: MenuItemVerdict, index: number): string {
  const safeName = (item.dishName || "item").trim().toLowerCase();
  return `${index}::${safeName}`;
}

/**
 * Returns true when an item should surface the Interrogator UI by default.
 * SAFE items get an optional confirmation entry; VERIFY/VETOED items always
 * surface the panel.
 */
export function shouldShowInterrogator(item: MenuItemVerdict): boolean {
  return item.status === "VERIFY" || item.status === "VETOED";
}

/**
 * Returns the canonical question to feature first for a given item.
 * Useful for inline, compact UI surfaces.
 */
export function pickFeaturedQuestion(
  questions: readonly InterrogatorQuestion[]
): InterrogatorQuestion | null {
  return questions.length > 0 ? questions[0] : null;
}

/** Sort items deterministically: VETOED first, then VERIFY, then SAFE. */
export function sortItemsBySeverity(
  items: readonly MenuItemVerdict[]
): MenuItemVerdict[] {
  return [...items].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
}

function isCriterionRelatedToReason(
  criterion: Criterion,
  lowerReason: string
): boolean {
  if (!lowerReason) return false;
  const keywords = [
    ...criterion.unsafeIfPresent,
    ...criterion.hiddenRisks,
    ...criterion.uncertainIfPossible,
    criterion.label,
  ].map((keyword) => keyword.toLowerCase());

  return keywords.some(
    (keyword) => keyword.length > 0 && lowerReason.includes(keyword)
  );
}

function hasUncertaintyCue(lowerReason: string): boolean {
  return UNCERTAINTY_CUES.some((cue) => lowerReason.includes(cue));
}

function computePriority(
  status: ScanStatus,
  isLikelyCause: boolean,
  lowerReason: string
): InterrogatorPriority {
  if (status === "VETOED") {
    return isLikelyCause ? "high" : "medium";
  }

  if (status === "VERIFY") {
    if (isLikelyCause) return "high";
    if (hasUncertaintyCue(lowerReason)) return "high";
    return "medium";
  }

  return "low";
}

function buildReasonHint(
  criterion: Criterion,
  status: ScanStatus,
  isLikelyCause: boolean
): string {
  if (status === "SAFE") {
    return `Optional confirmation for ${criterion.label}`;
  }
  if (isLikelyCause) {
    return `Likely concern for ${criterion.label}`;
  }
  if (status === "VETOED") {
    return `Confirm ${criterion.label} compliance`;
  }
  return `Verify ${criterion.label} status`;
}

/** Defensive helper used by tests and history loaders. */
export function isKnownCriterionId(id: string): boolean {
  return CRITERIA.some((criterion) => criterion.id === id);
}
