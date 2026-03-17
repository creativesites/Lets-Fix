import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PageIntro } from "@/components/page-intro";
import { ReviewsSection } from "@/components/reviews-section";

export default function ReviewsPage() {
  return (
    <main className="pageShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      <PublicHeader />

      <section className="section">
        <PageIntro
          label="Reviews"
          title="Real reader feedback, moderated before it goes live."
          text="Read what readers are saying about the book, then leave your own review to be carefully moderated before it is published."
        />
      </section>

      <ReviewsSection />

      <PublicFooter />
    </main>
  );
}
