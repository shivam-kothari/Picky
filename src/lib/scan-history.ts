import type { InterrogatorOutcome } from "@/lib/interrogator";
import type { ScanVerdict } from "@/lib/scan";

const HISTORY_KEY = "dc:scan-history";
const MAX_ENTRIES = 20;

export type InterrogationRecord = {
  outcome: InterrogatorOutcome;
  criterionIds: string[];
  timestamp: number;
};

export type ScanHistoryEntry = {
  id: string;
  verdict: ScanVerdict;
  timestamp: number;
  feedback?: "positive" | "negative";
  itemOutcomes?: Record<string, InterrogationRecord>;
};

const VALID_OUTCOMES = new Set<InterrogatorOutcome>([
  "confirmed_safe",
  "uncertain",
  "confirmed_violation",
]);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadHistory(): ScanHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScanHistoryEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEntry);
  } catch {
    return [];
  }
}

function saveHistory(entries: ScanHistoryEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — silently degrade
  }
}

function normalizeEntry(entry: ScanHistoryEntry): ScanHistoryEntry {
  if (!entry.itemOutcomes) return entry;

  const cleaned: Record<string, InterrogationRecord> = {};
  for (const [key, value] of Object.entries(entry.itemOutcomes)) {
    if (
      value &&
      typeof value === "object" &&
      VALID_OUTCOMES.has(value.outcome) &&
      Array.isArray(value.criterionIds) &&
      typeof value.timestamp === "number"
    ) {
      cleaned[key] = value;
    }
  }

  return { ...entry, itemOutcomes: cleaned };
}

/** Add a scan verdict to persistent history. Returns the new entry's ID. */
export function addScanToHistory(verdict: ScanVerdict): string {
  const entries = loadHistory();
  const id = generateId();

  entries.unshift({ id, verdict, timestamp: Date.now() });

  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  saveHistory(entries);
  return id;
}

/** Get all scan history entries, newest first. */
export function getScanHistory(): ScanHistoryEntry[] {
  return loadHistory();
}

/** Get a single history entry by id. */
export function getScanHistoryEntry(
  entryId: string
): ScanHistoryEntry | undefined {
  return loadHistory().find((entry) => entry.id === entryId);
}

/** Set feedback on a history entry. */
export function setScanFeedback(
  entryId: string,
  feedback: "positive" | "negative"
): void {
  const entries = loadHistory();
  const entry = entries.find((e) => e.id === entryId);
  if (entry) {
    entry.feedback = feedback;
    saveHistory(entries);
  }
}

/**
 * Persist an interrogation outcome for a single item within a scan.
 * Pass `outcome: null` to clear a previously-stored outcome.
 */
export function setScanItemOutcome(
  entryId: string,
  itemKey: string,
  outcome: InterrogatorOutcome | null,
  criterionIds: readonly string[]
): void {
  const entries = loadHistory();
  const entry = entries.find((e) => e.id === entryId);
  if (!entry) return;

  const next: Record<string, InterrogationRecord> = {
    ...(entry.itemOutcomes ?? {}),
  };

  if (outcome === null) {
    delete next[itemKey];
  } else {
    next[itemKey] = {
      outcome,
      criterionIds: Array.from(new Set(criterionIds)),
      timestamp: Date.now(),
    };
  }

  entry.itemOutcomes = next;
  saveHistory(entries);
}

/** Read the current outcome map for an entry. */
export function getScanItemOutcomes(
  entryId: string
): Record<string, InterrogationRecord> {
  const entry = getScanHistoryEntry(entryId);
  return entry?.itemOutcomes ?? {};
}

/** Clear all scan history. */
export function clearScanHistory(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // no-op
  }
}
