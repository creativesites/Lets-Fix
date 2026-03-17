import Link from "next/link";

import { contact, siteNav } from "@/lib/site-content";

export function PublicHeader() {
  return (
    <header className="topbar publicTopbar">
      <Link className="brand" href="/">
        <span className="brandMark">LF</span>
        <span>
          Let&apos;s Fix
          <small>A Guide on Godly Relationships</small>
        </span>
      </Link>

      <nav className="nav">
        {siteNav.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <Link className="button buttonPrimary topbarButton" href={contact.whatsappHref} target="_blank" rel="noreferrer">
        Order
      </Link>
    </header>
  );
}

