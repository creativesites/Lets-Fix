import Link from "next/link";

import { UserButton } from "@clerk/nextjs";

import { deleteDevotionalAction, deleteReviewAction, moderateReviewAction, saveDevotionalAction } from "@/app/admin/actions";
import { getAdminAccess } from "@/lib/admin-auth";
import { adviceLanguageOptions } from "@/lib/advice-config";
import { formatDevotionalDate, readAllDevotionals, readDevotionalMetrics, toDateInputValue } from "@/lib/devotionals";
import { readAllReviews, readReviewMetrics } from "@/lib/reviews";
import type { Devotional } from "@/lib/devotional-types";
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

function DevotionalAdminCard({ devotional }: { devotional: Devotional }) {
  return (
    <article className="adminReviewCard adminDevotionalCard">
      <div className="adminReviewTop">
        <div>
          <strong>{devotional.title}</strong>
          <span>
            {devotional.theme} · {devotional.language}
          </span>
        </div>
        <div className={`statusPill status${devotional.status}`}>{devotional.status}</div>
      </div>

      <div className="adminReviewMeta">
        <span>{devotional.accessTier}</span>
        <small>Publishes {formatDevotionalDate(devotional.publishDate)}</small>
      </div>

      <p>{devotional.summary}</p>

      <div className="adminNoticeCard">
        <strong>{devotional.keyVerseReference}</strong>
        <p>{devotional.keyVerseText}</p>
      </div>

      <div className="adminReviewActions">
        <Link className="button buttonSecondary adminActionButton" href={`/devotionals/${devotional.slug}`}>
          Open
        </Link>
        <form action={deleteDevotionalAction}>
          <input type="hidden" name="devotionalId" value={devotional.id} />
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

  const [reviews, metrics, devotionals, devotionalMetrics] = await Promise.all([
    readAllReviews(),
    readReviewMetrics(),
    readAllDevotionals(),
    readDevotionalMetrics()
  ]);
  const grouped = splitReviewsByStatus(reviews);
  const todayInputValue = toDateInputValue(new Date().toISOString());

  return (
    <main className="adminPage">
      <section className="adminHero">
        <div className="adminHeroBar">
          <Link className="brand" href="/">
            <span className="brandMark">LF</span>
            <span>
              Let&apos;s Fix
              <small>Admin dashboard</small>
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
          <h1>Moderate reviews and publish devotionals from one protected dashboard.</h1>
          <p>
            Public submissions land in the pending queue, duplicate submissions are blocked, and only approved reviews
            are shown on the public landing page. Daily devotionals can now be created here and published to the premium devotional hub.
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

      <section className="adminHero">
        <div className="adminHeroCopy">
          <span className="sectionLabel">Daily devotionals</span>
          <h1>Publish premium devotionals with scripture, reflection, prayer, and media.</h1>
          <p>
            This first devotional workspace lets admins publish a daily reading with a main verse, extra scripture,
            reflection questions, action step, prayer, and optional media or audio links.
          </p>
        </div>

        <div className="adminStatsGrid">
          <article className="adminStatCard">
            <strong>{devotionalMetrics.total}</strong>
            <span>Total devotionals</span>
          </article>
          <article className="adminStatCard">
            <strong>{devotionalMetrics.published}</strong>
            <span>Published</span>
          </article>
          <article className="adminStatCard">
            <strong>{devotionalMetrics.scheduled}</strong>
            <span>Scheduled</span>
          </article>
          <article className="adminStatCard">
            <strong>{devotionalMetrics.premium}</strong>
            <span>Premium tier</span>
          </article>
        </div>

        <div className="adminDevotionalLayout">
          <form action={saveDevotionalAction} className="adminDevotionalForm">
            <div className="adminBoardHeader">
              <h2>Create devotional</h2>
              <span>Publish today or schedule ahead</span>
            </div>

            <div className="adviceProfileGrid">
              <label className="adviceField adviceFieldFull">
                <span>Title</span>
                <input name="title" placeholder="Resting on God's promises" required />
              </label>

              <label className="adviceField">
                <span>Theme</span>
                <input name="theme" placeholder="Peace in waiting" required />
              </label>

              <label className="adviceField">
                <span>Publish date</span>
                <input defaultValue={todayInputValue} name="publishDate" type="date" required />
              </label>

              <label className="adviceField">
                <span>Language</span>
                <select defaultValue="en-ZM" name="language">
                  {adviceLanguageOptions.map((language) => (
                    <option key={language.value} value={language.value}>
                      {language.label} / {language.nativeLabel}
                    </option>
                  ))}
                </select>
              </label>

              <label className="adviceField">
                <span>Access tier</span>
                <select defaultValue="premium" name="accessTier">
                  <option value="premium">Premium</option>
                  <option value="free">Free</option>
                </select>
              </label>

              <label className="adviceField">
                <span>Status</span>
                <select defaultValue="published" name="status">
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </label>

              <label className="adviceField adviceFieldFull">
                <span>Summary</span>
                <input name="summary" placeholder="A one-line devotional summary for the archive and header." required />
              </label>

              <label className="adviceField">
                <span>Key verse reference</span>
                <input name="keyVerseReference" placeholder="John 16:33" required />
              </label>

              <label className="adviceField adviceFieldFull">
                <span>Key verse text</span>
                <input name="keyVerseText" placeholder="In this world you will have trouble..." required />
              </label>

              <label className="adviceField adviceFieldFull">
                <span>Body</span>
                <textarea name="body" rows={7} placeholder="Write the devotional reading here." required />
              </label>

              <label className="adviceField adviceFieldFull">
                <span>Additional verses</span>
                <textarea name="additionalVerses" rows={4} placeholder={"One verse reference per line\nPhilippians 4:6-7"} />
              </label>

              <label className="adviceField adviceFieldFull">
                <span>Reflection questions</span>
                <textarea
                  name="reflectionQuestions"
                  rows={4}
                  placeholder={"One question per line\nWhere has fear been louder than faith?"}
                />
              </label>

              <label className="adviceField adviceFieldFull">
                <span>Prayer</span>
                <textarea name="prayer" rows={5} placeholder="Write the closing prayer here." required />
              </label>

              <label className="adviceField adviceFieldFull">
                <span>Action step</span>
                <input name="actionStep" placeholder="What should the reader do today?" required />
              </label>

              <label className="adviceField">
                <span>Media URL</span>
                <input name="mediaUrl" placeholder="Image or video URL" />
              </label>

              <label className="adviceField">
                <span>Audio URL</span>
                <input name="audioUrl" placeholder="Audio URL" />
              </label>
            </div>

            <button className="button buttonPrimary" type="submit">
              Save devotional
            </button>
          </form>

          <div className="adminDevotionalList">
            <div className="adminBoardHeader">
              <h2>Published and scheduled</h2>
              <span>{devotionals.length}</span>
            </div>

            {devotionals.length === 0 ? (
              <div className="adminEmptyColumn">No devotionals yet.</div>
            ) : (
              devotionals.map((devotional) => <DevotionalAdminCard key={devotional.id} devotional={devotional} />)
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
