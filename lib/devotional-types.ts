import type { AdviceLanguage } from "@/lib/advice-types";

export type DevotionalStatus = "draft" | "scheduled" | "published";
export type DevotionalAccessTier = "free" | "premium";

export type Devotional = {
  id: string;
  slug: string;
  title: string;
  theme: string;
  summary: string;
  body: string;
  keyVerseReference: string;
  keyVerseText: string;
  additionalVerses: string[];
  reflectionQuestions: string[];
  actionStep: string;
  prayer: string;
  mediaUrl?: string;
  audioUrl?: string;
  language: AdviceLanguage;
  accessTier: DevotionalAccessTier;
  status: DevotionalStatus;
  publishDate: string;
  createdAt: string;
  updatedAt: string;
};

export type DevotionalInput = Omit<Devotional, "id" | "slug" | "createdAt" | "updatedAt"> & {
  slug?: string;
};

export type DevotionalMetrics = {
  total: number;
  published: number;
  scheduled: number;
  draft: number;
  premium: number;
};
