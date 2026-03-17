import Image from "next/image";
import Link from "next/link";

import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PageIntro } from "@/components/page-intro";
import { chapterJourney, contact, endorsements, gallerySets } from "@/lib/site-content";

export default function BookPage() {
  return (
    <main className="pageShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      <PublicHeader />

      <section className="section">
        <PageIntro
          label="The book"
          title="Nine chapters that move from heartbreak to healing."
          text="Explore the full chapter journey inside Let's Fix, from honest pain and personal reflection to discernment, peace, and Christ-shaped love."
        />

        <div className="bookPageHero">
          <figure className="bookPageHeroImage">
            <Image
              src="/media/book/WhatsApp Image 2026-03-16 at 9.14.52 PM.jpeg"
              alt="A standing copy of Let's Fix"
              fill
              sizes="(max-width: 900px) 90vw, 42vw"
              className="coverImage"
            />
          </figure>
          <div className="bookPageHeroCopy">
            <span className="sectionLabel">What readers receive</span>
            <h2>A guide on godly relationships, written with testimony and scripture in view.</h2>
            <p>
              The book addresses heartbreak, readiness, discernment, Christ-like love, and practical wisdom for choosing
              and keeping healthy relationships.
            </p>
            <div className="ctaRow">
              <Link className="button buttonPrimary" href={contact.whatsappHref} target="_blank" rel="noreferrer">
                Order the ebook
              </Link>
              <Link className="button buttonSecondary" href="/quotes">
                Read the quotes
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="journeyGrid">
          {chapterJourney.map((chapter) => (
            <article className="journeyCard" key={chapter.step}>
              <span className="step">{chapter.step}</span>
              <span className="chapterScripture">{chapter.scripture}</span>
              <h3>{chapter.title}</h3>
              <p>{chapter.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">Book details</span>
            <h2>Product shots, atmosphere, and the voices that endorsed it.</h2>
          </div>
          <p>The book page combines the chapter map with the strongest proof points around the work itself.</p>
        </div>

        <div className="bookShowcaseGrid">
          {gallerySets.book.map((src) => (
            <figure className="bookShowcaseCard" key={src}>
              <Image src={src} alt="Let's Fix book detail photo" fill sizes="(max-width: 900px) 90vw, 22vw" className="coverImage" />
            </figure>
          ))}
        </div>
      </section>

      <section className="section endorsementsSection">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">Endorsements</span>
            <h2>Trusted voices affirm the book&apos;s tone, courage, and practical wisdom.</h2>
          </div>
          <p>Every endorsement points to the same thing: this is relationship guidance shaped by faith and lived experience.</p>
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

      <PublicFooter />
    </main>
  );
}
