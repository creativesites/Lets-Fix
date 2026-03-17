import Image from "next/image";

import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PageIntro } from "@/components/page-intro";
import { quoteImageCards, quoteTextCards } from "@/lib/site-content";

export default function QuotesPage() {
  return (
    <main className="pageShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      <PublicHeader />

      <section className="section">
        <PageIntro
          label="Quotes"
          title="A quote wall for the relationship wisdom behind the book."
          text="The quotes page gives the visual quote assets their own premium surface and pairs them with short supporting reflections rooted in the book's message."
        />

        <div className="quoteWallGrid">
          {quoteImageCards.map((item) => (
            <figure className="quoteWallImage" key={item.src}>
              <Image src={item.src} alt={item.alt} fill sizes="(max-width: 900px) 90vw, 30vw" className="coverImage" />
            </figure>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="quoteTextWall">
          {quoteTextCards.map((quote) => (
            <article className="voiceCard" key={quote.title}>
              <span className="voiceNumber">Quote note</span>
              <h3>{quote.title}</h3>
              <p>{quote.text}</p>
            </article>
          ))}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}

