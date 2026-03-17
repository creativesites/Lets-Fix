import { DEFAULT_ADVICE_LANGUAGE, DEFAULT_FAITH_STYLE, isAdviceFaithStyle, isAdviceLanguage } from "@/lib/advice-config";
import type {
  AdviceComponent,
  AdviceFaithStyle,
  AdviceLanguage,
  AdvicePersonalization,
  AdviceResponse,
  AdviceSafety,
  AdviceTone
} from "@/lib/advice-types";

const SAFE_TONES: AdviceTone[] = ["warm", "calm", "hopeful", "alert"];
const COMPONENT_TYPES = new Set<AdviceComponent["type"]>([
  "intro_card",
  "quote_card",
  "scripture_meditation",
  "book_guidance",
  "reflection_prompt",
  "prayer_card",
  "green_flags",
  "red_flags",
  "conversation_planner",
  "next_steps",
  "heartbreak_plan",
  "journal_prompt",
  "local_support_card",
  "boundary_script",
  "repair_toolkit",
  "spark_questions",
  "conviction_check",
  "date_architect",
  "pause_timer",
  "appreciation_log"
]);

function sanitizeString(value: unknown, maxLength = 400) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function sanitizeStringList(value: unknown, maxItems = 6, maxLength = 160) {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueValues = new Set<string>();

  value.forEach((item) => {
    const sanitized = sanitizeString(item, maxLength);
    if (sanitized) {
      uniqueValues.add(sanitized);
    }
  });

  return Array.from(uniqueValues).slice(0, maxItems);
}

function isTone(value: unknown): value is AdviceTone {
  return typeof value === "string" && SAFE_TONES.includes(value as AdviceTone);
}

function parseSafety(value: unknown): AdviceSafety | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;

  return {
    abuseConcern: Boolean(record.abuseConcern),
    urgentSupport: Boolean(record.urgentSupport),
    note: sanitizeString(record.note, 240) || undefined
  };
}

function parseComponent(value: unknown): AdviceComponent | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type : "";
  const tone = isTone(record.tone) ? record.tone : type === "red_flags" ? "alert" : "warm";

  if (!COMPONENT_TYPES.has(type as AdviceComponent["type"])) {
    return null;
  }

  switch (type) {
    case "intro_card":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        body: sanitizeString(record.body, 420)
      };
    case "quote_card":
      return {
        type,
        tone,
        quote: sanitizeString(record.quote, 260),
        source: sanitizeString(record.source, 120)
      };
    case "scripture_meditation":
      return {
        type,
        tone,
        verse: sanitizeString(record.verse, 260),
        reference: sanitizeString(record.reference, 120),
        reflection: sanitizeString(record.reflection, 260)
      };
    case "book_guidance":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        points: sanitizeStringList(record.points, 5, 180)
      };
    case "reflection_prompt":
      return {
        type,
        tone,
        prompt: sanitizeString(record.prompt, 220),
        helper: sanitizeString(record.helper, 220)
      };
    case "prayer_card":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        prayer: sanitizeString(record.prayer, 400)
      };
    case "green_flags":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        items: sanitizeStringList(record.items, 5, 180)
      };
    case "red_flags":
      return {
        type,
        tone: "alert",
        title: sanitizeString(record.title, 120),
        items: sanitizeStringList(record.items, 5, 180)
      };
    case "conversation_planner":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        steps: sanitizeStringList(record.steps, 6, 180)
      };
    case "next_steps":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        steps: sanitizeStringList(record.steps, 6, 180)
      };
    case "heartbreak_plan":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        steps: sanitizeStringList(record.steps, 6, 180)
      };
    case "journal_prompt":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        prompts: sanitizeStringList(record.prompts, 6, 180)
      };
    case "local_support_card":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        contacts: sanitizeStringList(record.contacts, 6, 200),
        guidance: sanitizeString(record.guidance, 240)
      };
    case "boundary_script":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        script: sanitizeString(record.script, 500)
      };
    case "repair_toolkit":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        scripts: sanitizeStringList(record.scripts, 5, 200)
      };
    case "spark_questions":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        questions: sanitizeStringList(record.questions, 6, 200)
      };
    case "conviction_check":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        checks: sanitizeStringList(record.checks, 6, 160)
      };
    case "date_architect":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        ideas: sanitizeStringList(record.ideas, 6, 220)
      };
    case "pause_timer":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        durationMinutes: Math.min(Math.max(Number(record.durationMinutes) || 5, 1), 20),
        guidance: sanitizeString(record.guidance, 260)
      };
    case "appreciation_log":
      return {
        type,
        tone,
        title: sanitizeString(record.title, 120),
        prompts: sanitizeStringList(record.prompts, 5, 180)
      };
    default:
      return null;
  }
}

export function parsePersonalization(value: unknown): AdvicePersonalization | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const personalization: AdvicePersonalization = {
    firstName: sanitizeString(record.firstName, 80) || undefined,
    partnerName: sanitizeString(record.partnerName, 80) || undefined,
    relationshipStage: sanitizeString(record.relationshipStage, 80) || undefined,
    goals: sanitizeStringList(record.goals, 6, 100),
    painPoints: sanitizeStringList(record.painPoints, 8, 100),
    prayerTopics: sanitizeStringList(record.prayerTopics, 8, 100),
    communicationStyle: sanitizeString(record.communicationStyle, 140) || undefined,
    faithContext: sanitizeString(record.faithContext, 140) || undefined,
    boundariesFocus: sanitizeStringList(record.boundariesFocus, 6, 100)
  };

  const hasValues = Object.values(personalization).some((entry) => {
    if (Array.isArray(entry)) {
      return entry.length > 0;
    }

    return Boolean(entry);
  });

  return hasValues ? personalization : undefined;
}

export function mergePersonalization(
  current: AdvicePersonalization,
  incoming?: AdvicePersonalization
): AdvicePersonalization {
  if (!incoming) {
    return current;
  }

  const merged: AdvicePersonalization = {
    firstName: incoming.firstName || current.firstName,
    partnerName: incoming.partnerName || current.partnerName,
    relationshipStage: incoming.relationshipStage || current.relationshipStage,
    communicationStyle: incoming.communicationStyle || current.communicationStyle,
    faithContext: incoming.faithContext || current.faithContext,
    goals: sanitizeStringList([...(current.goals ?? []), ...(incoming.goals ?? [])], 8, 100),
    painPoints: sanitizeStringList([...(current.painPoints ?? []), ...(incoming.painPoints ?? [])], 10, 100),
    prayerTopics: sanitizeStringList([...(current.prayerTopics ?? []), ...(incoming.prayerTopics ?? [])], 10, 100),
    boundariesFocus: sanitizeStringList([...(current.boundariesFocus ?? []), ...(incoming.boundariesFocus ?? [])], 8, 100)
  };

  return Object.fromEntries(
    Object.entries(merged).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }

      return Boolean(value);
    })
  ) as AdvicePersonalization;
}

export function detectSafetyConcern(input: string) {
  const lowered = input.toLowerCase();
  const abuseConcern =
    /\babuse|abusive|violent|violence|hit me|hurts me|threaten|controlling|forced|rape|assault|beating me|beating us\b/.test(lowered);
  const urgentSupport =
    abuseConcern || /\bsuicidal|kill myself|self harm|end my life|i am not safe|i'm not safe|i feel unsafe\b/.test(lowered);

  return {
    abuseConcern,
    urgentSupport
  };
}

export function sanitizeAdviceLanguage(value: unknown): AdviceLanguage {
  return isAdviceLanguage(value) ? value : DEFAULT_ADVICE_LANGUAGE;
}

export function sanitizeAdviceFaithStyle(value: unknown): AdviceFaithStyle {
  return isAdviceFaithStyle(value) ? value : DEFAULT_FAITH_STYLE;
}

export function sanitizeAdviceField(value: unknown, maxLength = 80) {
  return sanitizeString(value, maxLength) || undefined;
}

export function parseAdviceResponse(rawText: string): AdviceResponse {
  let parsed: unknown;
  const fallbackReply =
    "I'm with you. Let's slow this down, be honest about what hurts, and look for the kind of wisdom that protects your heart instead of rushing it.";

  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      replyText: sanitizeString(rawText, 1400) || fallbackReply,
      tone: "warm",
      components: [],
      suggestedReplies: []
    };
  }

  const record = parsed as Record<string, unknown>;
  const components = Array.isArray(record.components) ? record.components.map(parseComponent).filter(Boolean) : [];
  const replyText = sanitizeString(record.replyText, 1500);
  const suggestedReplies = sanitizeStringList(record.suggestedReplies, 4, 90);

  return {
    replyText: replyText || fallbackReply,
    tone: isTone(record.tone) ? record.tone : "warm",
    components: components as AdviceComponent[],
    suggestedReplies,
    personalization: parsePersonalization(record.personalization),
    safety: parseSafety(record.safety)
  };
}

export function summarizeAdviceResponse(response: AdviceResponse) {
  const firstComponent = response.components[0];

  if (firstComponent?.type === "intro_card") {
    return firstComponent.body;
  }

  return response.replyText;
}
