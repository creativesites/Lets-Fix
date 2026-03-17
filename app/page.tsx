import Image from "next/image";
import Link from "next/link";

import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { readReviews } from "@/lib/reviews";
import {
  adviceFeatureCards,
  contact,
  endorsements,
  featuredHeroImages,
  galleryPreviewCards,
  homeHighlights,
  quoteImageCards,
  quoteTextCards,
  reviewTeaser
} from "@/lib/site-content";

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => (index < rating ? "★" : "☆")).join("");
}

export default async function HomePage() {
  const latestReviews = (await readReviews()).slice(0, 2);

  return (
    <main className="pageShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      <PublicHeader />

      <section className="section homeHeroSection">
        <div className="homeHeroGrid">
          <div className="homeHeroCopy">
            <div className="eyebrowGroup">
              <span className="eyebrow">A premium ebook experience</span>
              <span className="eyebrow mutedEyebrow">66 pages of healing, purpose, and godly love</span>
            </div>

            <h1>
              A beautiful guide for healing,
              <span> discernment, and godly relationships.</span>
            </h1>

            <p className="lede">
              <em>Let&apos;s Fix</em> is Maureen Sinovia Mulenga&apos;s honest and faith-centered book for readers who want
              to love with wisdom, recover with dignity, and build relationships on Christ-like character.
            </p>

            <div className="ctaRow">
              <Link className="button buttonPrimary" href={contact.whatsappHref} target="_blank" rel="noreferrer">
                Order on WhatsApp
                <ArrowIcon />
              </Link>
              <Link className="button buttonSecondary" href="/book">
                Explore the book
              </Link>
              <Link className="button buttonSecondary" href="/advice">
                Try the advisor
              </Link>
            </div>

            <div className="homeHeroStats">
              <div>
                <strong>9 chapters</strong>
                <span>from heartbreak to wholeness</span>
              </div>
              <div>
                <strong>5 endorsements</strong>
                <span>from authors, pastors, and leaders</span>
              </div>
              <div>
                <strong>{contact.phoneLocal}</strong>
                <span>active WhatsApp order line</span>
              </div>
            </div>
          </div>

          <div className="homeHeroVisual">
            <div className="homeHeroBackdrop">
              <Image
                src={featuredHeroImages.background}
                alt="Sinovia reading Let's Fix with other women outdoors"
                fill
                priority
                sizes="(max-width: 900px) 90vw, 48vw"
                className="coverImage"
              />
            </div>

            <div className="homeHeroOverlay">
              <div className="homeHeroCardImage">
                <Image
                  src={featuredHeroImages.authorCard}
                  alt="Sinovia holding and reading Let's Fix outdoors"
                  fill
                  sizes="240px"
                  className="coverImage"
                />
              </div>

              <div className="homeHeroOverlayCopy">
                <span className="sectionLabel">Written by Maureen Sinovia Mulenga</span>
                <h2>A gentle voice with a clear message about love, healing, and discernment.</h2>
                <p>
                  Rooted in testimony and scripture, <em>Let&apos;s Fix</em> invites readers into a more honest, godly, and
                  emotionally healthy way of approaching relationships.
                </p>
              </div>
            </div>

            <div className="homeHeroBookAccent">
              <Image
                src={featuredHeroImages.accentBook}
                alt="Copies of Let's Fix placed on the grass"
                fill
                sizes="(max-width: 900px) 40vw, 16vw"
                className="coverImage"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">What the book carries</span>
            <h2>Its strength is not hype. It is honesty, scripture, and emotional clarity.</h2>
          </div>
          <p>
            The book is warm but direct. It speaks to heartbreak, readiness, character, trust, forgiveness, and the kind
            of love that does not drift from God.
          </p>
        </div>

        <div className="forGrid">
          {homeHighlights.map((item) => (
            <article className="forCard" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">Featured wisdom</span>
            <h2>Words from the book that stay with you long after the page is turned.</h2>
          </div>
          <p>
            These quote-led moments give the homepage a warmer emotional center while the full chapter journey lives on
            the book page.
          </p>
        </div>

        <div className="homeQuoteLayout">
          <div className="homeQuoteImages">
            {quoteImageCards.map((item) => (
              <figure className="homeQuoteImageCard" key={item.src}>
                <Image src={item.src} alt={item.alt} fill sizes="(max-width: 900px) 90vw, 28vw" className="coverImage" />
              </figure>
            ))}
          </div>

          <div className="homeQuoteTextGrid">
            {quoteTextCards.map((item) => (
              <article className="voiceCard" key={item.title}>
                <span className="voiceNumber">Quote</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">Gallery preview</span>
            <h2>A visual story built around the book, the readers, and the woman behind it.</h2>
          </div>
          <p>
            From intimate book details to reader portraits and quiet author moments, the imagery reflects the warmth and
            sincerity of the message itself.
          </p>
        </div>

        <div className="galleryPreviewGrid">
          {galleryPreviewCards.map((card) => (
            <article className="galleryPreviewCard" key={card.src}>
              <figure className="galleryPreviewFigure">
                <Image src={card.src} alt={card.alt} fill sizes="(max-width: 900px) 90vw, 30vw" className="coverImage" />
              </figure>
              <div className="galleryPreviewCopy">
                <span>{card.title}</span>
              </div>
            </article>
          ))}
        </div>

        <div className="sectionActions">
          <Link className="button buttonSecondary" href="/gallery">
            Open the full gallery
          </Link>
          <Link className="button buttonSecondary" href="/quotes">
            View the quote wall
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">Endorsements</span>
            <h2>Five voices affirm the same thing: the book is practical, vulnerable, and Christ-centered.</h2>
          </div>
          <p>Authors, pastors, and leaders describe it as honest, practical, and deeply rooted in a Christ-like view of love.</p>
        </div>

        <div className="endorsementGrid">
          {endorsements.map((endorsement) => (
            <article className="endorsementCard" key={endorsement.name}>
              <p className="endorseQuote">&ldquo;{endorsement.quote}&rdquo;</p>
              <div className="endorseFooter">
                <strong>{endorsement.name}</strong>
                <span>{endorsement.role}</span>
                {endorsement.detail ? <small>{endorsement.detail}</small> : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">Reviews</span>
            <h2>{reviewTeaser.title}</h2>
          </div>
          <p>{reviewTeaser.text}</p>
        </div>

        <div className="reviewTeaserGrid">
          {latestReviews.length > 0 ? (
            latestReviews.map((review) => (
              <article className="reviewCard" key={review.id}>
                <div className="reviewCardTop">
                  <div>
                    <strong>{review.name}</strong>
                    <span>{review.location || "Reader"}</span>
                  </div>
                </div>
                <div className="reviewStars">{renderStars(review.rating)}</div>
                <p>{review.message}</p>
              </article>
            ))
          ) : (
            <article className="reviewEmptyState">
              <h3>Reviews will appear here</h3>
              <p>Approved reader feedback from the SQLite review system will be featured on the site.</p>
            </article>
          )}
        </div>

        <div className="sectionActions">
          <Link className="button buttonSecondary" href="/reviews">
            Open reviews
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">AI advisor</span>
            <h2>A professional Christian relationship guide, grounded in the book.</h2>
          </div>
          <p>
            The advice studio is live with Zambia-shaped, Christian relationship guidance anchored in the themes and tone
            of <em> Let&apos;s Fix</em>, plus guided tools beyond plain text chat.
          </p>
        </div>

        <div className="forGrid">
          {adviceFeatureCards.map((item) => (
            <article className="forCard" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>

        <div className="sectionActions">
          <Link className="button buttonPrimary" href="/advice">
            Open the advice studio
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <section className="section authorSection" id="author">
        <div className="authorPortrait">
          <Image
            src="/media/author.jpeg"
            alt="Maureen Sinovia Mulenga"
            fill
            sizes="(max-width: 900px) 90vw, 36vw"
            className="coverImage"
          />
        </div>

        <div className="authorContent">
          <span className="sectionLabel">Meet the author</span>
          <h2>Meet the woman behind the message.</h2>
          <p>
            Maureen Sinovia Mulenga is a devoted Christian, speaker, entrepreneur, and founder of Me and My Sisters. Her
            book is written from testimony, reflection, and a practical desire to help readers love with more wisdom.
          </p>
          <p>
            She writes with warmth, conviction, and vulnerability, drawing readers toward healing, better standards, and
            relationships that honor God.
          </p>

          <div className="authorBadges">
            <span>Faith-rooted relationship voice</span>
            <span>Public speaker and creator</span>
            <span>Women&apos;s empowerment advocate</span>
            <span>Founder of Me and My Sisters</span>
          </div>
        </div>
      </section>

      <section className="section finalSection" id="order">
        <div className="finalCard">
          <span className="sectionLabel">Order the ebook</span>
          <h2>Order your copy and start reading with the right conversation in front of you.</h2>
          <p>
            Reach out on WhatsApp to get your copy of <em>Let&apos;s Fix</em> and begin a more intentional journey through
            healing, discernment, and godly love.
          </p>

          <div className="ctaRow">
            <Link className="button buttonPrimary" href={contact.whatsappHref} target="_blank" rel="noreferrer">
              WhatsApp {contact.phoneLocal}
              <ArrowIcon />
            </Link>
            <a className="button buttonSecondary" href={`tel:${contact.phoneIntl}`}>
              Call {contact.phoneIntl}
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
