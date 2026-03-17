import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import { createReviewFingerprint, isReviewStatus } from "@/lib/review-utils";

const databaseFilePath = path.join(process.cwd(), "data", "reviews.sqlite");

type SQLiteDatabase = InstanceType<typeof Database>;

const globalForDatabase = globalThis as typeof globalThis & {
  letsFixDatabase?: SQLiteDatabase;
};

function initializeDatabase(database: SQLiteDatabase) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      rating INTEGER NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      fingerprint TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT '',
      moderated_at TEXT
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS advisor_profiles (
      actor_id TEXT PRIMARY KEY,
      actor_type TEXT NOT NULL,
      clerk_user_id TEXT,
      guest_id TEXT,
      display_name TEXT NOT NULL DEFAULT '',
      preferred_language TEXT NOT NULL DEFAULT 'en-ZM',
      ui_language TEXT NOT NULL DEFAULT 'en-ZM',
      conversation_language TEXT NOT NULL DEFAULT 'en-ZM',
      faith_style TEXT NOT NULL DEFAULT 'gentle_christian',
      denomination TEXT NOT NULL DEFAULT '',
      province TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      personalization_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS advisor_sessions (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      mode TEXT NOT NULL DEFAULT 'text',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (actor_id) REFERENCES advisor_profiles(actor_id)
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS advisor_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      role TEXT NOT NULL,
      model_name TEXT NOT NULL DEFAULT '',
      plain_text TEXT NOT NULL DEFAULT '',
      content_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES advisor_sessions(id),
      FOREIGN KEY (actor_id) REFERENCES advisor_profiles(actor_id)
    );
  `);

  database.exec(`
    CREATE TABLE IF NOT EXISTS devotionals (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      theme TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      key_verse_reference TEXT NOT NULL DEFAULT '',
      key_verse_text TEXT NOT NULL DEFAULT '',
      additional_verses_json TEXT NOT NULL DEFAULT '[]',
      reflection_questions_json TEXT NOT NULL DEFAULT '[]',
      action_step TEXT NOT NULL DEFAULT '',
      prayer TEXT NOT NULL DEFAULT '',
      media_url TEXT NOT NULL DEFAULT '',
      audio_url TEXT NOT NULL DEFAULT '',
      language TEXT NOT NULL DEFAULT 'en-ZM',
      access_tier TEXT NOT NULL DEFAULT 'premium',
      status TEXT NOT NULL DEFAULT 'draft',
      publish_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  const columns = database
    .prepare("PRAGMA table_info(reviews)")
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));
  const advisorProfileColumns = database
    .prepare("PRAGMA table_info(advisor_profiles)")
    .all() as Array<{ name: string }>;
  const advisorProfileColumnNames = new Set(advisorProfileColumns.map((column) => column.name));

  if (!columnNames.has("status")) {
    database.exec("ALTER TABLE reviews ADD COLUMN status TEXT NOT NULL DEFAULT 'approved'");
  }

  if (!columnNames.has("fingerprint")) {
    database.exec("ALTER TABLE reviews ADD COLUMN fingerprint TEXT NOT NULL DEFAULT ''");
  }

  if (!columnNames.has("updated_at")) {
    database.exec("ALTER TABLE reviews ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''");
  }

  if (!columnNames.has("moderated_at")) {
    database.exec("ALTER TABLE reviews ADD COLUMN moderated_at TEXT");
  }

  if (!advisorProfileColumnNames.has("preferred_language")) {
    database.exec("ALTER TABLE advisor_profiles ADD COLUMN preferred_language TEXT NOT NULL DEFAULT 'en-ZM'");
  }

  if (!advisorProfileColumnNames.has("ui_language")) {
    database.exec("ALTER TABLE advisor_profiles ADD COLUMN ui_language TEXT NOT NULL DEFAULT 'en-ZM'");
  }

  if (!advisorProfileColumnNames.has("conversation_language")) {
    database.exec("ALTER TABLE advisor_profiles ADD COLUMN conversation_language TEXT NOT NULL DEFAULT 'en-ZM'");
  }

  if (!advisorProfileColumnNames.has("faith_style")) {
    database.exec("ALTER TABLE advisor_profiles ADD COLUMN faith_style TEXT NOT NULL DEFAULT 'gentle_christian'");
  }

  if (!advisorProfileColumnNames.has("denomination")) {
    database.exec("ALTER TABLE advisor_profiles ADD COLUMN denomination TEXT NOT NULL DEFAULT ''");
  }

  if (!advisorProfileColumnNames.has("province")) {
    database.exec("ALTER TABLE advisor_profiles ADD COLUMN province TEXT NOT NULL DEFAULT ''");
  }

  if (!advisorProfileColumnNames.has("city")) {
    database.exec("ALTER TABLE advisor_profiles ADD COLUMN city TEXT NOT NULL DEFAULT ''");
  }

  const backfillRows = database.prepare(
    `
      SELECT id, name, location, rating, message, created_at AS createdAt, status, updated_at AS updatedAt, moderated_at AS moderatedAt
      FROM reviews
    `
  ).all() as Array<{
    id: string;
    name: string;
    location: string;
    rating: number;
    message: string;
    createdAt: string;
    status?: string;
    updatedAt?: string;
    moderatedAt?: string | null;
  }>;

  const backfillStatement = database.prepare(
    `
      UPDATE reviews
      SET fingerprint = @fingerprint,
          status = @status,
          updated_at = @updatedAt,
          moderated_at = @moderatedAt
      WHERE id = @id
    `
  );

  const backfillMany = database.transaction((rows: typeof backfillRows) => {
    rows.forEach((row) => {
      const status = row.status && isReviewStatus(row.status) ? row.status : "approved";
      const createdAt = row.createdAt || new Date().toISOString();
      const updatedAt = row.updatedAt || createdAt;
      const moderatedAt = status === "pending" ? null : row.moderatedAt ?? updatedAt;

      backfillStatement.run({
        id: row.id,
        fingerprint: createReviewFingerprint({
          name: row.name,
          location: row.location,
          rating: row.rating,
          message: row.message
        }),
        status,
        updatedAt,
        moderatedAt
      });
    });
  });

  if (backfillRows.length > 0) {
    backfillMany(backfillRows);
  }

  database.exec("CREATE UNIQUE INDEX IF NOT EXISTS reviews_fingerprint_idx ON reviews(fingerprint)");
  database.exec("CREATE INDEX IF NOT EXISTS advisor_sessions_actor_idx ON advisor_sessions(actor_id, updated_at DESC)");
  database.exec("CREATE INDEX IF NOT EXISTS advisor_messages_session_idx ON advisor_messages(session_id, created_at ASC)");

  const result = database.prepare("SELECT COUNT(*) AS count FROM reviews").get() as { count: number };
  const devotionalResult = database.prepare("SELECT COUNT(*) AS count FROM devotionals").get() as { count: number };

  if (result.count === 0) {
    database
      .prepare(
        `
          INSERT INTO reviews (id, name, location, rating, message, status, fingerprint, created_at, updated_at, moderated_at)
          VALUES (@id, @name, @location, @rating, @message, @status, @fingerprint, @createdAt, @updatedAt, @moderatedAt)
        `
      )
      .run({
        id: crypto.randomUUID(),
        name: "Winston Chikazhe",
        location: "Zambia",
        rating: 5,
        message:
          "Let's Fix is thoughtful, grounding, and easy to connect with. It speaks to healing, purpose, and relationships in a way that feels both personal and practical.",
        status: "approved",
        fingerprint: createReviewFingerprint({
          name: "Winston Chikazhe",
          location: "Zambia",
          rating: 5,
          message:
            "Let's Fix is thoughtful, grounding, and easy to connect with. It speaks to healing, purpose, and relationships in a way that feels both personal and practical."
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        moderatedAt: new Date().toISOString()
      });
  }

  if (devotionalResult.count === 0) {
    const now = new Date().toISOString();
    database
      .prepare(
        `
          INSERT INTO devotionals (
            id,
            slug,
            title,
            theme,
            summary,
            body,
            key_verse_reference,
            key_verse_text,
            additional_verses_json,
            reflection_questions_json,
            action_step,
            prayer,
            media_url,
            audio_url,
            language,
            access_tier,
            status,
            publish_date,
            created_at,
            updated_at
          )
          VALUES (
            @id,
            @slug,
            @title,
            @theme,
            @summary,
            @body,
            @keyVerseReference,
            @keyVerseText,
            @additionalVersesJson,
            @reflectionQuestionsJson,
            @actionStep,
            @prayer,
            @mediaUrl,
            @audioUrl,
            @language,
            @accessTier,
            @status,
            @publishDate,
            @createdAt,
            @updatedAt
          )
        `
      )
      .run({
        id: crypto.randomUUID(),
        slug: "resting-on-gods-promises",
        title: "Resting on God's promises",
        theme: "Peace in waiting",
        summary: "When your heart wants instant clarity, let today's devotional move you back into trust instead of panic.",
        body:
          "Some seasons of love feel loud because uncertainty keeps speaking. This devotional is a reminder that discernment grows stronger when fear stops driving the process. Let God steady your mind before you make demands, chase reassurance, or force an answer that is not yet ready.",
        keyVerseReference: "John 16:33",
        keyVerseText: "In this world you will have trouble. But take heart! I have overcome the world.",
        additionalVersesJson: JSON.stringify(["Philippians 4:6-7", "Isaiah 40:31"]),
        reflectionQuestionsJson: JSON.stringify([
          "Where has fear been louder than faith in my heart recently?",
          "What would peace look like in this relationship season?"
        ]),
        actionStep: "Take ten quiet minutes today to pray before you send any emotionally loaded message.",
        prayer:
          "Lord, settle my heart. Teach me to trust You more than my fears, and help me choose wisdom, peace, and honesty today.",
        mediaUrl: "",
        audioUrl: "",
        language: "en-ZM",
        accessTier: "premium",
        status: "published",
        publishDate: now,
        createdAt: now,
        updatedAt: now
      });
  }
}

export function getDatabase() {
  if (!globalForDatabase.letsFixDatabase) {
    mkdirSync(path.dirname(databaseFilePath), { recursive: true });

    const database = new Database(databaseFilePath);
    initializeDatabase(database);
    globalForDatabase.letsFixDatabase = database;
  }

  return globalForDatabase.letsFixDatabase;
}

export { databaseFilePath };
