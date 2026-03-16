import Image from "next/image";
import { ReviewsSection } from "@/components/reviews-section";

const chapterJourney = [
  {
    step: "01",
    title: "Let's Fix",
    scripture: "Psalm 51:10",
    text:
      "The book opens with a broken flip-flop and an honest question: what do you do when something you need is falling apart? Before relationships can be mended, you first have to want to fix them — and understand why."
  },
  {
    step: "02",
    title: "The Author's Story",
    scripture: "Romans 8:28",
    text:
      "Maureen shares her own heartbreak without filters — relationships entered too soon, love mistaken for loneliness, and a betrayal that left her comparing herself to a course-mate. Her pain is the reader's permission to be honest about theirs."
  },
  {
    step: "03",
    title: "God's View of Relationships",
    scripture: "Philippians 2:5",
    text:
      "Dating has no direct scripture, but everything falls under 'in whatever you do, acknowledge Him.' The chapter builds a picture of Christ as the model: sacrificial, forgiving, humble, faithful, and committed."
  },
  {
    step: "04",
    title: "Steps Before Dating",
    scripture: "Proverbs 3:5–6",
    text:
      "Are you ready? Do you know what you want? Are your intentions honourable? This chapter pushes readers to examine themselves first — before they bring someone else into the equation."
  },
  {
    step: "05",
    title: "What to Look For",
    scripture: "Amos 3:3",
    text:
      "Purpose, maturity, trust, communication, shared faith — these are not extras. The chapter walks through each quality that makes a relationship worth building, with searching questions to ask yourself along the way."
  },
  {
    step: "06",
    title: "Are You With the Right Partner?",
    scripture: "1 John 4:18",
    text:
      "The signs are practical: you feel energised by their presence, you plan a future together without hesitation, and your intuition has peace. Real love begins after you truly know someone — not before."
  },
  {
    step: "07",
    title: "Resting on God's Promises",
    scripture: "John 16:33",
    text:
      "Rest is not passive — it is the confidence of someone who knows what God has spoken. This chapter reframes anxiety about love into a settled trust that God finishes what He starts, in relationships and in us."
  },
  {
    step: "08",
    title: "Other People's Experience",
    scripture: "Proverbs 11:14",
    text:
      "Five married individuals share their stories — toxic relationships survived, fear overcome, prophecies tested, and a first love rediscovered after divorce. Real, unguarded, and full of things only hindsight can teach."
  },
  {
    step: "09",
    title: "Author's Advice & Prayer",
    scripture: "Exodus 14:15",
    text:
      "Crying won't solve it. The final chapter is a direct word: move on, choose healing, and know that God never brings us something we cannot handle. It closes with a scripture-anchored prayer over the reader's life."
  }
];

const forCards = [
  {
    eyebrow: "If you are still healing",
    title: "You are not behind.",
    text:
      "Maureen spent two years deliberately single after heartbreak — rebuilding her confidence and her relationship with God. This book begins where you are, not where you wish you were."
  },
  {
    eyebrow: "If you are discerning",
    title: "Feelings are not enough.",
    text:
      "Purpose, spiritual alignment, maturity, trust, and communication are treated as the load-bearing walls of any lasting relationship. The book gives you a real framework for evaluating what you have."
  },
  {
    eyebrow: "If you are tempted to give up",
    title: "Not everything broken should be discarded.",
    text:
      "Some things — and some people — are worth the work of repair. The book makes the case, gently and honestly, for choosing restoration over retreat when God is truly at the centre."
  }
];

const endorsements = [
  {
    name: "Nelson Longesha",
    role: "Award-winning author",
    books: "The Unspoken Side of Modern Dating",
    quote:
      "Sinovia Mulenga displays remarkable vulnerability, inviting the reader into her journey — highlighting mistakes, lessons, and personal growth. A must-read for anyone determined to cultivate 'wow-kind' relationships."
  },
  {
    name: "Solomon Arthur Chenga",
    role: "ACTS29 Koinonia Chairperson",
    books: null,
    quote:
      "It offers wisdom that will help you heal, recognise your worth, and reshape your relationship journey while holding onto the belief in Godly, purpose-driven unions."
  },
  {
    name: "Pastor Fridah Nkweto",
    role: "Kingdom Family Ministries",
    books: null,
    quote:
      "What I love most about this book is its practical approach — it applies to all types of relationships, whether in marriage, courtship, dating, or friendships."
  },
  {
    name: "Pastor Charmaine Sakala",
    role: "Faith Elevation Ministries",
    books: null,
    quote:
      "One of the most powerful themes is the emphasis on Christ-like love. True love and relationships are best understood through a deeper connection with Christ."
  }
];

const galleryMoments = [
  {
    number: "01",
    title: "Readers meeting the book in real life",
    text:
      "The image set works best as a living gallery: people holding the book, reading it quietly, and carrying it into ordinary spaces."
  },
  {
    number: "02",
    title: "A softer proof of community",
    text:
      "Instead of retelling every participant interview on the landing page, the site now lets the visuals do more of the emotional work."
  },
  {
    number: "03",
    title: "Designed like a gallery, not a report",
    text:
      "The book still contains lived testimony, but the public page now presents that energy as atmosphere, movement, and reader presence."
  }
];

const faqs = [
  {
    question: "Who is this ebook for?",
    answer:
      "It is for anyone navigating heartbreak, singleness, dating, courtship, or marriage who wants a faith-rooted perspective on how to love and be loved well."
  },
  {
    question: "What makes Let's Fix different from other relationship books?",
    answer:
      "It blends biblical reflection, the author's own unfiltered personal testimony, endorsements from Christian leaders, and lived relationship wisdom. It does not offer detached advice — it offers earned wisdom."
  },
  {
    question: "Is it only about romantic relationships?",
    answer:
      "Romantic relationships are central, but the principles — sacrifice, forgiveness, humility, communication, trust — extend to every meaningful bond: friendships, family, and our relationship with God."
  },
  {
    question: "How long is it and how do I receive it?",
    answer:
      "Let's Fix is 66 pages across nine chapters. After ordering via WhatsApp, the ebook is delivered digitally so you can read it on your phone immediately."
  }
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 2 1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8L12 2Zm7 13 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15ZM6 15l1 2.5L9.5 18 7 19l-1 2.5L5 19l-2.5-1L5 17.5 6 15Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 3v18M3 12h18" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="pageShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      {/* ─── Topbar ─────────────────────────────────────────── */}
      <header className="topbar">
        <a className="brand" href="#home">
          <span className="brandMark">LF</span>
          <span>
            Let&apos;s Fix
            <small>A Guide on Godly Relationships</small>
          </span>
        </a>

        <nav className="nav">
          <a href="#journey">The Book</a>
          <a href="#reviews">Reviews</a>
          <a href="#gallery">Gallery</a>
          <a href="#author">Author</a>
          <a href="#order">Order</a>
        </nav>
      </header>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="hero section" id="home">
        <div className="heroCopy">
          <div className="eyebrowGroup">
            <span className="eyebrow">66 pages · 9 chapters · 1 honest voice</span>
            <span className="eyebrow mutedEyebrow">Available now as an ebook</span>
          </div>

          <h1>
            Even broken vessels
            <span> can become beautiful again.</span>
          </h1>

          <p className="lede">
            <em>Let&apos;s Fix</em> is Maureen Sinovia Mulenga&apos;s faith-centred guide through heartbreak, healing,
            and the kind of love that is built on sacrifice, purpose, and the character of Christ.
          </p>

          <div className="ctaRow">
            <a
              className="button buttonPrimary"
              href="https://wa.me/260777504316?text=Hi%20I%27d%20love%20to%20order%20a%20copy%20of%20Let%27s%20Fix."
              target="_blank"
              rel="noreferrer"
            >
              Order on WhatsApp
              <ArrowIcon />
            </a>
            <a className="button buttonSecondary" href="#journey">
              Explore the book
            </a>
          </div>

          <div className="heroStats">
            <div>
              <strong>9 chapters</strong>
              <span>from heartbreak to wholeness</span>
            </div>
            <div>
              <strong>Reader gallery</strong>
              <span>moments, reels, and book imagery</span>
            </div>
            <div>
              <strong>Christ-centred</strong>
              <span>dating, courtship, marriage</span>
            </div>
          </div>
        </div>

        <div className="heroArt">
          <div className="heroStage">
            <div className="bookFrame largeFrame">
              <Image
                src="/media/book-standing.jpeg"
                alt="The Let's Fix book standing upright"
                fill
                priority
                sizes="(max-width: 900px) 80vw, 34vw"
                className="coverImage"
              />
            </div>

            <div className="bookFrame floatingFrame">
              <Image
                src="/media/book-hero.jpeg"
                alt="A close-up promotional photo of Let's Fix"
                fill
                sizes="(max-width: 900px) 42vw, 18vw"
                className="coverImage"
              />
            </div>

            <article className="quoteCard">
              <div className="iconBubble">
                <SparkIcon />
              </div>
              <p>
                &ldquo;Giving up isn&apos;t always the answer. Heartbreaks are not the end — they are lessons.&rdquo;
              </p>
            </article>

            <article className="authorMiniCard">
              <div className="authorMiniImage">
                <Image
                  src="/media/author.jpeg"
                  alt="Author Maureen Sinovia Mulenga"
                  fill
                  sizes="140px"
                  className="coverImage"
                />
              </div>
              <div>
                <span>Written by</span>
                <strong>Maureen Sinovia Mulenga</strong>
                <small>Speaker · Entrepreneur · Founder of Me and My Sisters</small>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ─── Dedication Band ─────────────────────────────────── */}
      <div className="dedicationBand">
        <div className="dedicationInner">
          <span className="dedicationLabel">Dedicated to everyone standing at the edge of giving up</span>
          <blockquote className="dedicationQuote">
            &ldquo;You cannot just give up on someone because the situation is not ideal. Great relationships aren&apos;t great because they have no problems — they are great because both people care enough about each other to find a way to make it work.&rdquo;
          </blockquote>
          <cite className="dedicationCite">— Charles Orlando</cite>
        </div>
      </div>

      {/* ─── For Whom ────────────────────────────────────────── */}
      <section className="section forSection">
        <div className="sectionHeading">
          <span className="sectionLabel">Who this book is for</span>
          <h2>Written for the heart that has been here before.</h2>
        </div>

        <div className="forGrid">
          {forCards.map((card) => (
            <article className="forCard" key={card.title}>
              <span className="forEyebrow">{card.eyebrow}</span>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>

        <div className="ribbonPanel">
          <div className="ribbonCopy">
            <span className="sectionLabel">At a glance</span>
            <h3>Testimony. Scripture. A gallery of presence. And a prayer at the end.</h3>
            <p>
              The manuscript moves from personal pain to practical discernment, then outward into testimony,
              endorsements from pastors and authors, and a closing prayer spoken directly over the reader.
            </p>
          </div>
          <div className="ribbonImage">
            <Image
              src="/media/book-stack.jpeg"
              alt="A stack of Let's Fix copies"
              fill
              sizes="(max-width: 900px) 90vw, 32vw"
              className="coverImage"
            />
          </div>
        </div>
      </section>

      {/* ─── Chapter Journey ─────────────────────────────────── */}
      <section className="section journeySection" id="journey">
        <div className="sectionHeading narrow">
          <span className="sectionLabel">Nine chapters</span>
          <h2>From shattered expectations to God-shaped love.</h2>
          <p>
            The chapters build like a conversation between the author and the reader — honest, searching, and always moving
            toward wholeness.
          </p>
        </div>

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

      {/* ─── Author Pull Quote ───────────────────────────────── */}
      <div className="authorPullQuote">
        <div className="pullQuoteInner">
          <div className="pullQuoteIcon">
            <CrossIcon />
          </div>
          <blockquote>
            I called myself cursed. I laughed at myself for helping my friends work out their relationships while mine kept
            on flopping. I was so lost and consumed with my situation that I couldn&apos;t see that God was teaching me
            something.
          </blockquote>
          <cite>— Maureen Sinovia Mulenga, Chapter Two</cite>
        </div>
      </div>

      {/* ─── Endorsements ────────────────────────────────────── */}
      <section className="section endorsementsSection">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">Endorsed by voices of faith</span>
            <h2>Leaders who recognise earned wisdom when they read it.</h2>
          </div>
          <p>
            Four Christian leaders — pastors, chairpersons, award-winning authors — each point to the same strengths:
            vulnerability, Christ-like love, and the practical courage to repair rather than retreat.
          </p>
        </div>

        <div className="endorsementGrid">
          {endorsements.map((endorsement) => (
            <article className="endorsementCard" key={endorsement.name}>
              <p className="endorseQuote">&ldquo;{endorsement.quote}&rdquo;</p>
              <div className="endorseFooter">
                <strong>{endorsement.name}</strong>
                <span>{endorsement.role}</span>
                {endorsement.books && <small>{endorsement.books}</small>}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Media / Voices ──────────────────────────────────── */}
      <section className="section mediaSection" id="gallery">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">Gallery</span>
            <h2>A warm visual gallery around the book.</h2>
          </div>
          <p>
            The page uses your images as a gallery rather than a participant roll call: portraits, reader moments,
            product shots, and reels that make the book feel present and shared.
          </p>
        </div>

        <div className="mediaLayout">
          <div className="mediaMosaic">
            <figure className="mosaicTall">
              <Image
                src="/media/reader-indoor.jpeg"
                alt="A reader seated indoors reading Let's Fix"
                fill
                sizes="(max-width: 900px) 90vw, 24vw"
                className="coverImage"
              />
            </figure>
            <figure className="mosaicWide">
              <Image
                src="/media/promo-card.jpeg"
                alt="A promotional card for Let's Fix"
                fill
                sizes="(max-width: 900px) 90vw, 34vw"
                className="coverImage"
              />
            </figure>
            <figure className="mosaicSquare">
              <Image
                src="/media/reader-smile.jpeg"
                alt="A smiling reader holding two copies of Let's Fix"
                fill
                sizes="(max-width: 900px) 90vw, 18vw"
                className="coverImage"
              />
            </figure>
            <figure className="mosaicSquare">
              <Image
                src="/media/reader-lounge.jpeg"
                alt="A reader seated in a lounge reading Let's Fix"
                fill
                sizes="(max-width: 900px) 90vw, 18vw"
                className="coverImage"
              />
            </figure>
          </div>

          <div className="mediaSidebar">
            <div className="videoCard">
              <video autoPlay muted loop playsInline preload="metadata" poster="/media/reader-indoor.jpeg">
                <source src="/media/reel-reading.mp4" type="video/mp4" />
              </video>
              <div>
                <span className="sectionLabel">Motion</span>
                <h3>Quiet, human, and close to the book.</h3>
              </div>
            </div>

            <div className="videoCard compactVideo">
              <video autoPlay muted loop playsInline preload="metadata" poster="/media/book-standing.jpeg">
                <source src="/media/reel-ebook.mp4" type="video/mp4" />
              </video>
              <div>
                <span className="sectionLabel">Digital format</span>
                <h3>The ebook lives on your phone, not just a shelf.</h3>
              </div>
            </div>
          </div>
        </div>

        <div className="voiceGrid">
          {galleryMoments.map((voice) => (
            <article className="voiceCard" key={voice.number}>
              <span className="voiceNumber">{voice.number}</span>
              <h3>{voice.title}</h3>
              <p>{voice.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── Author ──────────────────────────────────────────── */}
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
          <h2>She wrote this from inside the pain, not from a distance.</h2>
          <p>
            Maureen Sinovia Mulenga holds a Bachelor&apos;s degree in Arts with Education from the University of Zambia.
            She is a devoted Christian, public speaker, entrepreneur, and content creator — but before all of that, she was
            a woman who sat down after her breakups and asked herself, honestly, what she had been missing.
          </p>
          <p>
            Two years of deliberate singleness followed. She read, she prayed, she encountered God. <em>Let&apos;s Fix</em> is
            what came out of that season. She is also the founder of <strong>Me and My Sisters</strong>, a Christian organisation
            dedicated to empowering women to build courageous, faith-driven lives and homes.
          </p>

          <div className="authorBadges">
            <span>Faith-centred voice</span>
            <span>Personal testimony</span>
            <span>Women&apos;s empowerment</span>
            <span>Relationship guidance</span>
          </div>
        </div>
      </section>

      {/* ─── Reviews ─────────────────────────────────────────── */}
      <ReviewsSection />

      {/* ─── FAQ ─────────────────────────────────────────────── */}
      <section className="section faqSection">
        <div className="sectionHeading narrow">
          <span className="sectionLabel">Quick answers</span>
          <h2>Questions worth asking before you order.</h2>
        </div>

        <div className="faqList">
          {faqs.map((faq) => (
            <details className="faqItem" key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ─── Final CTA ───────────────────────────────────────── */}
      <section className="section finalSection" id="order">
        <div className="finalCard">
          <span className="sectionLabel">Ready when you are</span>
          <h2>The first step toward restoration is simply deciding to begin.</h2>
          <p>
            Order <em>Let&apos;s Fix</em> today over WhatsApp. The ebook is delivered immediately, and the conversation
            that follows — between you, the pages, and God — is entirely yours.
          </p>

          <div className="ctaRow">
            <a
              className="button buttonPrimary"
              href="https://wa.me/260777504316?text=Hi%20I%27d%20love%20to%20order%20a%20copy%20of%20Let%27s%20Fix."
              target="_blank"
              rel="noreferrer"
            >
              Start an order
              <ArrowIcon />
            </a>
            <a className="button buttonSecondary" href="tel:+260777504316">
              Call the contact line
            </a>
          </div>

          <p className="finalScripture">
            &ldquo;Create in me a clean heart, O God; and renew a right spirit within me.&rdquo; — Psalm 51:10
          </p>
        </div>
      </section>
    </main>
  );
}
