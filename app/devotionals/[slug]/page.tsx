/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";

import { BibleQuickAccess } from "@/components/bible-quick-access";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { formatDevotionalDate, readDevotionalBySlug } from "@/lib/devotionals";

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
        <video controls preload="metadata">
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

export default async function DevotionalDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const devotional = await readDevotionalBySlug(slug);

  if (!devotional || devotional.status !== "published" || new Date(devotional.publishDate).getTime() > Date.now()) {
    notFound();
  }

  return (
    <main className="pageShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      <PublicHeader />

      <section className="section devotionalDetailSection">
        <article className="devotionalDetailLayout">
          <div className="devotionalDetailCopy">
            <div className="advicePillRow">
              <span className="sectionLabel">Daily devotional</span>
              <span className="advisorMiniLabel">{devotional.accessTier}</span>
              <span className="advisorMiniLabel">{devotional.theme}</span>
            </div>

            <h1>{devotional.title}</h1>
            <p className="lede">{devotional.summary}</p>

            <div className="devotionalVerseCallout">
              <strong>{devotional.keyVerseReference}</strong>
              <p>{devotional.keyVerseText}</p>
            </div>

            <div className="devotionalContentBlock">
              <h2>Reading</h2>
              <p>{devotional.body}</p>
            </div>

            {devotional.additionalVerses.length > 0 ? (
              <div className="devotionalContentBlock">
                <h2>Additional verses</h2>
                <ul className="advisorList">
                  {devotional.additionalVerses.map((verse) => (
                    <li key={verse}>{verse}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {devotional.reflectionQuestions.length > 0 ? (
              <div className="devotionalContentBlock">
                <h2>Reflection questions</h2>
                <ol className="advisorOrderedList">
                  {devotional.reflectionQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="devotionalContentBlock">
              <h2>Prayer</h2>
              <p>{devotional.prayer}</p>
            </div>

            <div className="devotionalActionCard">
              <span className="advisorMiniLabel">Action step</span>
              <p>{devotional.actionStep}</p>
            </div>

            {devotional.audioUrl ? (
              <div className="devotionalAudioCard">
                <span className="advisorMiniLabel">Listen</span>
                <audio controls preload="metadata">
                  <source src={devotional.audioUrl} />
                </audio>
              </div>
            ) : null}
          </div>

          <aside className="devotionalDetailSidebar">
            <DevotionalMedia mediaUrl={devotional.mediaUrl} title={devotional.title} />

            <article className="adviceSidebarCard">
              <span className="advisorMiniLabel">Devotional details</span>
              <div className="adviceSidebarFacts">
                <div className="adviceFactRow">
                  <span>Published</span>
                  <strong>{formatDevotionalDate(devotional.publishDate)}</strong>
                </div>
                <div className="adviceFactRow">
                  <span>Language</span>
                  <strong>{devotional.language}</strong>
                </div>
                <div className="adviceFactRow">
                  <span>Tier</span>
                  <strong>{devotional.accessTier}</strong>
                </div>
              </div>
            </article>
          </aside>
        </article>
      </section>

      <section className="section">
        <BibleQuickAccess />
      </section>

      <PublicFooter />
    </main>
  );
}
