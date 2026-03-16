import Link from "next/link";

import { UserButton } from "@clerk/nextjs";

import { deleteReviewAction, moderateReviewAction } from "@/app/admin/actions";
import { getAdminAccess } from "@/lib/admin-auth";
import { readAllReviews, readReviewMetrics } from "@/lib/reviews";
import type { Review, ReviewStatus } from "@/lib/review-types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (index < rating ? "★" : "☆")).join("");
}

function splitReviewsByStatus(reviews: Review[]) {
  const groups: Record<ReviewStatus, Review[]> = {
    pending: [],
    approved: [],
    rejected: []
  };

  reviews.forEach((review) => {
    groups[review.status].push(review);
  });

  return groups;
}

function ReviewAdminCard({ review }: { review: Review }) {
  return (
    <article className={`adminReviewCard adminReviewCard${review.status}`}>
      <div className="adminReviewTop">
        <div>
          <strong>{review.name}</strong>
          <span>{review.location || "Reader"}</span>
        </div>
        <div className={`statusPill status${review.status}`}>{review.status}</div>
      </div>

      <div className="adminReviewMeta">
        <span>{renderStars(review.rating)}</span>
        <small>Submitted {formatDate(review.createdAt)}</small>
      </div>

      <p>{review.message}</p>

      <div className="adminReviewActions">
        {review.status !== "approved" ? (
          <form action={moderateReviewAction}>
            <input type="hidden" name="reviewId" value={review.id} />
            <button className="button buttonPrimary adminActionButton" name="status" value="approved" type="submit">
              Approve
            </button>
          </form>
        ) : null}

        {review.status !== "rejected" ? (
          <form action={moderateReviewAction}>
            <input type="hidden" name="reviewId" value={review.id} />
            <button className="button buttonSecondary adminActionButton" name="status" value="rejected" type="submit">
              Reject
            </button>
          </form>
        ) : null}

        <form action={deleteReviewAction}>
          <input type="hidden" name="reviewId" value={review.id} />
          <button className="button buttonGhost adminActionButton" type="submit">
            Delete
          </button>
        </form>
      </div>
    </article>
  );
}

export default async function AdminPage() {
  const access = await getAdminAccess();

  if (!access.isSignedIn) {
    return null;
  }

  if (!access.isAdmin) {
    return (
      <main className="adminPage">
        <section className="adminHero">
          <div className="adminHeroBar">
            <Link className="brand" href="/">
              <span className="brandMark">LF</span>
              <span>
                Let&apos;s Fix
                <small>Admin access required</small>
              </span>
            </Link>
            <UserButton />
          </div>

          <div className="adminEmptyState">
            <span className="sectionLabel">Admin locked</span>
            <h1>You&apos;re signed in, but this account isn&apos;t allowed into the dashboard yet.</h1>
            <p>
              Add this Clerk user ID to <code>CLERK_ADMIN_USER_IDS</code> or mark the user&apos;s Clerk metadata role as
              <code> admin</code>.
            </p>
            <div className="adminConfigCard">
              <strong>Current user ID</strong>
              <code>{access.userId}</code>
              <small>
                {access.hasConfiguredAdmins
                  ? "An admin allowlist already exists. Add this ID to it."
                  : "No admin allowlist is configured yet."}
              </small>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const [reviews, metrics] = await Promise.all([readAllReviews(), readReviewMetrics()]);
  const grouped = splitReviewsByStatus(reviews);

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div className="adminHeroBar">
          <Link className="brand" href="/">
            <span className="brandMark">LF</span>
            <span>
              Let&apos;s Fix
              <small>Review moderation dashboard</small>
            </span>
          </Link>

          <div className="adminHeroActions">
            <Link className="button buttonSecondary" href="/">
              Back to site
            </Link>
            <UserButton />
          </div>
        </div>

        <div className="adminHeroCopy">
          <span className="sectionLabel">Clerk protected admin</span>
          <h1>Moderate real reviews before they go live.</h1>
          <p>
            Public submissions land in the pending queue, duplicate submissions are blocked, and only approved reviews
            are shown on the public landing page.
          </p>
        </div>

        <div className="adminStatsGrid">
          <article className="adminStatCard">
            <strong>{metrics.pending}</strong>
            <span>Pending queue</span>
          </article>
          <article className="adminStatCard">
            <strong>{metrics.approved}</strong>
            <span>Approved reviews</span>
          </article>
          <article className="adminStatCard">
            <strong>{metrics.rejected}</strong>
            <span>Rejected reviews</span>
          </article>
          <article className="adminStatCard">
            <strong>{metrics.averageApprovedRating.toFixed(1)}</strong>
            <span>Average approved rating</span>
          </article>
        </div>

        <div className="adminNoticeGrid">
          <div className="adminNoticeCard">
            <strong>Duplicate protection</strong>
            <p>Exact repeat reviews are blocked before they ever reach the moderation queue.</p>
          </div>
          <div className="adminNoticeCard">
            <strong>Moderation model</strong>
            <p>Only approved reviews are visible publicly. Pending and rejected reviews remain private to admins.</p>
          </div>
        </div>
      </section>

      <section className="adminBoards">
        <div className="adminBoard">
          <div className="adminBoardHeader">
            <h2>Pending</h2>
            <span>{grouped.pending.length}</span>
          </div>
          {grouped.pending.length === 0 ? (
            <div className="adminEmptyColumn">No reviews waiting for moderation.</div>
          ) : (
            grouped.pending.map((review) => <ReviewAdminCard key={review.id} review={review} />)
          )}
        </div>

        <div className="adminBoard">
          <div className="adminBoardHeader">
            <h2>Approved</h2>
            <span>{grouped.approved.length}</span>
          </div>
          {grouped.approved.length === 0 ? (
            <div className="adminEmptyColumn">No approved reviews yet.</div>
          ) : (
            grouped.approved.map((review) => <ReviewAdminCard key={review.id} review={review} />)
          )}
        </div>

        <div className="adminBoard">
          <div className="adminBoardHeader">
            <h2>Rejected</h2>
            <span>{grouped.rejected.length}</span>
          </div>
          {grouped.rejected.length === 0 ? (
            <div className="adminEmptyColumn">No rejected reviews.</div>
          ) : (
            grouped.rejected.map((review) => <ReviewAdminCard key={review.id} review={review} />)
          )}
        </div>
      </section>
    </main>
  );
}
