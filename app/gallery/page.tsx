import Image from "next/image";

import { PublicFooter } from "@/components/public-footer";
import { PublicHeader } from "@/components/public-header";
import { PageIntro } from "@/components/page-intro";
import { gallerySets } from "@/lib/site-content";

const sections = [
  {
    label: "Sinovia with the book",
    images: gallerySets.sinovia
  },
  {
    label: "Readers holding the book",
    images: gallerySets.readers
  },
  {
    label: "Book details",
    images: gallerySets.book
  },
  {
    label: "Extended gallery",
    images: gallerySets.new
  }
];

export default function GalleryPage() {
  return (
    <main className="pageShell">
      <div className="pageGlow pageGlowLeft" />
      <div className="pageGlow pageGlowRight" />

      <PublicHeader />

      <section className="section">
        <PageIntro
          label="Gallery"
          title="A visual world around Let's Fix."
          text="A premium gallery of author portraits, reader moments, and book details that reflects the warmth, beauty, and community surrounding Let's Fix."
        />
      </section>

      {sections.map((section) => (
        <section className="section gallerySectionBlock" key={section.label}>
          <div className="sectionHeading">
            <span className="sectionLabel">{section.label}</span>
          </div>
          <div className="fullGalleryGrid">
            {section.images.map((src) => (
              <figure className="fullGalleryCard" key={src}>
                <Image src={src} alt={`${section.label} image`} fill sizes="(max-width: 900px) 90vw, 24vw" className="coverImage" />
              </figure>
            ))}
          </div>
        </section>
      ))}

      <PublicFooter />
    </main>
  );
}
