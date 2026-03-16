"use client";

import { useEffect, useState, useTransition } from "react";

import type { Review } from "@/lib/review-types";

type ReviewFormState = {
  name: string;
  location: string;
  rating: number;
  message: string;
};

const initialFormState: ReviewFormState = {
  name: "",
  location: "",
  rating: 5,
  message: ""
};

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (index < rating ? "★" : "☆")).join("");
}

export function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [formState, setFormState] = useState<ReviewFormState>(initialFormState);
  const [loadError, setLoadError] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    async function loadReviews() {
      try {
        const response = await fetch("/api/reviews", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Could not load reviews.");
        }

        const payload = (await response.json()) as { reviews: Review[] };

        if (active) {
          setReviews(payload.reviews);
          setLoadError("");
        }
      } catch (error) {
        if (active) {
          setLoadError(error instanceof Error ? error.message : "Could not load reviews.");
        }
      }
    }

    loadReviews();

    return () => {
      active = false;
    };
  }, []);

  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0 ? (reviews.reduce((total, review) => total + review.rating, 0) / reviewCount).toFixed(1) : "0.0";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formState)
        });

        const payload = (await response.json()) as { message?: string; error?: string };

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to post your review.");
        }

        setFormState(initialFormState);
        setSubmitMessage(payload.message ?? "Thank you. Your review has been submitted for moderation.");
      } catch (error) {
        setSubmitMessage(error instanceof Error ? error.message : "Unable to post your review.");
      }
    });
  }

  return (
    <section className="section reviewsSection" id="reviews">
      <div className="sectionHeading splitHeading">
        <div>
          <span className="sectionLabel">Reader reviews</span>
          <h2>Let readers leave a real response, not just admire the page.</h2>
        </div>
        <div className="reviewSummary">
          <strong>{averageRating}</strong>
          <span>{renderStars(Math.round(Number(averageRating)))}</span>
          <small>
            {reviewCount === 0 ? "No approved reviews yet" : `${reviewCount} approved ${reviewCount === 1 ? "review" : "reviews"}`}
          </small>
        </div>
      </div>

      <div className="reviewsLayout">
        <form className="reviewForm" onSubmit={handleSubmit}>
          <div className="formHeading">
            <h3>Post your review</h3>
            <p>Share what the book stirred in you, what helped, or who you think should read it next.</p>
          </div>

          <div className="reviewPendingNote">
            New reviews are moderated first, then approved reviews appear publicly on the page.
          </div>

          <label className="field">
            <span>Your name</span>
            <input
              type="text"
              name="name"
              maxLength={60}
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              placeholder="Grace M."
              required
            />
          </label>

          <label className="field">
            <span>Location or role</span>
            <input
              type="text"
              name="location"
              maxLength={60}
              value={formState.location}
              onChange={(event) => setFormState((current) => ({ ...current, location: event.target.value }))}
              placeholder="Lusaka, Zambia"
            />
          </label>

          <fieldset className="ratingField">
            <legend>Your rating</legend>
            <div className="ratingChoices">
              {[1, 2, 3, 4, 5].map((rating) => (
                <label className={`ratingChip${formState.rating === rating ? " activeRating" : ""}`} key={rating}>
                  <input
                    type="radio"
                    name="rating"
                    value={rating}
                    checked={formState.rating === rating}
                    onChange={() => setFormState((current) => ({ ...current, rating }))}
                  />
                  <span>{rating} star{rating > 1 ? "s" : ""}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="field">
            <span>Your review</span>
            <textarea
              name="message"
              minLength={12}
              maxLength={600}
              rows={5}
              value={formState.message}
              onChange={(event) => setFormState((current) => ({ ...current, message: event.target.value }))}
              placeholder="This book helped me..."
              required
            />
          </label>

          <div className="reviewFormFooter">
            <button className="button buttonPrimary" type="submit" disabled={isPending}>
              {isPending ? "Posting..." : "Post review"}
            </button>
            {submitMessage ? <p className="formMessage">{submitMessage}</p> : null}
          </div>
        </form>

        <div className="reviewListWrap">
          {loadError ? <p className="reviewNotice">{loadError}</p> : null}

          {!loadError && reviewCount === 0 ? (
            <div className="reviewEmptyState">
              <h3>Be the first approved review for Let&apos;s Fix</h3>
              <p>The first public response can set the tone for every reader who visits this page after moderation.</p>
            </div>
          ) : null}

          <div className="reviewList">
            {reviews.map((review) => (
              <article className="reviewCard" key={review.id}>
                <div className="reviewCardTop">
                  <div>
                    <strong>{review.name}</strong>
                    <span>{review.location || "Reader"}</span>
                  </div>
                  <small>{formatReviewDate(review.createdAt)}</small>
                </div>

                <div className="reviewStars" aria-label={`${review.rating} star review`}>
                  {renderStars(review.rating)}
                </div>

                <p>{review.message}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
