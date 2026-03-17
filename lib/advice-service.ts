import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { GoogleGenAI, createPartFromUri, createUserContent } from "@google/genai";

import { adviceFaithStyleLabels, getAdviceLanguageOption, zambiaSupportContacts } from "@/lib/advice-config";
import type { AdviceComponent, AdviceMessage, AdvicePersonalization, AdviceProfile, AdviceResponse } from "@/lib/advice-types";
import { detectSafetyConcern, mergePersonalization, parseAdviceResponse } from "@/lib/advice-utils";

type StoredBookContext = {
  sourceMtimeMs: number;
  uploadedFileName?: string;
  uploadedFileUri?: string;
  uploadedFileMimeType?: string;
  caches?: Record<
    string,
    {
      name: string;
      expireTime?: string;
    }
  >;
};

const BOOK_FILE_PATH = path.join(process.cwd(), "public", "LET'S FIX.pdf");
const BOOK_STATE_PATH = path.join(process.cwd(), "data", "gemini-book-context.json");

const FLASH_MODEL = process.env.GEMINI_FLASH_MODEL || "gemini-3.1-flash-lite-preview";
const PRO_MODEL = process.env.GEMINI_PRO_MODEL || "gemini-3.1-pro-preview";
const FLASH_FALLBACK_MODEL = process.env.GEMINI_FLASH_FALLBACK_MODEL || "gemini-2.5-flash";
const PRO_FALLBACK_MODEL = process.env.GEMINI_PRO_FALLBACK_MODEL || "gemini-2.5-pro";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenAI({ apiKey });
}

async function readBookState() {
  try {
    const raw = await readFile(BOOK_STATE_PATH, "utf8");
    return JSON.parse(raw) as StoredBookContext;
  } catch {
    return null;
  }
}

async function writeBookState(state: StoredBookContext) {
  await mkdir(path.dirname(BOOK_STATE_PATH), { recursive: true });
  await writeFile(BOOK_STATE_PATH, JSON.stringify(state, null, 2));
}

async function ensureBookContext(model: string) {
  const ai = getGeminiClient();
  const sourceStats = await stat(BOOK_FILE_PATH);
  const existingState = await readBookState();
  let state: StoredBookContext = existingState && existingState.sourceMtimeMs === sourceStats.mtimeMs
    ? existingState
    : {
        sourceMtimeMs: sourceStats.mtimeMs,
        caches: {}
      };

  if (!state.uploadedFileUri || !state.uploadedFileName || !state.uploadedFileMimeType) {
    const uploadedFile = await ai.files.upload({
      file: BOOK_FILE_PATH,
      config: {
        mimeType: "application/pdf"
      }
    });

    state = {
      ...state,
      uploadedFileName: uploadedFile.name,
      uploadedFileUri: uploadedFile.uri,
      uploadedFileMimeType: uploadedFile.mimeType || "application/pdf",
      caches: state.caches ?? {}
    };
    await writeBookState(state);
  }

  const cacheRecord = state.caches?.[model];
  const cacheStillValid = cacheRecord?.expireTime ? new Date(cacheRecord.expireTime).getTime() > Date.now() : Boolean(cacheRecord?.name);

  if (cacheRecord?.name && cacheStillValid) {
    return {
      cachedContent: cacheRecord.name,
      fileUri: state.uploadedFileUri,
      mimeType: state.uploadedFileMimeType
    };
  }

  try {
    const cache = await ai.caches.create({
      model,
      config: {
        displayName: `lets-fix-book-${model}`,
        ttl: "86400s",
        systemInstruction:
          "This cached book is the grounding source for a Christian relationship advisor. Stay close to the themes, tone, discernment, healing, and Christ-centered guidance in the book.",
        contents: createUserContent(createPartFromUri(state.uploadedFileUri!, state.uploadedFileMimeType!))
      }
    });
    const cacheName = cache.name;

    if (!cacheName) {
      throw new Error("Gemini cache creation did not return a cache name.");
    }

    const nextState: StoredBookContext = {
      ...state,
      caches: {
        ...(state.caches ?? {}),
        [model]: {
          name: cacheName,
          expireTime: cache.expireTime
        }
      }
    };

    await writeBookState(nextState);

    return {
      cachedContent: cacheName,
      fileUri: state.uploadedFileUri,
      mimeType: state.uploadedFileMimeType
    };
  } catch {
    return {
      cachedContent: undefined,
      fileUri: state.uploadedFileUri,
      mimeType: state.uploadedFileMimeType
    };
  }
}

function choosePrimaryModel(message: string) {
  const lowered = message.toLowerCase();
  const complex =
    message.length > 520 ||
    /\bmarriage|engaged|betrayal|trauma|divorce|abuse|cheating|infidelity|addiction|reconcile|reconciliation\b/.test(lowered);

  return complex ? PRO_MODEL : FLASH_MODEL;
}

function buildHistoryBlock(history: AdviceMessage[]) {
  if (history.length === 0) {
    return "No earlier conversation yet.";
  }

  return history
    .slice(-10)
    .map((message) => `${message.role === "user" ? "User" : "Advisor"}: ${message.plainText}`)
    .join("\n");
}

function buildSystemInstruction(profile: AdviceProfile, personalization: AdvicePersonalization, safetyMode: ReturnType<typeof detectSafetyConcern>) {
  const selectedLanguage = getAdviceLanguageOption(profile.conversationLanguage);
  const faithStyleLabel = adviceFaithStyleLabels[profile.faithStyle];

  return `
You are the Let's Fix advisor, a premium Christian relationship guide grounded in the book "Let's Fix" by Maureen Sinovia Mulenga.

Product boundaries:
- serve Zambia only; assume the user is in Zambia unless they clearly say otherwise
- keep examples, support options, social context, and relationship expectations grounded in life in Zambia
- never recommend non-Zambian hotlines, agencies, or legal systems when safety advice is needed

Voice:
- warm, calm, emotionally intelligent, and prayer-aware
- never preachy, harsh, or shaming
- sound like an empathetic, thoughtful friend with biblical discernment, not a robotic counselor
- write like a real conversation, not a caption, slogan, or sermon outline
- vary your openings; do not keep repeating the same comfort line across turns
- prefer "The framework in Let's Fix suggests..." over authoritarian commands
- when someone is hurting, acknowledge their exact feeling before offering guidance

Grounding:
- stay aligned with the book's themes: healing after heartbreak, discernment, Christ-like love, purpose, trust, communication, boundaries, peace, and resting in God's promises
- do not invent direct book quotations unless you are certain the wording appears in the source
- you may use scripture naturally when helpful
- the user prefers the guidance style "${faithStyleLabel}"
- respond in ${selectedLanguage.promptName}
- if you are not confident in advanced wording for the selected language, keep the language simple and clear instead of switching back to generic English

Safety:
- if abuse, coercion, violence, or immediate danger is present, prioritize safety over reconciliation advice
- recommend trusted real-world support in Zambia, professional counseling, pastoral care, and safe distance where appropriate
- do not encourage someone to stay in a dangerous situation

Response contract:
- return strict JSON only
- replyText should feel like a warm, natural chat reply in 3 to 6 sentences
- replyText should respond directly to the user's actual words and may ask one gentle follow-up question when helpful
- choose 0 to 3 components in the order the UI should render them
- components are optional support tools, not the main answer
- personalization should contain only facts newly learned or strongly inferred
- if there is danger, set safety.abuseConcern or safety.urgentSupport accordingly and include red_flags and next_steps

Allowed components:
- intro_card { title, body, tone }
- quote_card { quote, source, tone }
- scripture_meditation { verse, reference, reflection, tone }
- book_guidance { title, points[2-5], tone }
- reflection_prompt { prompt, helper, tone }
- prayer_card { title, prayer, tone }
- green_flags { title, items[2-5], tone }
- red_flags { title, items[2-5], tone:'alert' }
- conversation_planner { title, steps[2-6], tone }
- next_steps { title, steps[2-6], tone }
- heartbreak_plan { title, steps[2-6], tone }
- journal_prompt { title, prompts[2-6], tone }
- local_support_card { title, contacts[2-6], guidance, tone }
- boundary_script { title, script, tone }
- repair_toolkit { title, scripts[2-5], tone }
- spark_questions { title, questions[3-6], tone }
- conviction_check { title, checks[3-6], tone }
- date_architect { title, ideas[3-6], tone }
- pause_timer { title, durationMinutes, guidance, tone }
- appreciation_log { title, prompts[2-5], tone }

Known personalization:
${JSON.stringify(personalization)}

Current safety mode:
${JSON.stringify(safetyMode)}
`.trim();
}

function buildUserPrompt(message: string, history: AdviceMessage[]) {
  return `
Conversation so far:
${buildHistoryBlock(history)}

User message:
${message}

Return JSON with this exact top-level shape:
{
  "replyText": "string",
  "tone": "warm | calm | hopeful | alert",
  "components": [],
  "suggestedReplies": ["short follow-up options"],
  "personalization": {
    "firstName": "optional string",
    "partnerName": "optional string",
    "relationshipStage": "optional string",
    "goals": ["optional strings"],
    "painPoints": ["optional strings"],
    "prayerTopics": ["optional strings"],
    "communicationStyle": "optional string",
    "faithContext": "optional string",
    "boundariesFocus": ["optional strings"]
  },
  "safety": {
    "abuseConcern": false,
    "urgentSupport": false,
    "note": "optional string"
  }
}

Important:
- If a normal conversational reply is enough, return an empty components array.
- Do not repeat generic lines like "take a breath and slow down" unless they clearly fit this exact moment.
- If the user says something short like "I feel bad right now", respond with warmth, curiosity, and specificity instead of sounding templated.
- suggestedReplies should be short, natural next things the user might tap.
`.trim();
}

function buildRuntimePrompt(
  message: string,
  history: AdviceMessage[],
  profile: AdviceProfile,
  personalization: AdvicePersonalization,
  safetyMode: ReturnType<typeof detectSafetyConcern>
) {
  return `${buildSystemInstruction(profile, personalization, safetyMode)}

${buildUserPrompt(message, history)}`;
}

function ensureSafetyComponents(
  response: AdviceResponse,
  safetyMode: ReturnType<typeof detectSafetyConcern>
): AdviceResponse {
  const effectiveSafety = {
    abuseConcern: safetyMode.abuseConcern || Boolean(response.safety?.abuseConcern),
    urgentSupport: safetyMode.urgentSupport || Boolean(response.safety?.urgentSupport)
  };

  if (!effectiveSafety.abuseConcern && !effectiveSafety.urgentSupport) {
    return response;
  }

  const hasRedFlags = response.components.some((component) => component.type === "red_flags");
  const hasNextSteps = response.components.some((component) => component.type === "next_steps");
  const hasLocalSupport = response.components.some((component) => component.type === "local_support_card");

  const components = [...response.components];

  if (!hasRedFlags) {
    components.unshift({
      type: "red_flags",
      tone: "alert",
      title: "Pay attention to these warning signs",
      items: [
        "Fear, intimidation, or controlling behavior are not signs of healthy love.",
        "Pressure, threats, or repeated disrespect call for safety and support, not deeper attachment.",
        "If you feel unsafe, protecting yourself matters more than keeping the relationship intact."
      ]
    });
  }

  if (!hasNextSteps) {
    components.push({
      type: "next_steps",
      tone: "alert",
      title: "What to do next",
      steps: [
        "Move toward a safe person or safe place if you feel at risk.",
        "Reach out to a trusted friend, pastor, counselor, or family member in Zambia today.",
        "If there is immediate danger, contact emergency services or the nearest police station right away."
      ]
    });
  }

  if (!hasLocalSupport) {
    components.push({
      type: "local_support_card",
      tone: "alert",
      title: "Support options in Zambia",
      contacts: zambiaSupportContacts,
      guidance:
        "If you are in danger, move toward immediate safety first. Pastoral support can help, but it should never replace urgent protection."
    });
  }

  const safeResponse: AdviceResponse = {
    ...response,
    tone: "alert",
    components,
    safety: {
      abuseConcern: true,
      urgentSupport: effectiveSafety.urgentSupport,
      note: response.safety?.note || "Safety comes before reconciliation."
    }
  };

  return safeResponse;
}

function hasComponent(response: AdviceResponse, type: AdviceComponent["type"]) {
  return response.components.some((component) => component.type === type);
}

function enhanceResponse(message: string, response: AdviceResponse, profile: AdviceProfile): AdviceResponse {
  const lowered = message.toLowerCase();
  const components = [...response.components];
  const suggestedReplies = new Set(response.suggestedReplies ?? []);
  const englishMode = profile.conversationLanguage === "en-ZM";

  if (!englishMode) {
    return {
      ...response,
      suggestedReplies: Array.from(suggestedReplies).slice(0, 4)
    };
  }

  if (/\b(right person|healthy relationship|green flag|good signs|is this healthy)\b/.test(lowered) && !hasComponent(response, "green_flags")) {
    components.push({
      type: "green_flags",
      tone: "hopeful",
      title: "Healthy signs worth noticing",
      items: [
        "You can be honest without fear.",
        "There is peace, not constant confusion.",
        "Respect shows up in words, time, and consistency.",
        "Faith, purpose, and character move in the same direction."
      ]
    });
  }

  if (/\b(argument|argued|fight|fighting|conflict|misunderstood|we keep clashing|we argued)\b/.test(lowered) && !hasComponent(response, "repair_toolkit")) {
    components.push({
      type: "repair_toolkit",
      tone: "calm",
      title: "Repair attempts you can try",
      scripts: [
        "I want to understand you, not just defend myself.",
        "Can we pause and come back when we are both calmer?",
        "What I said came out harshly. Let me say it with more honesty and grace."
      ]
    });
    suggestedReplies.add("Help me write a message after an argument");
  }

  if (/\b(hard conversation|difficult conversation|bring this up|talk to him|talk to her|confront|sensitive talk)\b/.test(lowered) && !hasComponent(response, "conversation_planner")) {
    components.push({
      type: "conversation_planner",
      tone: "calm",
      title: "Plan the conversation before you start",
      steps: [
        "Decide the one point you truly need to communicate.",
        "Choose a calm moment, not the middle of tension.",
        "Speak from honesty and dignity instead of accusation.",
        "Ask for one clear next step before the conversation ends."
      ]
    });
    suggestedReplies.add("Help me prepare that conversation");
  }

  if (/\b(overwhelmed|anxious|stressed|angry|upset|spiraling|panic|panicking|calm down)\b/.test(lowered) && !hasComponent(response, "pause_timer")) {
    components.unshift({
      type: "pause_timer",
      tone: "calm",
      title: "Take a short reset first",
      durationMinutes: 5,
      guidance: "Let your body settle before the next reply. Slow breaths, relaxed shoulders, and no rushed decisions for a few minutes."
    });
    suggestedReplies.add("Give me a short prayer for this moment");
  }

  if (/\b(heartbreak|broken heart|move on|miss him|miss her|healing after|he left|she left|break up|breakup)\b/.test(lowered) && !hasComponent(response, "heartbreak_plan")) {
    components.push({
      type: "heartbreak_plan",
      tone: "hopeful",
      title: "A gentle healing plan for this week",
      steps: [
        "Name the loss honestly before God instead of minimizing it.",
        "Reduce the habits that reopen the wound every day.",
        "Return to one healthy rhythm: prayer, sleep, food, or community.",
        "Choose one trusted person who can help you stay steady."
      ]
    });
    suggestedReplies.add("Help me heal after this breakup");
  }

  if (/\b(journal|write this down|process my feelings|reflect|reflection)\b/.test(lowered) && !hasComponent(response, "journal_prompt")) {
    components.push({
      type: "journal_prompt",
      tone: "warm",
      title: "Journal this before you react",
      prompts: [
        "What hurt me most in this situation?",
        "What story am I telling myself about my worth?",
        "What response would protect peace and truth together?"
      ]
    });
  }

  if (/\b(boundary|boundaries|say no|respect me|respect my time|too available)\b/.test(lowered) && !hasComponent(response, "conviction_check")) {
    components.push({
      type: "conviction_check",
      tone: "hopeful",
      title: "Before you answer, check your heart",
      checks: [
        "Am I being clear instead of vague?",
        "Am I protecting peace without hiding the truth?",
        "Am I asking for respect rather than trying to control?",
        "Does this boundary support healing and dignity?"
      ]
    });
    suggestedReplies.add("Help me set a loving boundary");
  }

  if (/\b(date|date night|quality time|bored|something fun|spend time together)\b/.test(lowered) && !hasComponent(response, "date_architect")) {
    components.push({
      type: "date_architect",
      tone: "hopeful",
      title: "A simple quality-time plan",
      ideas: [
        "Take a quiet walk and ask one honest question each.",
        "Share a meal with phones away and talk about what peace in love looks like.",
        "Read one quote from the book together and say what it confronts or comforts.",
        "End the time with a short prayer for wisdom, tenderness, and direction."
      ]
    });
    suggestedReplies.add("Give me more date ideas");
  }

  if (/\b(get to know|conversation starter|deeper conversation|questions to ask|connect better)\b/.test(lowered) && !hasComponent(response, "spark_questions")) {
    components.push({
      type: "spark_questions",
      tone: "warm",
      title: "Questions that open deeper connection",
      questions: [
        "What kind of love makes you feel safest?",
        "What has God been teaching you in this season?",
        "What fear do you quietly carry into relationships?",
        "What does emotional maturity look like to you?"
      ]
    });
    suggestedReplies.add("Give me more connection questions");
  }

  if (/\b(grateful|appreciate|appreciation|thankful|he did something nice|she did something nice)\b/.test(lowered) && !hasComponent(response, "appreciation_log")) {
    components.push({
      type: "appreciation_log",
      tone: "hopeful",
      title: "Capture the good while it is fresh",
      prompts: [
        "What exactly happened that made you feel seen?",
        "What quality did you notice in them in that moment?",
        "How could you reflect that kindness back this week?"
      ]
    });
  }

  if (suggestedReplies.size === 0) {
    suggestedReplies.add("Can you go deeper on that?");
    suggestedReplies.add("Give me a prayer for this");
    suggestedReplies.add("What should I do next?");
  }

  return {
    ...response,
    components,
    suggestedReplies: Array.from(suggestedReplies).slice(0, 4)
  };
}

async function generateWithModel(params: {
  model: string;
  message: string;
  history: AdviceMessage[];
  profile: AdviceProfile;
  personalization: AdvicePersonalization;
  safetyMode: ReturnType<typeof detectSafetyConcern>;
}) {
  const ai = getGeminiClient();
  const bookContext = await ensureBookContext(params.model);

  const response = await ai.models.generateContent({
    model: params.model,
    contents: bookContext.cachedContent
      ? buildRuntimePrompt(params.message, params.history, params.profile, params.personalization, params.safetyMode)
      : createUserContent([
          createPartFromUri(bookContext.fileUri!, bookContext.mimeType!),
          {
            text: buildRuntimePrompt(params.message, params.history, params.profile, params.personalization, params.safetyMode)
          }
        ]),
    config: {
      cachedContent: bookContext.cachedContent,
      temperature: 0.8,
      topP: 0.95,
      responseMimeType: "application/json"
    }
  });

  const parsed = enhanceResponse(
    params.message,
    ensureSafetyComponents(parseAdviceResponse(response.text || ""), params.safetyMode)
    ,
    params.profile
  );

  return {
    modelName: params.model,
    response: parsed
  };
}

export async function generateAdvice(params: {
  message: string;
  history: AdviceMessage[];
  profile: AdviceProfile;
}) {
  const safetyMode = detectSafetyConcern(params.message);
  const primaryModel = choosePrimaryModel(params.message);
  const fallbackModel = primaryModel === PRO_MODEL ? PRO_FALLBACK_MODEL : FLASH_FALLBACK_MODEL;
  const mergedPersonalization = mergePersonalization(params.profile.personalization, undefined);

  try {
    return await generateWithModel({
      model: primaryModel,
      message: params.message,
      history: params.history,
      profile: params.profile,
      personalization: mergedPersonalization,
      safetyMode
    });
  } catch (error) {
    if (fallbackModel === primaryModel) {
      throw error;
    }

    return generateWithModel({
      model: fallbackModel,
      message: params.message,
      history: params.history,
      profile: params.profile,
      personalization: mergedPersonalization,
      safetyMode
    });
  }
}
