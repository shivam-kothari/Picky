import type { ScanVerdict } from "@/lib/scan";

const HISTORY_KEY = "dc:scan-history";
const MAX_ENTRIES = 20;

export type ScanHistoryEntry = {
  id: string;
  verdict: ScanVerdict;
  timestamp: number;
  feedback?: "positive" | "negative";
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadHistory(): ScanHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScanHistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: ScanHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full — silently degrade
  }
}

/** Add a scan verdict to persistent history. Returns the new entry's ID. */
export function addScanToHistory(verdict: ScanVerdict): string {
  const entries = loadHistory();
  const id = generateId();

  entries.unshift({ id, verdict, timestamp: Date.now() });

  // Keep only the last MAX_ENTRIES
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

/** Clear all scan history. */
export function clearScanHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // no-op
  }
}
