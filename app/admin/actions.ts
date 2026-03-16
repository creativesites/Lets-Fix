"use server";

import { revalidatePath } from "next/cache";

import { requireAdminAccess } from "@/lib/admin-auth";
import { deleteReview, moderateReview } from "@/lib/reviews";

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

