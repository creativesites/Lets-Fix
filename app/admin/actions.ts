"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/admin-auth";
import { deleteDevotional, saveDevotional } from "@/lib/devotionals";
import { deleteReview, moderateReview } from "@/lib/reviews";
import type { AdviceLanguage } from "@/lib/advice-types";
import type { DevotionalAccessTier, DevotionalStatus } from "@/lib/devotional-types";

export async function moderateReviewAction(formData: FormData) {
  await requireAdminAccess();

  const reviewId = String(formData.get("reviewId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!reviewId || (status !== "approved" && status !== "rejected")) {
    throw new Error("Invalid moderation request.");
  }

  await moderateReview(reviewId, status);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdminAccess();

  const reviewId = String(formData.get("reviewId") ?? "");

  if (!reviewId) {
    throw new Error("Invalid review delete request.");
  }

  await deleteReview(reviewId);
  revalidatePath("/");
  revalidatePath("/admin");
}

function toLineList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function saveDevotionalAction(formData: FormData) {
  await requireAdminAccess();

  await saveDevotional({
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    theme: String(formData.get("theme") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    body: String(formData.get("body") ?? ""),
    keyVerseReference: String(formData.get("keyVerseReference") ?? ""),
    keyVerseText: String(formData.get("keyVerseText") ?? ""),
    additionalVerses: toLineList(formData.get("additionalVerses")),
    reflectionQuestions: toLineList(formData.get("reflectionQuestions")),
    actionStep: String(formData.get("actionStep") ?? ""),
    prayer: String(formData.get("prayer") ?? ""),
    mediaUrl: String(formData.get("mediaUrl") ?? ""),
    audioUrl: String(formData.get("audioUrl") ?? ""),
    language: String(formData.get("language") ?? "en-ZM") as AdviceLanguage,
    accessTier: String(formData.get("accessTier") ?? "premium") as DevotionalAccessTier,
    status: String(formData.get("status") ?? "draft") as DevotionalStatus,
    publishDate: String(formData.get("publishDate") ?? "")
  });

  revalidatePath("/admin");
  revalidatePath("/devotionals");
}

export async function deleteDevotionalAction(formData: FormData) {
  await requireAdminAccess();

  const devotionalId = String(formData.get("devotionalId") ?? "");
  if (!devotionalId) {
    throw new Error("Invalid devotional delete request.");
  }

  await deleteDevotional(devotionalId);
  revalidatePath("/admin");
  revalidatePath("/devotionals");
}
