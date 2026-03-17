import { DEFAULT_ADVICE_LANGUAGE } from "@/lib/advice-config";
import { getDatabase } from "@/lib/database";
import type { Devotional, DevotionalAccessTier, DevotionalInput, DevotionalMetrics, DevotionalStatus } from "@/lib/devotional-types";

type DevotionalRow = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  summary: string;
  body: string;
  keyVerseReference: string;
  keyVerseText: string;
  additionalVersesJson: string;
  reflectionQuestionsJson: string;
  actionStep: string;
  prayer: string;
  mediaUrl: string;
  audioUrl: string;
  language: Devotional["language"];
  accessTier: DevotionalAccessTier;
  status: DevotionalStatus;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
};

function sanitizeText(value: string, maxLength: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeBody(value: string, maxLength: number) {
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function sanitizeList(rawItems: string[], maxItems: number, maxLength: number) {
  const unique = new Set<string>();

  rawItems.forEach((item) => {
    const sanitized = sanitizeText(item, maxLength);
    if (sanitized) {
      unique.add(sanitized);
    }
  });

  return Array.from(unique).slice(0, maxItems);
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function normalizePublishDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00+02:00`).toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Publish date is invalid.");
  }

  return parsed.toISOString();
}

function parseJsonList(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function toDevotional(row: DevotionalRow): Devotional {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    theme: row.theme,
    summary: row.summary,
    body: row.body,
    keyVerseReference: row.keyVerseReference,
    keyVerseText: row.keyVerseText,
    additionalVerses: parseJsonList(row.additionalVersesJson),
    reflectionQuestions: parseJsonList(row.reflectionQuestionsJson),
    actionStep: row.actionStep,
    prayer: row.prayer,
    mediaUrl: row.mediaUrl || undefined,
    audioUrl: row.audioUrl || undefined,
    language: row.language || DEFAULT_ADVICE_LANGUAGE,
    accessTier: row.accessTier,
    status: row.status,
    publishDate: row.publishDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function validateDevotional(input: DevotionalInput) {
  const title = sanitizeText(input.title, 120);
  const theme = sanitizeText(input.theme, 80);
  const summary = sanitizeText(input.summary, 220);
  const body = sanitizeBody(input.body, 5000);
  const keyVerseReference = sanitizeText(input.keyVerseReference, 80);
  const keyVerseText = sanitizeText(input.keyVerseText, 320);
  const actionStep = sanitizeText(input.actionStep, 200);
  const prayer = sanitizeBody(input.prayer, 800);

  if (title.length < 4) {
    throw new Error("Title must be at least 4 characters.");
  }

  if (theme.length < 2) {
    throw new Error("Theme must be at least 2 characters.");
  }

  if (summary.length < 12) {
    throw new Error("Summary must be at least 12 characters.");
  }

  if (body.length < 40) {
    throw new Error("Devotional body must be at least 40 characters.");
  }

  if (!keyVerseReference || !keyVerseText) {
    throw new Error("A key Bible verse reference and verse text are required.");
  }

  return {
    title,
    slug: toSlug(input.slug || title),
    theme,
    summary,
    body,
    keyVerseReference,
    keyVerseText,
    additionalVerses: sanitizeList(input.additionalVerses ?? [], 8, 120),
    reflectionQuestions: sanitizeList(input.reflectionQuestions ?? [], 6, 180),
    actionStep,
    prayer,
    mediaUrl: sanitizeText(input.mediaUrl ?? "", 500),
    audioUrl: sanitizeText(input.audioUrl ?? "", 500),
    language: input.language || DEFAULT_ADVICE_LANGUAGE,
    accessTier: input.accessTier,
    status: input.status,
    publishDate: normalizePublishDate(input.publishDate)
  };
}

function todayDatePrefix() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lusaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function formatDevotionalDate(value: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    timeZone: "Africa/Lusaka",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export function toDateInputValue(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lusaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

export async function readPublicDevotionals() {
  const database = getDatabase();
  const now = new Date().toISOString();

  const rows = database
    .prepare(
      `
        SELECT
          id,
          slug,
          title,
          theme,
          summary,
          body,
          key_verse_reference AS keyVerseReference,
          key_verse_text AS keyVerseText,
          additional_verses_json AS additionalVersesJson,
          reflection_questions_json AS reflectionQuestionsJson,
          action_step AS actionStep,
          prayer,
          media_url AS mediaUrl,
          audio_url AS audioUrl,
          language,
          access_tier AS accessTier,
          status,
          publish_date AS publishDate,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM devotionals
        WHERE status = 'published' AND publish_date <= ?
        ORDER BY datetime(publish_date) DESC
      `
    )
    .all(now) as DevotionalRow[];

  return rows.map(toDevotional);
}

export async function readAllDevotionals() {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
        SELECT
          id,
          slug,
          title,
          theme,
          summary,
          body,
          key_verse_reference AS keyVerseReference,
          key_verse_text AS keyVerseText,
          additional_verses_json AS additionalVersesJson,
          reflection_questions_json AS reflectionQuestionsJson,
          action_step AS actionStep,
          prayer,
          media_url AS mediaUrl,
          audio_url AS audioUrl,
          language,
          access_tier AS accessTier,
          status,
          publish_date AS publishDate,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM devotionals
        ORDER BY datetime(publish_date) DESC, datetime(updated_at) DESC
      `
    )
    .all() as DevotionalRow[];

  return rows.map(toDevotional);
}

export async function readTodayDevotional() {
  const devotionals = await readPublicDevotionals();
  const today = todayDatePrefix();

  return devotionals.find((item) => toDateInputValue(item.publishDate) === today) ?? devotionals[0] ?? null;
}

export async function readDevotionalBySlug(slug: string) {
  const database = getDatabase();
  const row = database
    .prepare(
      `
        SELECT
          id,
          slug,
          title,
          theme,
          summary,
          body,
          key_verse_reference AS keyVerseReference,
          key_verse_text AS keyVerseText,
          additional_verses_json AS additionalVersesJson,
          reflection_questions_json AS reflectionQuestionsJson,
          action_step AS actionStep,
          prayer,
          media_url AS mediaUrl,
          audio_url AS audioUrl,
          language,
          access_tier AS accessTier,
          status,
          publish_date AS publishDate,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM devotionals
        WHERE slug = ?
      `
    )
    .get(slug) as DevotionalRow | undefined;

  return row ? toDevotional(row) : null;
}

export async function readDevotionalMetrics(): Promise<DevotionalMetrics> {
  const devotionals = await readAllDevotionals();

  return devotionals.reduce<DevotionalMetrics>(
    (metrics, devotional) => {
      metrics.total += 1;
      metrics[devotional.status] += 1;
      if (devotional.accessTier === "premium") {
        metrics.premium += 1;
      }
      return metrics;
    },
    {
      total: 0,
      published: 0,
      scheduled: 0,
      draft: 0,
      premium: 0
    }
  );
}

export async function saveDevotional(input: DevotionalInput) {
  const database = getDatabase();
  const devotional = validateDevotional(input);
  const now = new Date().toISOString();
  const existing = database.prepare("SELECT id FROM devotionals WHERE slug = ?").get(devotional.slug) as { id: string } | undefined;

  if (existing) {
    throw new Error("A devotional with this title or slug already exists. Change the title slightly and try again.");
  }

  const nextDevotional: Devotional = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    ...devotional
  };

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
      ...nextDevotional,
      mediaUrl: nextDevotional.mediaUrl ?? "",
      audioUrl: nextDevotional.audioUrl ?? "",
      additionalVersesJson: JSON.stringify(nextDevotional.additionalVerses),
      reflectionQuestionsJson: JSON.stringify(nextDevotional.reflectionQuestions)
    });

  return nextDevotional;
}

export async function deleteDevotional(id: string) {
  const database = getDatabase();
  database.prepare("DELETE FROM devotionals WHERE id = ?").run(id);
}
