import { contact } from "@/lib/site-content";

export function PublicFooter() {
  return (
    <footer className="siteFooter">
      <div className="siteFooterInner">
        <div className="siteFooterBrand">
          <span className="brandMark">LF</span>
          <div>
            <strong>Let&apos;s Fix</strong>
            <p>A gentle, faith-rooted guide to healing, discernment, and godly relationships.</p>
          </div>
        </div>

        <div className="siteFooterContact">
          <a href={contact.whatsappHref} target="_blank" rel="noreferrer">
            WhatsApp {contact.phoneLocal}
          </a>
          <a href={`tel:${contact.phoneIntl}`}>Call {contact.phoneIntl}</a>
        </div>
      </div>
    </footer>
  );
}
