/* eslint-disable @next/next/no-img-element */
import Link from "next/link";

import { BibleQuickAccess } from "@/components/bible-quick-access";
import { PageIntro } from "@/components/page-intro";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { formatDevotionalDate, readPublicDevotionals, readTodayDevotional } from "@/lib/devotionals";

function looksLikeVideo(url: string) {
  return /\.(mp4|webm|mov)$/i.test(url);
}

function looksLikeImage(url: string) {
  return /\.(png|jpe?g|webp|gif)$/i.test(url);
}

function DevotionalMedia({ mediaUrl, title }: { mediaUrl?: string; title: string }) {
  if (!mediaUrl) {
    return null;
  }

  if (looksLikeVideo(mediaUrl)) {
    return (
      <div className="devotionalMediaFrame">
        <video controls preload="metadata" poster="">
          <source src={mediaUrl} />
        </video>
      </div>
    );
  }

  if (looksLikeImage(mediaUrl)) {
    return (
      <div className="devotionalMediaFrame">
        <img src={mediaUrl} alt={title} />
      </div>
    );
  }

  return (
    <div className="devotionalMediaLink">
      <a className="button buttonSecondary" href={mediaUrl} target="_blank" rel="noreferrer">
        Open devotional media
      </a>
    </div>
  );
}

export default async function DevotionalsPage() {
  const [todayDevotional, devotionals] = await Promise.all([readTodayDevotional(), readPublicDevotionals()]);
  const archive = devotionals.filter((devotional) => devotional.id !== todayDevotional?.id).slice(0, 8);

  return (
    <main className="pageShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      <PublicHeader />

      <section className="section">
        <PageIntro
          label="Daily devotionals"
          title="A premium daily devotional rhythm for healing, wisdom, and Christ-shaped relationships."
          text="Each devotional can carry a theme, core scripture, prayer, reflection questions, action step, and media so the experience feels guided instead of disposable."
        />
      </section>

      <section className="section devotionalHubSection">
        {todayDevotional ? (
          <article className="devotionalSpotlight">
            <div className="devotionalSpotlightCopy">
              <div className="advicePillRow">
                <span className="sectionLabel">Today&apos;s devotional</span>
                <span className="advisorMiniLabel">{todayDevotional.accessTier}</span>
                <span className="advisorMiniLabel">{todayDevotional.theme}</span>
              </div>
              <h2>{todayDevotional.title}</h2>
              <p>{todayDevotional.summary}</p>

              <div className="devotionalVerseCallout">
                <strong>{todayDevotional.keyVerseReference}</strong>
                <p>{todayDevotional.keyVerseText}</p>
              </div>

              <div className="devotionalContentBlock">
                <h3>Today&apos;s reading</h3>
                <p>{todayDevotional.body}</p>
              </div>

              {todayDevotional.additionalVerses.length > 0 ? (
                <div className="devotionalContentBlock">
                  <h3>Additional verses</h3>
                  <ul className="advisorList">
                    {todayDevotional.additionalVerses.map((verse) => (
                      <li key={verse}>{verse}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {todayDevotional.reflectionQuestions.length > 0 ? (
                <div className="devotionalContentBlock">
                  <h3>Reflect on this</h3>
                  <ol className="advisorOrderedList">
                    {todayDevotional.reflectionQuestions.map((question) => (
                      <li key={question}>{question}</li>
                    ))}
                  </ol>
                </div>
              ) : null}

              <div className="devotionalContentBlock">
                <h3>Prayer</h3>
                <p>{todayDevotional.prayer}</p>
              </div>

              <div className="devotionalActionCard">
                <span className="advisorMiniLabel">Action step</span>
                <p>{todayDevotional.actionStep}</p>
              </div>

              {todayDevotional.audioUrl ? (
                <div className="devotionalAudioCard">
                  <span className="advisorMiniLabel">Listen</span>
                  <audio controls preload="metadata">
                    <source src={todayDevotional.audioUrl} />
                  </audio>
                </div>
              ) : null}

              <div className="sectionActions">
                <Link className="button buttonPrimary" href={`/devotionals/${todayDevotional.slug}`}>
                  Open full devotional
                </Link>
              </div>
            </div>

            <div className="devotionalSpotlightMedia">
              <DevotionalMedia mediaUrl={todayDevotional.mediaUrl} title={todayDevotional.title} />
              <div className="devotionalSpotlightMeta">
                <strong>{formatDevotionalDate(todayDevotional.publishDate)}</strong>
                <span>{todayDevotional.language}</span>
              </div>
            </div>
          </article>
        ) : (
          <article className="adviceEmptyState">
            <h3>No devotional is published yet.</h3>
            <p>The admin dashboard is ready for publishing daily devotionals as soon as the first entry is added.</p>
          </article>
        )}
      </section>

      <section className="section">
        <div className="sectionHeading splitHeading">
          <div>
            <span className="sectionLabel">Archive</span>
            <h2>Past devotionals stay accessible like a premium library, not a disappearing feed.</h2>
          </div>
          <p>Readers can return to earlier devotionals by theme, scripture, language, and relationship season.</p>
        </div>

        <div className="devotionalArchiveGrid">
          {archive.map((devotional) => (
            <article className="devotionalArchiveCard" key={devotional.id}>
              <div className="advicePillRow">
                <span className="advisorMiniLabel">{devotional.theme}</span>
                <span className="advisorMiniLabel">{devotional.accessTier}</span>
              </div>
              <h3>{devotional.title}</h3>
              <p>{devotional.summary}</p>
              <div className="devotionalArchiveMeta">
                <strong>{devotional.keyVerseReference}</strong>
                <span>{formatDevotionalDate(devotional.publishDate)}</span>
              </div>
              <Link className="button buttonSecondary" href={`/devotionals/${devotional.slug}`}>
                Read devotional
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <BibleQuickAccess />
      </section>

      <PublicFooter />
    </main>
  );
}
