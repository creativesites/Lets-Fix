"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { adviceFaithStyleLabels, adviceLanguageOptions, DEFAULT_ADVICE_LANGUAGE, getAdviceLanguageOption } from "@/lib/advice-config";
import type {
  AdviceBootstrap,
  AdviceComponent,
  AdviceLanguage,
  AdviceMessage,
  AdviceProfile,
  AdviceResponse,
  AdviceSessionSummary
} from "@/lib/advice-types";

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
  length: number;
};

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type AdviceApiReply = {
  session: AdviceBootstrap["session"];
  sessions: AdviceSessionSummary[];
  profile: AdviceProfile;
  reply: AdviceResponse;
  model: string;
};

type AdviceStudioProps = {
  variant?: "page" | "widget";
};

type ProfileDraft = {
  displayName: string;
  firstName: string;
  relationshipStage: string;
  goals: string;
  painPoints: string;
  communicationStyle: string;
  faithContext: string;
  denomination: string;
  province: string;
  city: string;
  preferredLanguage: AdviceLanguage;
  uiLanguage: AdviceLanguage;
  conversationLanguage: AdviceLanguage;
  faithStyle: AdviceProfile["faithStyle"];
};

const GUEST_STORAGE_KEY = "lets-fix-advice-guest-id";
const SESSION_STORAGE_KEY = "lets-fix-advice-session-id";

const quickPrompts = [
  "How do I tell if I am ready for a relationship?",
  "I am healing after heartbreak. Where do I begin?",
  "How can I communicate boundaries without sounding harsh?",
  "What are the green and red flags I should notice?"
];

function createLocalMessage(role: "user" | "assistant", plainText: string, content: AdviceResponse | null, sessionId: string) {
  return {
    id: crypto.randomUUID(),
    sessionId,
    actorId: "local",
    role,
    modelName: role === "assistant" ? "gemini" : "",
    plainText,
    content,
    createdAt: new Date().toISOString()
  } satisfies AdviceMessage;
}

function splitCsvText(value: string) {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function formatDateLabel(value: string) {
  try {
    return new Intl.DateTimeFormat("en-ZM", {
      month: "short",
      day: "numeric"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function toProfileDraft(profile: AdviceProfile | null): ProfileDraft {
  return {
    displayName: profile?.displayName ?? "",
    firstName: profile?.personalization.firstName ?? "",
    relationshipStage: profile?.personalization.relationshipStage ?? "",
    goals: (profile?.personalization.goals ?? []).join(", "),
    painPoints: (profile?.personalization.painPoints ?? []).join(", "),
    communicationStyle: profile?.personalization.communicationStyle ?? "",
    faithContext: profile?.personalization.faithContext ?? "",
    denomination: profile?.denomination ?? "",
    province: profile?.province ?? "",
    city: profile?.city ?? "",
    preferredLanguage: profile?.preferredLanguage ?? DEFAULT_ADVICE_LANGUAGE,
    uiLanguage: profile?.uiLanguage ?? DEFAULT_ADVICE_LANGUAGE,
    conversationLanguage: profile?.conversationLanguage ?? DEFAULT_ADVICE_LANGUAGE,
    faithStyle: profile?.faithStyle ?? "gentle_christian"
  };
}

function speakResponse(text: string, language: AdviceLanguage) {
  if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.lang = getAdviceLanguageOption(language).speechLang;
  window.speechSynthesis.speak(utterance);
}

function triggerHaptic(response: AdviceResponse) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  if (response.components.some((component) => component.type === "red_flags" || component.type === "local_support_card")) {
    navigator.vibrate([22, 40, 18]);
    return;
  }

  if (response.components.some((component) => component.type === "prayer_card" || component.type === "pause_timer")) {
    navigator.vibrate(16);
  }
}

function PauseTimerCard({
  durationMinutes,
  guidance
}: {
  durationMinutes: number;
  guidance: string;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setRunning(false);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="advisorTimerBox">
      <strong>
        {minutes}:{seconds}
      </strong>
      <p>{guidance}</p>
      <div className="advisorTimerActions">
        <button className="adviceInlineButton" type="button" onClick={() => setRunning((current) => !current)}>
          {running ? "Pause" : "Start"}
        </button>
        <button
          className="adviceInlineButton subtleInlineButton"
          type="button"
          onClick={() => {
            setRunning(false);
            setRemainingSeconds(durationMinutes * 60);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function AdviceCard({ component }: { component: AdviceComponent }) {
  const toneClass = `tone-${component.tone}`;

  switch (component.type) {
    case "intro_card":
      return (
        <article className={`advisorCard advisorHeroCard ${toneClass}`}>
          <h3>{component.title}</h3>
          <p>{component.body}</p>
        </article>
      );
    case "quote_card":
      return (
        <article className={`advisorCard advisorQuoteCard ${toneClass}`}>
          <blockquote>&ldquo;{component.quote}&rdquo;</blockquote>
          <span>{component.source}</span>
        </article>
      );
    case "scripture_meditation":
      return (
        <article className={`advisorCard advisorScriptureCard ${toneClass}`}>
          <span className="advisorMiniLabel">Scripture meditation</span>
          <h3>{component.reference}</h3>
          <p className="advisorVerse">{component.verse}</p>
          <p>{component.reflection}</p>
        </article>
      );
    case "book_guidance":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <h3>{component.title}</h3>
          <ul className="advisorList">
            {component.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      );
    case "reflection_prompt":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Reflect before reacting</span>
          <h3>{component.prompt}</h3>
          <p>{component.helper}</p>
        </article>
      );
    case "prayer_card":
      return (
        <article className={`advisorCard advisorPrayerCard ${toneClass}`}>
          <span className="advisorMiniLabel">Prayer</span>
          <h3>{component.title}</h3>
          <p>{component.prayer}</p>
        </article>
      );
    case "green_flags":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Green flags</span>
          <h3>{component.title}</h3>
          <ul className="advisorList">
            {component.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      );
    case "red_flags":
      return (
        <article className={`advisorCard advisorAlertCard ${toneClass}`}>
          <h3>{component.title}</h3>
          <ul className="advisorList">
            {component.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      );
    case "conversation_planner":
    case "next_steps":
    case "heartbreak_plan":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <h3>{component.title}</h3>
          <ol className="advisorOrderedList">
            {component.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>
      );
    case "journal_prompt":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Journal prompts</span>
          <h3>{component.title}</h3>
          <ul className="advisorList">
            {component.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </article>
      );
    case "local_support_card":
      return (
        <article className={`advisorCard advisorAlertCard ${toneClass}`}>
          <span className="advisorMiniLabel">Zambia support</span>
          <h3>{component.title}</h3>
          <ul className="advisorList">
            {component.contacts.map((contact) => (
              <li key={contact}>{contact}</li>
            ))}
          </ul>
          <p>{component.guidance}</p>
        </article>
      );
    case "boundary_script":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Boundary script</span>
          <h3>{component.title}</h3>
          <div className="advisorScriptBox">{component.script}</div>
        </article>
      );
    case "repair_toolkit":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Repair toolkit</span>
          <h3>{component.title}</h3>
          <div className="advisorStackList">
            {component.scripts.map((script) => (
              <div className="advisorStackItem" key={script}>
                {script}
              </div>
            ))}
          </div>
        </article>
      );
    case "spark_questions":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Spark questions</span>
          <h3>{component.title}</h3>
          <ul className="advisorList">
            {component.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </article>
      );
    case "conviction_check":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Conviction check</span>
          <h3>{component.title}</h3>
          <ul className="advisorList">
            {component.checks.map((check) => (
              <li key={check}>{check}</li>
            ))}
          </ul>
        </article>
      );
    case "date_architect":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Date architect</span>
          <h3>{component.title}</h3>
          <ol className="advisorOrderedList">
            {component.ideas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ol>
        </article>
      );
    case "pause_timer":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Pause timer</span>
          <h3>{component.title}</h3>
          <PauseTimerCard durationMinutes={component.durationMinutes} guidance={component.guidance} />
        </article>
      );
    case "appreciation_log":
      return (
        <article className={`advisorCard ${toneClass}`}>
          <span className="advisorMiniLabel">Appreciation log</span>
          <h3>{component.title}</h3>
          <ul className="advisorList">
            {component.prompts.map((prompt) => (
              <li key={prompt}>{prompt}</li>
            ))}
          </ul>
        </article>
      );
    default:
      return null;
  }
}

function formatProfile(profile: AdviceProfile | null) {
  if (!profile) {
    return [];
  }

  const items: Array<{ label: string; value: string }> = [];
  const language = getAdviceLanguageOption(profile.conversationLanguage);

  items.push({ label: "Country", value: "Zambia only" });
  items.push({ label: "Language", value: language.nativeLabel });
  items.push({ label: "Guidance style", value: adviceFaithStyleLabels[profile.faithStyle] });

  if (profile.personalization.firstName) {
    items.push({ label: "Name", value: profile.personalization.firstName });
  }

  if (profile.personalization.relationshipStage) {
    items.push({ label: "Stage", value: profile.personalization.relationshipStage });
  }

  if (profile.city || profile.province) {
    items.push({ label: "Location", value: [profile.city, profile.province].filter(Boolean).join(", ") });
  }

  if (profile.denomination) {
    items.push({ label: "Church context", value: profile.denomination });
  }

  (profile.personalization.goals ?? []).slice(0, 2).forEach((goal) => {
    items.push({ label: "Goal", value: goal });
  });

  (profile.personalization.painPoints ?? []).slice(0, 3).forEach((painPoint) => {
    items.push({ label: "Pain point", value: painPoint });
  });

  return items;
}

export function AdviceStudio({ variant = "page" }: AdviceStudioProps) {
  const isWidget = variant === "widget";
  const [messages, setMessages] = useState<AdviceMessage[]>([]);
  const [sessions, setSessions] = useState<AdviceSessionSummary[]>([]);
  const [profile, setProfile] = useState<AdviceProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>(toProfileDraft(null));
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState<"chat" | "guided">("guided");
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);
  const [isOpen, setIsOpen] = useState(!isWidget);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const loadBootstrap = useCallback(async (activeGuestId: string, nextSessionId?: string | null) => {
    setBootstrapping(true);
    setError(null);

    try {
      const params = new URLSearchParams({ guestId: activeGuestId });
      if (nextSessionId) {
        params.set("sessionId", nextSessionId);
      }

      const response = await fetch(`/api/advice/chat?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Could not load the advice studio.");
      }

      const data = (await response.json()) as AdviceBootstrap;
      setMessages(data.messages);
      setSessions(data.sessions);
      setProfile(data.profile);
      setProfileDraft(toProfileDraft(data.profile));
      setSessionId(data.session.id);
      localStorage.setItem(SESSION_STORAGE_KEY, data.session.id);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Could not load the advice studio.");
    } finally {
      setBootstrapping(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const voiceWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition = voiceWindow.SpeechRecognition || voiceWindow.webkitSpeechRecognition;
    setHasSpeechSupport(Boolean(SpeechRecognition));

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = getAdviceLanguageOption(DEFAULT_ADVICE_LANGUAGE).speechLang;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript ?? "")
          .join(" ")
          .trim();

        if (transcript) {
          setInput((current) => `${current}${current ? " " : ""}${transcript}`.trim());
        }
      };
      recognition.onerror = () => {
        setIsRecording(false);
      };
      recognition.onend = () => {
        setIsRecording(false);
      };
      recognitionRef.current = recognition;
    }

    const storedGuestId = localStorage.getItem(GUEST_STORAGE_KEY) || crypto.randomUUID();
    localStorage.setItem(GUEST_STORAGE_KEY, storedGuestId);
    setGuestId(storedGuestId);

    const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);
    void loadBootstrap(storedGuestId, storedSessionId);
  }, [loadBootstrap]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setProfileDraft(toProfileDraft(profile));
    if (typeof document !== "undefined") {
      document.documentElement.lang = getAdviceLanguageOption(profile.uiLanguage).speechLang;
    }

    if (recognitionRef.current) {
      recognitionRef.current.lang = getAdviceLanguageOption(profile.conversationLanguage).speechLang;
    }
  }, [profile]);

  async function submitMessage(rawMessage?: string) {
    const message = (rawMessage ?? input).trim();

    if (!message || loading || !guestId || !profile) {
      return;
    }

    setIsOpen(true);
    const activeSessionId = sessionId || crypto.randomUUID();
    const optimisticUserMessage = createLocalMessage("user", message, null, activeSessionId);
    setMessages((current) => [...current, optimisticUserMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/advice/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          guestId,
          sessionId,
          message,
          displayName: profileDraft.displayName
        })
      });

      const data = (await response.json()) as AdviceApiReply | { error: string };

      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "The advisor could not respond right now.");
      }

      const assistantMessage = createLocalMessage("assistant", data.reply.replyText, data.reply, data.session.id);
      setMessages((current) => [...current, assistantMessage]);
      setProfile(data.profile);
      setSessions(data.sessions);
      setSessionId(data.session.id);
      localStorage.setItem(SESSION_STORAGE_KEY, data.session.id);
      triggerHaptic(data.reply);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The advisor could not respond right now.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfileChanges(nextDraft = profileDraft, successMessage = "Advisor preferences updated.") {
    if (!guestId) {
      return;
    }

    setSavingProfile(true);
    setProfileMessage(null);

    try {
      const response = await fetch("/api/advice/chat", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          guestId,
          displayName: nextDraft.displayName,
          preferredLanguage: nextDraft.preferredLanguage,
          uiLanguage: nextDraft.uiLanguage,
          conversationLanguage: nextDraft.conversationLanguage,
          faithStyle: nextDraft.faithStyle,
          denomination: nextDraft.denomination,
          province: nextDraft.province,
          city: nextDraft.city,
          personalization: {
            firstName: nextDraft.firstName,
            relationshipStage: nextDraft.relationshipStage,
            goals: splitCsvText(nextDraft.goals),
            painPoints: splitCsvText(nextDraft.painPoints),
            communicationStyle: nextDraft.communicationStyle,
            faithContext: nextDraft.faithContext
          }
        })
      });

      const data = (await response.json()) as { profile: AdviceProfile; sessions: AdviceSessionSummary[]; error?: string };
      if (!response.ok || data.error) {
        throw new Error(data.error || "Unable to update the advisor profile.");
      }

      setProfile(data.profile);
      setSessions(data.sessions);
      setProfileDraft(toProfileDraft(data.profile));
      setProfileMessage(successMessage);
    } catch (profileError) {
      setProfileMessage(profileError instanceof Error ? profileError.message : "Unable to update the advisor profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage();
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void saveProfileChanges();
  }

  function handleNewConversation() {
    if (!guestId) {
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    setSessionId(null);
    setMessages([]);
    setError(null);
    setProfileMessage("Started a fresh conversation. Your saved profile is still available.");
  }

  function toggleRecording() {
    const recognition = recognitionRef.current;
    if (!recognition) {
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
      return;
    }

    recognition.start();
    setIsRecording(true);
  }

  async function switchSession(nextSessionId: string) {
    if (!guestId || nextSessionId === sessionId) {
      return;
    }

    await loadBootstrap(guestId, nextSessionId);
  }

  async function handleLanguageChange(nextLanguage: AdviceLanguage) {
    const nextDraft = {
      ...profileDraft,
      preferredLanguage: nextLanguage,
      uiLanguage: nextLanguage,
      conversationLanguage: nextLanguage
    };
    setProfileDraft(nextDraft);
    await saveProfileChanges(nextDraft, "Language updated for the advisor.");
  }

  const profileFacts = formatProfile(profile);
  const promptSet = isWidget ? quickPrompts.slice(0, 3) : quickPrompts;
  const activeLanguage = profile?.conversationLanguage ?? DEFAULT_ADVICE_LANGUAGE;
  const activeLanguageOption = getAdviceLanguageOption(activeLanguage);

  const conversationPanel = (
    <div className={`adviceConversationPanel ${isWidget ? "adviceConversationPanelWidget" : ""}`}>
      <div className="advicePanelHeader">
        <div>
          <div className="advicePillRow">
            <span className="sectionLabel">{isWidget ? "Ask Let's Fix" : "Advice studio"}</span>
            <span className="advisorMiniLabel">Zambia only</span>
            <span className="advisorMiniLabel">{activeLanguageOption.nativeLabel}</span>
          </div>
          <h2>{isWidget ? "A warm relationship guide, shaped for Zambia." : "Talk through relationships with warmth, discernment, and a Zambia-shaped Christian lens."}</h2>
        </div>

        <div className="adviceHeaderActions">
          <label className="adviceHeaderSelect">
            <span>Language</span>
            <select value={activeLanguage} onChange={(event) => void handleLanguageChange(event.target.value as AdviceLanguage)}>
              {adviceLanguageOptions.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.nativeLabel}
                </option>
              ))}
            </select>
          </label>
          <button className="button buttonSecondary adviceMiniButton" type="button" onClick={handleNewConversation}>
            New conversation
          </button>
          {isWidget ? (
            <button className="adviceIconButton" type="button" onClick={() => setIsOpen(false)} aria-label="Close chat">
              x
            </button>
          ) : null}
        </div>
      </div>

      <div className="adviceModeSwitch" aria-label="Advice display mode">
        <button
          className={`adviceModeButton ${viewMode === "guided" ? "activeAdviceMode" : ""}`}
          type="button"
          onClick={() => setViewMode("guided")}
        >
          Chat + tools
        </button>
        <button
          className={`adviceModeButton ${viewMode === "chat" ? "activeAdviceMode" : ""}`}
          type="button"
          onClick={() => setViewMode("chat")}
        >
          Chat only
        </button>
      </div>

      <div className={`advicePromptRow ${isWidget ? "advicePromptRowWidget" : ""}`}>
        {promptSet.map((prompt) => (
          <button key={prompt} className="advicePromptChip" type="button" onClick={() => void submitMessage(prompt)}>
            {prompt}
          </button>
        ))}
      </div>

      <div className={`adviceTranscript ${isWidget ? "adviceTranscriptWidget" : ""}`}>
        {bootstrapping ? (
          <div className="adviceEmptyState">
            <h3>Loading your conversation space</h3>
            <p>Preparing the book-grounded advisor, language preferences, and your saved Zambia profile context.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="adviceEmptyState">
            <h3>Start with what is weighing on you</h3>
            <p>
              You can ask about healing, readiness, communication, prayer, boundaries, heartbreak, or difficult
              conversations. You can type in {activeLanguageOption.nativeLabel} if you prefer.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <article className={`adviceMessage adviceMessage-${message.role}`} key={message.id}>
              <div className="adviceMessageBubble">
                <div className="adviceMessageMeta">
                  <strong>{message.role === "user" ? "You" : "Let's Fix advisor"}</strong>
                  {message.role === "assistant" ? (
                    <button
                      className="adviceSpeakButton"
                      type="button"
                      onClick={() => speakResponse(message.plainText, activeLanguage)}
                    >
                      Speak
                    </button>
                  ) : null}
                </div>

                {message.role === "assistant" && message.content ? (
                  <div className="advisorComponentStack">
                    <p className="adviceReplyText">{message.content.replyText}</p>

                    {message.content.suggestedReplies && message.content.suggestedReplies.length > 0 ? (
                      <div className="adviceSuggestionRow">
                        {message.content.suggestedReplies.map((suggestion) => (
                          <button
                            key={`${message.id}-${suggestion}`}
                            className="adviceSuggestionChip"
                            type="button"
                            disabled={loading}
                            onClick={() => void submitMessage(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    {viewMode === "guided" && message.content.components.length > 0 ? (
                      <div className="advisorToolsStack">
                        <div className="advisorToolsHeader">
                          <span className="advisorMiniLabel">Guided tools</span>
                          <small>Optional support for this moment</small>
                        </div>

                        {message.content.components.map((component, index) => (
                          <AdviceCard component={component} key={`${message.id}-${component.type}-${index}`} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p>{message.plainText}</p>
                )}
              </div>
            </article>
          ))
        )}

        {loading ? (
          <article className="adviceMessage adviceMessage-assistant">
            <div className="adviceMessageBubble adviceLoadingBubble">
              <span className="advisorMiniLabel">Thinking with the book in mind</span>
              <p>{"I'm pulling together a more thoughtful reply for you now."}</p>
            </div>
          </article>
        ) : null}
      </div>

      <form className="adviceComposer" onSubmit={handleSubmit}>
        <label className="adviceComposerField">
          <span>{isWidget ? "Message the advisor" : "What do you need help with right now?"}</span>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Tell the advisor what happened, what you are feeling, or what you are trying to discern."
            rows={isWidget ? 4 : 5}
          />
        </label>

        <div className="adviceComposerActions">
          <button className="button buttonPrimary" type="submit" disabled={loading || !input.trim() || !profile}>
            {isWidget ? "Send" : "Send for guidance"}
          </button>
          <button
            className="button buttonSecondary adviceMicButton"
            type="button"
            onClick={toggleRecording}
            disabled={!hasSpeechSupport}
          >
            {isRecording ? "Stop listening" : hasSpeechSupport ? "Use voice input" : "Voice not supported"}
          </button>
        </div>

        {error ? <p className="formMessage">{error}</p> : null}
      </form>
    </div>
  );

  if (isWidget) {
    return (
      <div className="globalChatbotShell">
        {isOpen ? (
          <div className="globalChatbotPanel">{conversationPanel}</div>
        ) : (
          <button className="globalChatbotLauncher" type="button" onClick={() => setIsOpen(true)}>
            <span className="globalChatbotPulse" />
            <span>{"Ask Let's Fix"}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="section adviceStudioSection">
      <div className="adviceStudioLayout">
        {conversationPanel}

        <aside className="adviceSidebar">
          <article className="adviceSidebarCard">
            <span className="advisorMiniLabel">Advisor setup</span>
            <h3>Set your language, faith style, and context once.</h3>
            <p>The advisor uses this profile to keep its tone, language, and relationship guidance more personal over time.</p>

            <form className="adviceProfileForm" onSubmit={handleProfileSubmit}>
              <div className="adviceProfileGrid">
                <label className="adviceField">
                  <span>Display name</span>
                  <input
                    value={profileDraft.displayName}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, displayName: event.target.value }))}
                    placeholder="What should we call you?"
                  />
                </label>

                <label className="adviceField">
                  <span>First name</span>
                  <input
                    value={profileDraft.firstName}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, firstName: event.target.value }))}
                    placeholder="First name"
                  />
                </label>

                <label className="adviceField">
                  <span>Conversation language</span>
                  <select
                    value={profileDraft.conversationLanguage}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, conversationLanguage: event.target.value as AdviceLanguage }))
                    }
                  >
                    {adviceLanguageOptions.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label} / {language.nativeLabel}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="adviceField">
                  <span>Guidance style</span>
                  <select
                    value={profileDraft.faithStyle}
                    onChange={(event) =>
                      setProfileDraft((current) => ({
                        ...current,
                        faithStyle: event.target.value as AdviceProfile["faithStyle"]
                      }))
                    }
                  >
                    {Object.entries(adviceFaithStyleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="adviceField adviceFieldFull">
                  <span>Relationship stage</span>
                  <input
                    value={profileDraft.relationshipStage}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, relationshipStage: event.target.value }))
                    }
                    placeholder="Single, dating, engaged, married, healing after breakup..."
                  />
                </label>

                <label className="adviceField adviceFieldFull">
                  <span>Goals</span>
                  <input
                    value={profileDraft.goals}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, goals: event.target.value }))}
                    placeholder="Clarity, healing, boundaries, better communication"
                  />
                </label>

                <label className="adviceField adviceFieldFull">
                  <span>Pain points</span>
                  <input
                    value={profileDraft.painPoints}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, painPoints: event.target.value }))}
                    placeholder="Confusion, repeated conflict, heartbreak"
                  />
                </label>

                <label className="adviceField">
                  <span>Denomination or church context</span>
                  <input
                    value={profileDraft.denomination}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, denomination: event.target.value }))
                    }
                    placeholder="Pentecostal, Catholic, youth fellowship..."
                  />
                </label>

                <label className="adviceField">
                  <span>City or town</span>
                  <input
                    value={profileDraft.city}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, city: event.target.value }))}
                    placeholder="Lusaka, Kitwe..."
                  />
                </label>

                <label className="adviceField">
                  <span>Province</span>
                  <input
                    value={profileDraft.province}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, province: event.target.value }))}
                    placeholder="Copperbelt, Lusaka..."
                  />
                </label>

                <label className="adviceField">
                  <span>Communication style</span>
                  <input
                    value={profileDraft.communicationStyle}
                    onChange={(event) =>
                      setProfileDraft((current) => ({ ...current, communicationStyle: event.target.value }))
                    }
                    placeholder="Direct, avoidant, quiet..."
                  />
                </label>

                <label className="adviceField adviceFieldFull">
                  <span>Faith context</span>
                  <input
                    value={profileDraft.faithContext}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, faithContext: event.target.value }))}
                    placeholder="What shapes your current Christian journey?"
                  />
                </label>
              </div>

              <div className="adviceComposerActions">
                <button className="button buttonPrimary" type="submit" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save advisor setup"}
                </button>
              </div>

              {profileMessage ? <p className="formMessage">{profileMessage}</p> : null}
            </form>
          </article>

          <article className="adviceSidebarCard adviceSidebarAccent">
            <span className="advisorMiniLabel">Recent conversations</span>
            <h3>Your advisor now supports returning to older chats.</h3>
            <div className="adviceSessionList">
              {sessions.length > 0 ? (
                sessions.map((session) => (
                  <button
                    key={session.id}
                    className={`adviceSessionItem ${session.id === sessionId ? "activeAdviceSessionItem" : ""}`}
                    type="button"
                    onClick={() => void switchSession(session.id)}
                  >
                    <strong>{session.title}</strong>
                    <span>{formatDateLabel(session.updatedAt)}</span>
                  </button>
                ))
              ) : (
                <p className="adviceSidebarNote">Your conversations will appear here as soon as you start chatting.</p>
              )}
            </div>
          </article>

          <article className="adviceSidebarCard">
            <span className="advisorMiniLabel">Saved profile</span>
            <h3>The advisor learns gently over time.</h3>
            <p>
              It now remembers your language, faith style, relationship stage, location context, goals, and recurring pain
              points so replies can feel more grounded.
            </p>

            <div className="adviceSidebarFacts">
              {profileFacts.length > 0 ? (
                profileFacts.map((fact) => (
                  <div className="adviceFactRow" key={`${fact.label}-${fact.value}`}>
                    <span>{fact.label}</span>
                    <strong>{fact.value}</strong>
                  </div>
                ))
              ) : (
                <p className="adviceSidebarNote">Your profile will fill in naturally as the conversation continues.</p>
              )}
            </div>
          </article>

          <article className="adviceSidebarCard adviceSidebarAccent">
            <span className="advisorMiniLabel">Current features</span>
            <ul className="advisorList">
              <li>Zambia-only Christian relationship guidance</li>
              <li>Language picker for English, Bemba, Nyanja, Tonga, and Lozi</li>
              <li>Session history plus richer profile memory</li>
              <li>Heartbreak plans, conversation planners, green flags, and journal tools</li>
              <li>Local safety-aware support guidance for high-risk situations</li>
            </ul>
          </article>
        </aside>
      </div>
    </section>
  );
}
