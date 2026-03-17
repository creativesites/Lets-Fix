"use client";

import { useState } from "react";

import { devotionalScriptures } from "@/lib/devotional-scriptures";

export function BibleQuickAccess() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const results = !normalizedQuery
    ? devotionalScriptures
    : devotionalScriptures.filter((entry) => {
        const haystack = `${entry.reference} ${entry.text} ${entry.theme}`.toLowerCase();
        return haystack.includes(normalizedQuery);
      });

  return (
    <section className="bibleQuickAccess">
      <div className="sectionHeading splitHeading">
        <div>
          <span className="sectionLabel">Bible quick access</span>
          <h2>Find a verse quickly while reading or praying.</h2>
        </div>
        <p>This starter scripture panel gives devotional readers fast access to the passages most likely to support healing, waiting, wisdom, and healthy love.</p>
      </div>

      <label className="bibleSearchField">
        <span>Search by theme, verse, or reference</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try peace, Proverbs, love, or waiting" />
      </label>

      <div className="bibleVerseGrid">
        {results.map((entry) => (
          <article className="bibleVerseCard" key={entry.reference}>
            <span className="advisorMiniLabel">{entry.theme}</span>
            <h3>{entry.reference}</h3>
            <p>{entry.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
