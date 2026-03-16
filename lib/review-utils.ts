import type { ReviewStatus } from "@/lib/review-types";

export function sanitizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeReviewValue(value: string) {
  return sanitizeText(value).toLowerCase();
}

export function createReviewFingerprint(input: {
  name: string;
  location?: string;
  rating: number;
  message: string;
}) {
  return [
    normalizeReviewValue(input.name),
    normalizeReviewValue(input.location ?? ""),
    String(input.rating),
    normalizeReviewValue(input.message)
  ].join("::");
}

export function isReviewStatus(value: string): value is ReviewStatus {
  return value === "pending" || value === "approved" || value === "rejected";
}

