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

  const columns = database
    .prepare("PRAGMA table_info(reviews)")
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

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

  const result = database.prepare("SELECT COUNT(*) AS count FROM reviews").get() as { count: number };

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
