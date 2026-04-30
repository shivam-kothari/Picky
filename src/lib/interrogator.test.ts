import { describe, expect, it } from "vitest";

import {
  applyOutcomeToItem,
  buildInterrogatorPlan,
  isInterrogatorLanguage,
  makeItemKey,
  pickFeaturedQuestion,
  shouldShowInterrogator,
  sortItemsBySeverity,
  type InterrogatorLanguage,
} from "./interrogator";
import type { MenuItemVerdict } from "./scan";

const baseItem: MenuItemVerdict = {
  dishName: "Spicy Tuna Roll",
  status: "VETOED",
  reason: "Contains shrimp paste in the sauce.",
};

describe("buildInterrogatorPlan", () => {
  it("returns no questions when no criteria are selected", () => {
    expect(buildInterrogatorPlan(baseItem, [])).toEqual([]);
  });

  it("ignores unknown criterion ids without throwing", () => {
    const result = buildInterrogatorPlan(baseItem, ["does-not-exist"]);
    expect(result).toEqual([]);
  });

  it("returns one question per known criterion", () => {
    const result = buildInterrogatorPlan(baseItem, [
      "no-shellfish",
      "no-peanuts",
    ]);
    const ids = result.map((q) => q.criterionId);
    expect(ids.sort()).toEqual(["no-peanuts", "no-shellfish"]);
  });

  it("orders likely-cause questions ahead of unrelated ones for the same status", () => {
    const result = buildInterrogatorPlan(baseItem, [
      "no-peanuts",
      "no-shellfish",
    ]);
    expect(result[0].criterionId).toBe("no-shellfish");
    expect(result[0].isLikelyCause).toBe(true);
    expect(result[0].priority).toBe("high");
  });

  it("uses requested language when available", () => {
    const result = buildInterrogatorPlan(
      baseItem,
      ["no-shellfish"],
      "fr"
    );
    expect(result[0].question).toMatch(/fruits de mer/i);
  });

  it("falls back to English when an unsupported language is passed at the type boundary", () => {
    const fakeLanguage = "xx" as unknown as InterrogatorLanguage;
    const result = buildInterrogatorPlan(
      baseItem,
      ["no-shellfish"],
      fakeLanguage
    );
    expect(result[0].question).toMatch(/shellfish/i);
  });

  it("is deterministic for the same input", () => {
    const a = buildInterrogatorPlan(baseItem, ["no-shellfish", "no-peanuts"]);
    const b = buildInterrogatorPlan(baseItem, ["no-peanuts", "no-shellfish"]);
    expect(a).toEqual(b);
  });

  it("classifies SAFE items as low priority across all criteria", () => {
    const safeItem: MenuItemVerdict = {
      dishName: "Garden Salad",
      status: "SAFE",
      reason: "All listed ingredients are plant based.",
    };
    const result = buildInterrogatorPlan(safeItem, ["vegan", "no-gluten"]);
    expect(result.every((q) => q.priority === "low")).toBe(true);
  });

  it("boosts VERIFY items with uncertainty cues to high priority", () => {
    const verifyItem: MenuItemVerdict = {
      dishName: "Miso Soup",
      status: "VERIFY",
      reason: "Broth may contain bonito flakes.",
    };
    const result = buildInterrogatorPlan(verifyItem, ["no-shellfish"]);
    expect(result[0].priority).toBe("high");
  });

  it("dedupes repeated criterion ids in the input", () => {
    const result = buildInterrogatorPlan(baseItem, [
      "no-shellfish",
      "no-shellfish",
    ]);
    expect(result.length).toBe(1);
  });
});

describe("applyOutcomeToItem", () => {
  it("does not mutate the original item", () => {
    const before = { ...baseItem };
    applyOutcomeToItem(baseItem, "confirmed_safe");
    expect(baseItem).toEqual(before);
  });

  it("transforms status to SAFE on confirmed_safe", () => {
    const result = applyOutcomeToItem(baseItem, "confirmed_safe");
    expect(result.status).toBe("SAFE");
    expect(result.dishName).toBe(baseItem.dishName);
    expect(result.reason).toBe(baseItem.reason);
  });

  it("transforms status to VETOED on confirmed_violation", () => {
    const safeItem: MenuItemVerdict = { ...baseItem, status: "SAFE" };
    const result = applyOutcomeToItem(safeItem, "confirmed_violation");
    expect(result.status).toBe("VETOED");
  });

  it("transforms status to VERIFY on uncertain", () => {
    const result = applyOutcomeToItem(baseItem, "uncertain");
    expect(result.status).toBe("VERIFY");
  });
});

describe("makeItemKey", () => {
  it("produces stable keys for the same input", () => {
    const a = makeItemKey(baseItem, 0);
    const b = makeItemKey(baseItem, 0);
    expect(a).toBe(b);
  });

  it("differs for different indices even when names match", () => {
    const a = makeItemKey(baseItem, 0);
    const b = makeItemKey(baseItem, 1);
    expect(a).not.toBe(b);
  });

  it("normalizes case so spelling drift produces the same key", () => {
    const upper: MenuItemVerdict = {
      ...baseItem,
      dishName: "SPICY TUNA ROLL",
    };
    expect(makeItemKey(upper, 0)).toBe(makeItemKey(baseItem, 0));
  });
});

describe("shouldShowInterrogator", () => {
  it("is true for VETOED items", () => {
    expect(shouldShowInterrogator(baseItem)).toBe(true);
  });

  it("is true for VERIFY items", () => {
    expect(
      shouldShowInterrogator({ ...baseItem, status: "VERIFY" })
    ).toBe(true);
  });

  it("is false for SAFE items", () => {
    expect(
      shouldShowInterrogator({ ...baseItem, status: "SAFE" })
    ).toBe(false);
  });
});

describe("pickFeaturedQuestion", () => {
  it("returns the first ordered question", () => {
    const plan = buildInterrogatorPlan(baseItem, [
      "no-peanuts",
      "no-shellfish",
    ]);
    expect(pickFeaturedQuestion(plan)?.criterionId).toBe("no-shellfish");
  });

  it("returns null when there are no questions", () => {
    expect(pickFeaturedQuestion([])).toBeNull();
  });
});

describe("sortItemsBySeverity", () => {
  it("orders VETOED first, then VERIFY, then SAFE", () => {
    const items: MenuItemVerdict[] = [
      { dishName: "A", status: "SAFE", reason: "" },
      { dishName: "B", status: "VETOED", reason: "" },
      { dishName: "C", status: "VERIFY", reason: "" },
    ];
    expect(sortItemsBySeverity(items).map((i) => i.dishName)).toEqual([
      "B",
      "C",
      "A",
    ]);
  });

  it("does not mutate the input array", () => {
    const items: MenuItemVerdict[] = [
      { dishName: "A", status: "SAFE", reason: "" },
      { dishName: "B", status: "VETOED", reason: "" },
    ];
    const before = [...items];
    sortItemsBySeverity(items);
    expect(items).toEqual(before);
  });
});

describe("isInterrogatorLanguage", () => {
  it("accepts known language ids", () => {
    expect(isInterrogatorLanguage("en")).toBe(true);
    expect(isInterrogatorLanguage("ar")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isInterrogatorLanguage("xx")).toBe(false);
    expect(isInterrogatorLanguage(null)).toBe(false);
    expect(isInterrogatorLanguage(123)).toBe(false);
  });
});
