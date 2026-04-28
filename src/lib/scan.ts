import { CRITERIA, type Criterion } from "@/lib/criteria";

export const SCAN_STATUSES = ["SAFE", "VETOED", "VERIFY"] as const;
export const CONFIDENCE_LEVELS = ["low", "medium", "high"] as const;
export const SCAN_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type ScanStatus = (typeof SCAN_STATUSES)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];
export type ScanMimeType = (typeof SCAN_MIME_TYPES)[number];

export type ScanRequest = {
  imageBase64: string;
  mimeType: ScanMimeType;
  criteriaIds: string[];
  imageMeta?: {
    width: number;
    height: number;
    bytes: number;
  };
};

export type ScanVerdict = {
  status: ScanStatus;
  dishName: string;
  confidence: ConfidenceLevel;
  summary: string;
  primaryReason: string;
  selectedCriteria: string[];
  triggeredCriteria: string[];
  hiddenRisks: string[];
  visibleEvidence: string[];
  missingEvidence: string[];
  waitstaffQuestion: string;
};

export type ValidatedScanRequest =
  | {
      ok: true;
      request: ScanRequest;
      criteria: Criterion[];
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

const MAX_IMAGE_BASE64_CHARS = 7_000_000;
const criterionIds = new Set(CRITERIA.map((criterion) => criterion.id));

export const scanVerdictResponseSchema = {
  type: "OBJECT",
  properties: {
    status: {
      type: "STRING",
      enum: SCAN_STATUSES,
    },
    dishName: {
      type: "STRING",
    },
    confidence: {
      type: "STRING",
      enum: CONFIDENCE_LEVELS,
    },
    summary: {
      type: "STRING",
    },
    primaryReason: {
      type: "STRING",
    },
    selectedCriteria: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    triggeredCriteria: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    hiddenRisks: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    visibleEvidence: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    missingEvidence: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    waitstaffQuestion: {
      type: "STRING",
    },
  },
  required: [
    "status",
    "dishName",
    "confidence",
    "summary",
    "primaryReason",
    "selectedCriteria",
    "triggeredCriteria",
    "hiddenRisks",
    "visibleEvidence",
    "missingEvidence",
    "waitstaffQuestion",
  ],
  propertyOrdering: [
    "status",
    "dishName",
    "confidence",
    "summary",
    "primaryReason",
    "selectedCriteria",
    "triggeredCriteria",
    "hiddenRisks",
    "visibleEvidence",
    "missingEvidence",
    "waitstaffQuestion",
  ],
} as const;

export function validateScanRequest(input: unknown): ValidatedScanRequest {
  if (!isRecord(input)) {
    return invalid(400, "Scan request must be a JSON object.");
  }

  const { imageBase64, mimeType, criteriaIds, imageMeta } = input;

  if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return invalid(400, "A base64 image is required.");
  }

  if (imageBase64.length > MAX_IMAGE_BASE64_CHARS) {
    return invalid(413, "Image is too large after compression.");
  }

  if (!isScanMimeType(mimeType)) {
    return invalid(400, "Image must be JPEG, PNG, or WebP.");
  }

  if (!Array.isArray(criteriaIds)) {
    return invalid(400, "criteriaIds must be an array.");
  }

  const uniqueIds = Array.from(new Set(criteriaIds));
  if (!uniqueIds.every((id) => typeof id === "string" && criterionIds.has(id))) {
    return invalid(400, "One or more criteria ids are invalid.");
  }

  const criteria = CRITERIA.filter((criterion) => uniqueIds.includes(criterion.id));

  return {
    ok: true,
    criteria,
    request: {
      imageBase64,
      mimeType,
      criteriaIds: uniqueIds,
      imageMeta: isImageMeta(imageMeta) ? imageMeta : undefined,
    },
  };
}

export function normalizeScanVerdict(
  input: unknown,
  selectedCriteria: Criterion[]
): ScanVerdict | null {
  if (!isRecord(input)) {
    return null;
  }

  const status = input.status;
  const confidence = input.confidence;

  if (!isScanStatus(status) || !isConfidenceLevel(confidence)) {
    return null;
  }

  const selectedIds = selectedCriteria.map((criterion) => criterion.id);
  const selectedIdSet = new Set(selectedIds);

  const triggeredCriteria = readStringArray(input.triggeredCriteria).filter((id) =>
    selectedIdSet.has(id)
  );

  return {
    status,
    confidence,
    dishName: readString(input.dishName, "Unidentified dish"),
    summary: readString(input.summary, "Picky could not summarize the scan."),
    primaryReason: readString(
      input.primaryReason,
      "The image did not provide enough reliable evidence for a safe verdict."
    ),
    selectedCriteria: selectedIds,
    triggeredCriteria,
    hiddenRisks: readStringArray(input.hiddenRisks).slice(0, 6),
    visibleEvidence: readStringArray(input.visibleEvidence).slice(0, 6),
    missingEvidence: readStringArray(input.missingEvidence).slice(0, 6),
    waitstaffQuestion: readString(
      input.waitstaffQuestion,
      buildWaitstaffQuestion(selectedCriteria)
    ),
  };
}

export function createVerifyVerdict(
  selectedCriteria: Criterion[] | string[],
  primaryReason: string,
  options?: {
    dishName?: string;
    summary?: string;
    missingEvidence?: string[];
  }
): ScanVerdict {
  const ids = selectedCriteria.map((criterion) =>
    typeof criterion === "string" ? criterion : criterion.id
  );

  return {
    status: "VERIFY",
    dishName: options?.dishName ?? "Unverified dish",
    confidence: "low",
    summary:
      options?.summary ??
      "Picky needs a human confirmation before this can be treated as safe.",
    primaryReason,
    selectedCriteria: ids,
    triggeredCriteria: [],
    hiddenRisks: [],
    visibleEvidence: [],
    missingEvidence:
      options?.missingEvidence ??
      ["Ingredient list", "Sauce base", "Cooking fat", "Cross-contact controls"],
    waitstaffQuestion:
      selectedCriteria.length > 0
        ? buildWaitstaffQuestion(selectedCriteria)
        : "Which dietary standard should I verify for this dish?",
  };
}

export function createNoStandardsVerdict(): ScanVerdict {
  return {
    status: "VERIFY",
    dishName: "No standards selected",
    confidence: "low",
    summary: "Choose at least one standard before scanning.",
    primaryReason: "Picky has no dietary rule to enforce yet.",
    selectedCriteria: [],
    triggeredCriteria: [],
    hiddenRisks: [],
    visibleEvidence: [],
    missingEvidence: ["Selected standards"],
    waitstaffQuestion: "Which standard should this dish be checked against?",
  };
}

function buildWaitstaffQuestion(selectedCriteria: Criterion[] | string[]) {
  const labels = selectedCriteria.map((criterion) =>
    typeof criterion === "string"
      ? criterion
      : criterion.label
  );

  if (labels.length === 0) {
    return "Could you confirm the full ingredient list and preparation method?";
  }

  return `Could you confirm whether this dish satisfies these standards: ${labels.join(", ")}?`;
}

function invalid(status: number, message: string): ValidatedScanRequest {
  return { ok: false, status, message };
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}

function isScanMimeType(input: unknown): input is ScanMimeType {
  return typeof input === "string" && SCAN_MIME_TYPES.includes(input as ScanMimeType);
}

function isScanStatus(input: unknown): input is ScanStatus {
  return typeof input === "string" && SCAN_STATUSES.includes(input as ScanStatus);
}

function isConfidenceLevel(input: unknown): input is ConfidenceLevel {
  return (
    typeof input === "string" &&
    CONFIDENCE_LEVELS.includes(input as ConfidenceLevel)
  );
}

function isImageMeta(input: unknown): input is NonNullable<ScanRequest["imageMeta"]> {
  if (!isRecord(input)) {
    return false;
  }

  return (
    typeof input.width === "number" &&
    typeof input.height === "number" &&
    typeof input.bytes === "number" &&
    input.width > 0 &&
    input.height > 0 &&
    input.bytes > 0
  );
}

function readString(input: unknown, fallback: string) {
  if (typeof input !== "string") {
    return fallback;
  }

  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

function readStringArray(input: unknown) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
