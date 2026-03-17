import { AdviceStudio } from "@/components/advice-studio";
import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PageIntro } from "@/components/page-intro";
import { adviceFeatureCards } from "@/lib/site-content";

export default function AdvicePage() {
  return (
    <main className="pageShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      <PublicHeader />

      <section className="section">
        <PageIntro
          label="Advice studio"
          title="A Zambia-shaped Christian relationship advisor, grounded in the heart of the book."
          text="Ask about healing, readiness, heartbreak, communication, boundaries, difficult conversations, prayer, or discernment. The advisor now supports multilingual guidance, profile memory, and richer in-chat tools."
        />

        <div className="forGrid">
          {adviceFeatureCards.map((item) => (
            <article className="forCard" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <AdviceStudio />

      <PublicFooter />
    </main>
  );
}
