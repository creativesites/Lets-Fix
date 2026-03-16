import type { Review, ReviewInput, ReviewMetrics } from "@/lib/review-types";
import { getDatabase } from "@/lib/database";
import { createReviewFingerprint, isReviewStatus, sanitizeText } from "@/lib/review-utils";

function validateReview(input: ReviewInput) {
  const name = sanitizeText(input.name);
  const location = sanitizeText(input.location ?? "");
  const message = sanitizeText(input.message);
  const rating = Number(input.rating);

  if (name.length < 2 || name.length > 60) {
    throw new Error("Please enter a name between 2 and 60 characters.");
  }

  if (location.length > 60) {
    throw new Error("Location should be 60 characters or fewer.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5 stars.");
  }

  if (message.length < 12 || message.length > 600) {
    throw new Error("Review message must be between 12 and 600 characters.");
  }

  return {
    name,
    location,
    rating,
    message
  };
}

export async function readReviews() {
  const database = getDatabase();
  const reviews = database
    .prepare(
      `
        SELECT
          id,
          name,
          location,
          rating,
          message,
          status,
          created_at AS createdAt,
          updated_at AS updatedAt,
          moderated_at AS moderatedAt
        FROM reviews
        WHERE status = 'approved'
        ORDER BY datetime(created_at) DESC
      `
    )
    .all() as Review[];

  return reviews;
}

export async function readAllReviews() {
  const database = getDatabase();

  return database
    .prepare(
      `
        SELECT
          id,
          name,
          location,
          rating,
          message,
          status,
          created_at AS createdAt,
          updated_at AS updatedAt,
          moderated_at AS moderatedAt
        FROM reviews
        ORDER BY
          CASE status
            WHEN 'pending' THEN 0
            WHEN 'approved' THEN 1
            ELSE 2
          END,
          datetime(created_at) DESC
      `
    )
    .all() as Review[];
}

export async function readReviewMetrics() {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
        SELECT
          status,
          COUNT(*) AS count,
          AVG(CASE WHEN status = 'approved' THEN rating END) AS avgApprovedRating
        FROM reviews
        GROUP BY status
      `
    )
    .all() as Array<{ status: string; count: number; avgApprovedRating: number | null }>;

  const metrics: ReviewMetrics = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    averageApprovedRating: 0
  };

  rows.forEach((row) => {
    if (isReviewStatus(row.status)) {
      metrics[row.status] = row.count;
    }

    metrics.total += row.count;

    if (row.status === "approved" && row.avgApprovedRating) {
      metrics.averageApprovedRating = Number(row.avgApprovedRating.toFixed(1));
    }
  });

  return metrics;
}

export async function createReview(input: ReviewInput) {
  const reviewInput = validateReview(input);
  const database = getDatabase();
  const fingerprint = createReviewFingerprint(reviewInput);
  const existingReview = database
    .prepare("SELECT status FROM reviews WHERE fingerprint = ?")
    .get(fingerprint) as { status: string } | undefined;

  if (existingReview) {
    if (existingReview.status === "pending") {
      throw new Error("This review has already been submitted and is waiting for moderation.");
    }

    throw new Error("This exact review has already been submitted.");
  }

  const now = new Date().toISOString();

  const review: Review = {
    id: crypto.randomUUID(),
    name: reviewInput.name,
    location: reviewInput.location,
    rating: reviewInput.rating,
    message: reviewInput.message,
    status: "pending",
    createdAt: now,
    updatedAt: now,
    moderatedAt: null
  };

  database
    .prepare(
      `
        INSERT INTO reviews (id, name, location, rating, message, status, fingerprint, created_at, updated_at, moderated_at)
        VALUES (@id, @name, @location, @rating, @message, @status, @fingerprint, @createdAt, @updatedAt, @moderatedAt)
      `
    )
    .run({
      ...review,
      fingerprint
    });

  return review;
}

export async function moderateReview(reviewId: string, status: "approved" | "rejected") {
  const database = getDatabase();
  const now = new Date().toISOString();

  database
    .prepare(
      `
        UPDATE reviews
        SET status = @status,
            updated_at = @updatedAt,
            moderated_at = @moderatedAt
        WHERE id = @id
      `
    )
    .run({
      id: reviewId,
      status,
      updatedAt: now,
      moderatedAt: now
    });
}

export async function deleteReview(reviewId: string) {
  const database = getDatabase();
  database.prepare("DELETE FROM reviews WHERE id = ?").run(reviewId);
}
