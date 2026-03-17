export type AdviceLanguage = "en-ZM" | "bem-ZM" | "ny-ZM" | "toi-ZM" | "loz-ZM";

export type AdviceFaithStyle = "bible_forward" | "gentle_christian" | "prayer_heavy" | "practical_faith";

export type AdviceTone = "warm" | "calm" | "hopeful" | "alert";

export type AdviceComponent =
  | {
      type: "intro_card";
      tone: AdviceTone;
      title: string;
      body: string;
    }
  | {
      type: "quote_card";
      tone: AdviceTone;
      quote: string;
      source: string;
    }
  | {
      type: "scripture_meditation";
      tone: AdviceTone;
      verse: string;
      reference: string;
      reflection: string;
    }
  | {
      type: "book_guidance";
      tone: AdviceTone;
      title: string;
      points: string[];
    }
  | {
      type: "reflection_prompt";
      tone: AdviceTone;
      prompt: string;
      helper: string;
    }
  | {
      type: "prayer_card";
      tone: AdviceTone;
      title: string;
      prayer: string;
    }
  | {
      type: "green_flags";
      tone: AdviceTone;
      title: string;
      items: string[];
    }
  | {
      type: "red_flags";
      tone: "alert";
      title: string;
      items: string[];
    }
  | {
      type: "conversation_planner";
      tone: AdviceTone;
      title: string;
      steps: string[];
    }
  | {
      type: "next_steps";
      tone: AdviceTone;
      title: string;
      steps: string[];
    }
  | {
      type: "heartbreak_plan";
      tone: AdviceTone;
      title: string;
      steps: string[];
    }
  | {
      type: "journal_prompt";
      tone: AdviceTone;
      title: string;
      prompts: string[];
    }
  | {
      type: "local_support_card";
      tone: AdviceTone;
      title: string;
      contacts: string[];
      guidance: string;
    }
  | {
      type: "boundary_script";
      tone: AdviceTone;
      title: string;
      script: string;
    }
  | {
      type: "repair_toolkit";
      tone: AdviceTone;
      title: string;
      scripts: string[];
    }
  | {
      type: "spark_questions";
      tone: AdviceTone;
      title: string;
      questions: string[];
    }
  | {
      type: "conviction_check";
      tone: AdviceTone;
      title: string;
      checks: string[];
    }
  | {
      type: "date_architect";
      tone: AdviceTone;
      title: string;
      ideas: string[];
    }
  | {
      type: "pause_timer";
      tone: AdviceTone;
      title: string;
      durationMinutes: number;
      guidance: string;
    }
  | {
      type: "appreciation_log";
      tone: AdviceTone;
      title: string;
      prompts: string[];
    };

export type AdviceSafety = {
  abuseConcern: boolean;
  urgentSupport: boolean;
  note?: string;
};

export type AdvicePersonalization = {
  firstName?: string;
  partnerName?: string;
  relationshipStage?: string;
  goals?: string[];
  painPoints?: string[];
  prayerTopics?: string[];
  communicationStyle?: string;
  faithContext?: string;
  boundariesFocus?: string[];
};

export type AdviceProfile = {
  actorId: string;
  actorType: "user" | "guest";
  clerkUserId: string | null;
  guestId: string | null;
  displayName: string;
  preferredLanguage: AdviceLanguage;
  uiLanguage: AdviceLanguage;
  conversationLanguage: AdviceLanguage;
  faithStyle: AdviceFaithStyle;
  denomination?: string;
  province?: string;
  city?: string;
  personalization: AdvicePersonalization;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
};

export type AdviceResponse = {
  replyText: string;
  tone: AdviceTone;
  components: AdviceComponent[];
  suggestedReplies?: string[];
  personalization?: AdvicePersonalization;
  safety?: AdviceSafety;
};

export type AdviceMessage = {
  id: string;
  sessionId: string;
  actorId: string;
  role: "user" | "assistant";
  modelName: string;
  plainText: string;
  content: AdviceResponse | null;
  createdAt: string;
};

export type AdviceSession = {
  id: string;
  actorId: string;
  title: string;
  mode: "text";
  createdAt: string;
  updatedAt: string;
};

export type AdviceSessionSummary = Pick<AdviceSession, "id" | "title" | "updatedAt" | "createdAt">;

export type AdviceBootstrap = {
  profile: AdviceProfile;
  session: AdviceSession;
  sessions: AdviceSessionSummary[];
  messages: AdviceMessage[];
};
