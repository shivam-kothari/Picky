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

export type MenuItemVerdict = {
  dishName: string;
  status: ScanStatus;
  reason: string;
};

export type ScanVerdict = {
  summary: string;
  items: MenuItemVerdict[];
  selectedCriteria: string[];
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
    summary: { type: "STRING" },
    items: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          dishName: { type: "STRING" },
          status: { type: "STRING", enum: SCAN_STATUSES },
          reason: { type: "STRING" },
        },
        required: ["dishName", "status", "reason"],
      },
    },
  },
  required: ["summary", "items"],
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

  const summary = readString(input.summary, "Double Check could not summarize the scan.");
  const selectedIds = selectedCriteria.map((c) => c.id);

  let items: MenuItemVerdict[] = [];
  if (Array.isArray(input.items)) {
    items = input.items.map((item: Record<string, unknown>) => ({
      dishName: readString(item.dishName, "Unknown Item"),
      status: isScanStatus(item.status) ? item.status : "VERIFY",
      reason: readString(item.reason, "No reason provided."),
    }));
  }

  return {
    summary,
    items,
    selectedCriteria: selectedIds,
  };
}

export function createVerifyVerdict(
  selectedCriteria: Criterion[] | string[],
  summary: string
): ScanVerdict {
  const ids = selectedCriteria.map((criterion) =>
    typeof criterion === "string" ? criterion : criterion.id
  );

  return {
    summary,
    items: [],
    selectedCriteria: ids,
  };
}

export function createNoStandardsVerdict(): ScanVerdict {
  return {
    summary: "Double Check has no dietary rule to enforce yet. Choose at least one standard.",
    items: [],
    selectedCriteria: [],
  };
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


