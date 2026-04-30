import {
  isInterrogatorLanguage,
  type InterrogatorLanguage,
} from "@/lib/interrogator";

const LANGUAGE_KEY = "dc:interrogator-language";

const DEFAULT_LANGUAGE: InterrogatorLanguage = "en";

export function getInterrogatorLanguage(): InterrogatorLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const raw = window.localStorage.getItem(LANGUAGE_KEY);
    if (raw && isInterrogatorLanguage(raw)) {
      return raw;
    }
  } catch {
    // localStorage unavailable — fall through to default
  }
  return DEFAULT_LANGUAGE;
}

export function setInterrogatorLanguage(language: InterrogatorLanguage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // localStorage unavailable — silently degrade
  }
}
