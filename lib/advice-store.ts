import { DEFAULT_ADVICE_LANGUAGE, DEFAULT_FAITH_STYLE } from "@/lib/advice-config";
import { getDatabase } from "@/lib/database";
import type {
  AdviceBootstrap,
  AdviceFaithStyle,
  AdviceLanguage,
  AdviceMessage,
  AdvicePersonalization,
  AdviceProfile,
  AdviceResponse,
  AdviceSession,
  AdviceSessionSummary
} from "@/lib/advice-types";
import {
  mergePersonalization,
  sanitizeAdviceFaithStyle,
  sanitizeAdviceField,
  sanitizeAdviceLanguage,
  summarizeAdviceResponse
} from "@/lib/advice-utils";

type ActorIdentity = {
  clerkUserId: string | null;
  guestId: string | null;
  displayName?: string;
  preferredLanguage?: AdviceLanguage;
  uiLanguage?: AdviceLanguage;
  conversationLanguage?: AdviceLanguage;
  faithStyle?: AdviceFaithStyle;
  denomination?: string;
  province?: string;
  city?: string;
};

type ProfileRow = {
  actorId: string;
  actorType: "user" | "guest";
  clerkUserId: string | null;
  guestId: string | null;
  displayName: string;
  preferredLanguage: AdviceLanguage;
  uiLanguage: AdviceLanguage;
  conversationLanguage: AdviceLanguage;
  faithStyle: AdviceFaithStyle;
  denomination: string;
  province: string;
  city: string;
  personalizationJson: string;
  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;
};

type SessionRow = {
  id: string;
  actorId: string;
  title: string;
  mode: "text";
  createdAt: string;
  updatedAt: string;
};

type MessageRow = {
  id: string;
  sessionId: string;
  actorId: string;
  role: "user" | "assistant";
  modelName: string;
  plainText: string;
  contentJson: string;
  createdAt: string;
};

function resolveActor(identity: ActorIdentity) {
  if (identity.clerkUserId) {
    return {
      actorId: `user:${identity.clerkUserId}`,
      actorType: "user" as const,
      clerkUserId: identity.clerkUserId,
      guestId: null
    };
  }

  const guestId = identity.guestId || crypto.randomUUID();

  return {
    actorId: `guest:${guestId}`,
    actorType: "guest" as const,
    clerkUserId: null,
    guestId
  };
}

function parsePersonalization(json: string): AdvicePersonalization {
  try {
    return JSON.parse(json) as AdvicePersonalization;
  } catch {
    return {};
  }
}

function toProfile(row: ProfileRow): AdviceProfile {
  return {
    actorId: row.actorId,
    actorType: row.actorType,
    clerkUserId: row.clerkUserId,
    guestId: row.guestId,
    displayName: row.displayName,
    preferredLanguage: sanitizeAdviceLanguage(row.preferredLanguage),
    uiLanguage: sanitizeAdviceLanguage(row.uiLanguage),
    conversationLanguage: sanitizeAdviceLanguage(row.conversationLanguage),
    faithStyle: sanitizeAdviceFaithStyle(row.faithStyle),
    denomination: row.denomination || undefined,
    province: row.province || undefined,
    city: row.city || undefined,
    personalization: parsePersonalization(row.personalizationJson),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastActiveAt: row.lastActiveAt
  };
}

function toSession(row: SessionRow): AdviceSession {
  return {
    id: row.id,
    actorId: row.actorId,
    title: row.title,
    mode: row.mode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function toMessage(row: MessageRow): AdviceMessage {
  let content: AdviceResponse | null = null;

  try {
    const parsed = JSON.parse(row.contentJson) as AdviceResponse | null;
    content = parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    content = null;
  }

  return {
    id: row.id,
    sessionId: row.sessionId,
    actorId: row.actorId,
    role: row.role,
    modelName: row.modelName,
    plainText: row.plainText,
    content,
    createdAt: row.createdAt
  };
}

export async function ensureAdvisorProfile(identity: ActorIdentity) {
  const database = getDatabase();
  const actor = resolveActor(identity);
  const now = new Date().toISOString();
  const existing = database
    .prepare(
      `
        SELECT
          actor_id AS actorId,
          actor_type AS actorType,
          clerk_user_id AS clerkUserId,
          guest_id AS guestId,
          display_name AS displayName,
          preferred_language AS preferredLanguage,
          ui_language AS uiLanguage,
          conversation_language AS conversationLanguage,
          faith_style AS faithStyle,
          denomination,
          province,
          city,
          personalization_json AS personalizationJson,
          created_at AS createdAt,
          updated_at AS updatedAt,
          last_active_at AS lastActiveAt
        FROM advisor_profiles
        WHERE actor_id = ?
      `
    )
    .get(actor.actorId) as ProfileRow | undefined;

  if (existing) {
    const displayName = identity.displayName?.trim() || existing.displayName;
    const preferredLanguage = sanitizeAdviceLanguage(identity.preferredLanguage ?? existing.preferredLanguage);
    const uiLanguage = sanitizeAdviceLanguage(identity.uiLanguage ?? existing.uiLanguage ?? preferredLanguage);
    const conversationLanguage = sanitizeAdviceLanguage(identity.conversationLanguage ?? existing.conversationLanguage ?? preferredLanguage);
    const faithStyle = sanitizeAdviceFaithStyle(identity.faithStyle ?? existing.faithStyle);
    const denomination = sanitizeAdviceField(identity.denomination ?? existing.denomination, 80) ?? "";
    const province = sanitizeAdviceField(identity.province ?? existing.province, 80) ?? "";
    const city = sanitizeAdviceField(identity.city ?? existing.city, 80) ?? "";
    database
      .prepare(
        `
          UPDATE advisor_profiles
          SET display_name = @displayName,
              preferred_language = @preferredLanguage,
              ui_language = @uiLanguage,
              conversation_language = @conversationLanguage,
              faith_style = @faithStyle,
              denomination = @denomination,
              province = @province,
              city = @city,
              updated_at = @updatedAt,
              last_active_at = @lastActiveAt
          WHERE actor_id = @actorId
        `
      )
      .run({
        actorId: actor.actorId,
        displayName,
        preferredLanguage,
        uiLanguage,
        conversationLanguage,
        faithStyle,
        denomination,
        province,
        city,
        updatedAt: now,
        lastActiveAt: now
      });

    return {
      profile: {
        ...toProfile(existing),
        displayName,
        preferredLanguage,
        uiLanguage,
        conversationLanguage,
        faithStyle,
        denomination: denomination || undefined,
        province: province || undefined,
        city: city || undefined,
        updatedAt: now,
        lastActiveAt: now
      },
      actor
    };
  }

  const profile: AdviceProfile = {
    actorId: actor.actorId,
    actorType: actor.actorType,
    clerkUserId: actor.clerkUserId,
    guestId: actor.guestId,
    displayName: identity.displayName?.trim() || "",
    preferredLanguage: sanitizeAdviceLanguage(identity.preferredLanguage),
    uiLanguage: sanitizeAdviceLanguage(identity.uiLanguage ?? identity.preferredLanguage),
    conversationLanguage: sanitizeAdviceLanguage(identity.conversationLanguage ?? identity.preferredLanguage),
    faithStyle: sanitizeAdviceFaithStyle(identity.faithStyle),
    denomination: sanitizeAdviceField(identity.denomination, 80),
    province: sanitizeAdviceField(identity.province, 80),
    city: sanitizeAdviceField(identity.city, 80),
    personalization: {},
    createdAt: now,
    updatedAt: now,
    lastActiveAt: now
  };

  database
    .prepare(
      `
        INSERT INTO advisor_profiles (
          actor_id,
          actor_type,
          clerk_user_id,
          guest_id,
          display_name,
          preferred_language,
          ui_language,
          conversation_language,
          faith_style,
          denomination,
          province,
          city,
          personalization_json,
          created_at,
          updated_at,
          last_active_at
        )
        VALUES (
          @actorId,
          @actorType,
          @clerkUserId,
          @guestId,
          @displayName,
          @preferredLanguage,
          @uiLanguage,
          @conversationLanguage,
          @faithStyle,
          @denomination,
          @province,
          @city,
          @personalizationJson,
          @createdAt,
          @updatedAt,
          @lastActiveAt
        )
      `
    )
    .run({
      actorId: profile.actorId,
      actorType: profile.actorType,
      clerkUserId: profile.clerkUserId,
      guestId: profile.guestId,
      displayName: profile.displayName,
      preferredLanguage: profile.preferredLanguage,
      uiLanguage: profile.uiLanguage,
      conversationLanguage: profile.conversationLanguage,
      faithStyle: profile.faithStyle,
      denomination: profile.denomination ?? "",
      province: profile.province ?? "",
      city: profile.city ?? "",
      personalizationJson: JSON.stringify(profile.personalization),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      lastActiveAt: profile.lastActiveAt
    });

  return {
    profile,
    actor
  };
}

export async function getOrCreateAdviceSession(actorId: string, sessionId?: string | null) {
  const database = getDatabase();

  if (sessionId) {
    const session = database
      .prepare(
        `
          SELECT
            id,
            actor_id AS actorId,
            title,
            mode,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM advisor_sessions
          WHERE id = ? AND actor_id = ?
        `
      )
      .get(sessionId, actorId) as SessionRow | undefined;

    if (session) {
      return toSession(session);
    }
  }

  const now = new Date().toISOString();
  const session: AdviceSession = {
    id: crypto.randomUUID(),
    actorId,
    title: "New conversation",
    mode: "text",
    createdAt: now,
    updatedAt: now
  };

  database
    .prepare(
      `
        INSERT INTO advisor_sessions (id, actor_id, title, mode, created_at, updated_at)
        VALUES (@id, @actorId, @title, @mode, @createdAt, @updatedAt)
      `
    )
    .run(session);

  return session;
}

export async function listAdviceSessions(actorId: string, limit = 10): Promise<AdviceSessionSummary[]> {
  const database = getDatabase();
  const sessions = database
    .prepare(
      `
        SELECT
          id,
          title,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM advisor_sessions
        WHERE actor_id = ?
        ORDER BY datetime(updated_at) DESC
        LIMIT ?
      `
    )
    .all(actorId, limit) as Array<AdviceSessionSummary>;

  return sessions;
}

export async function getAdviceBootstrap(identity: ActorIdentity, sessionId?: string | null): Promise<AdviceBootstrap> {
  const { profile } = await ensureAdvisorProfile(identity);
  const database = getDatabase();
  let session: AdviceSession;

  if (sessionId) {
    session = await getOrCreateAdviceSession(profile.actorId, sessionId);
  } else {
    const latestSession = database
      .prepare(
        `
          SELECT
            id,
            actor_id AS actorId,
            title,
            mode,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM advisor_sessions
          WHERE actor_id = ?
          ORDER BY datetime(updated_at) DESC
          LIMIT 1
        `
      )
      .get(profile.actorId) as SessionRow | undefined;

    session = latestSession ? toSession(latestSession) : await getOrCreateAdviceSession(profile.actorId);
  }

  const messages = database
    .prepare(
      `
        SELECT
          id,
          session_id AS sessionId,
          actor_id AS actorId,
          role,
          model_name AS modelName,
          plain_text AS plainText,
          content_json AS contentJson,
          created_at AS createdAt
        FROM advisor_messages
        WHERE session_id = ?
        ORDER BY datetime(created_at) ASC
        LIMIT 24
      `
    )
    .all(session.id) as MessageRow[];

  return {
    profile,
    session,
    sessions: await listAdviceSessions(profile.actorId),
    messages: messages.map(toMessage)
  };
}

export async function updateAdvisorProfile(params: {
  actorId: string;
  displayName?: string;
  preferredLanguage?: AdviceLanguage;
  uiLanguage?: AdviceLanguage;
  conversationLanguage?: AdviceLanguage;
  faithStyle?: AdviceFaithStyle;
  denomination?: string;
  province?: string;
  city?: string;
  personalization?: AdvicePersonalization;
}) {
  const database = getDatabase();
  const existing = database
    .prepare(
      `
        SELECT
          actor_id AS actorId,
          actor_type AS actorType,
          clerk_user_id AS clerkUserId,
          guest_id AS guestId,
          display_name AS displayName,
          preferred_language AS preferredLanguage,
          ui_language AS uiLanguage,
          conversation_language AS conversationLanguage,
          faith_style AS faithStyle,
          denomination,
          province,
          city,
          personalization_json AS personalizationJson,
          created_at AS createdAt,
          updated_at AS updatedAt,
          last_active_at AS lastActiveAt
        FROM advisor_profiles
        WHERE actor_id = ?
      `
    )
    .get(params.actorId) as ProfileRow | undefined;

  if (!existing) {
    throw new Error("Advisor profile not found.");
  }

  const now = new Date().toISOString();
  const mergedPersonalization = mergePersonalization(parsePersonalization(existing.personalizationJson), params.personalization);
  const nextProfile = {
    displayName: params.displayName?.trim() || existing.displayName,
    preferredLanguage: sanitizeAdviceLanguage(params.preferredLanguage ?? existing.preferredLanguage ?? DEFAULT_ADVICE_LANGUAGE),
    uiLanguage: sanitizeAdviceLanguage(params.uiLanguage ?? existing.uiLanguage ?? existing.preferredLanguage ?? DEFAULT_ADVICE_LANGUAGE),
    conversationLanguage: sanitizeAdviceLanguage(
      params.conversationLanguage ?? existing.conversationLanguage ?? existing.preferredLanguage ?? DEFAULT_ADVICE_LANGUAGE
    ),
    faithStyle: sanitizeAdviceFaithStyle(params.faithStyle ?? existing.faithStyle ?? DEFAULT_FAITH_STYLE),
    denomination: sanitizeAdviceField(params.denomination ?? existing.denomination, 80) ?? "",
    province: sanitizeAdviceField(params.province ?? existing.province, 80) ?? "",
    city: sanitizeAdviceField(params.city ?? existing.city, 80) ?? ""
  };

  database
    .prepare(
      `
        UPDATE advisor_profiles
        SET display_name = @displayName,
            preferred_language = @preferredLanguage,
            ui_language = @uiLanguage,
            conversation_language = @conversationLanguage,
            faith_style = @faithStyle,
            denomination = @denomination,
            province = @province,
            city = @city,
            personalization_json = @personalizationJson,
            updated_at = @updatedAt,
            last_active_at = @lastActiveAt
        WHERE actor_id = @actorId
      `
    )
    .run({
      actorId: params.actorId,
      ...nextProfile,
      personalizationJson: JSON.stringify(mergedPersonalization),
      updatedAt: now,
      lastActiveAt: now
    });

  return {
    profile: toProfile({
      ...existing,
      ...nextProfile,
      personalizationJson: JSON.stringify(mergedPersonalization),
      updatedAt: now,
      lastActiveAt: now
    }),
    sessions: await listAdviceSessions(params.actorId)
  };
}

export async function getAdviceHistory(sessionId: string, limit = 10) {
  const database = getDatabase();
  const messages = database
    .prepare(
      `
        SELECT
          id,
          session_id AS sessionId,
          actor_id AS actorId,
          role,
          model_name AS modelName,
          plain_text AS plainText,
          content_json AS contentJson,
          created_at AS createdAt
        FROM advisor_messages
        WHERE session_id = ?
        ORDER BY datetime(created_at) DESC
        LIMIT ?
      `
    )
    .all(sessionId, limit) as MessageRow[];

  return messages.reverse().map(toMessage);
}

export async function saveAdviceTurn(params: {
  session: AdviceSession;
  actorId: string;
  userText: string;
  assistantText: string;
  modelName: string;
  response: AdviceResponse;
  personalization?: AdvicePersonalization;
}) {
  const database = getDatabase();
  const now = new Date().toISOString();
  const sessionTitle = params.session.title === "New conversation" ? params.userText.slice(0, 56) || "Conversation" : params.session.title;
  const existingProfile = database
    .prepare(
      `
        SELECT
          actor_id AS actorId,
          actor_type AS actorType,
          clerk_user_id AS clerkUserId,
          guest_id AS guestId,
          display_name AS displayName,
          preferred_language AS preferredLanguage,
          ui_language AS uiLanguage,
          conversation_language AS conversationLanguage,
          faith_style AS faithStyle,
          denomination,
          province,
          city,
          personalization_json AS personalizationJson,
          created_at AS createdAt,
          updated_at AS updatedAt,
          last_active_at AS lastActiveAt
        FROM advisor_profiles
        WHERE actor_id = ?
      `
    )
    .get(params.actorId) as ProfileRow;

  const mergedPersonalization = mergePersonalization(parsePersonalization(existingProfile.personalizationJson), params.personalization);

  const transaction = database.transaction(() => {
    database
      .prepare(
        `
          INSERT INTO advisor_messages (id, session_id, actor_id, role, model_name, plain_text, content_json, created_at)
          VALUES (@id, @sessionId, @actorId, @role, @modelName, @plainText, @contentJson, @createdAt)
        `
      )
      .run({
        id: crypto.randomUUID(),
        sessionId: params.session.id,
        actorId: params.actorId,
        role: "user",
        modelName: "",
        plainText: params.userText,
        contentJson: JSON.stringify(null),
        createdAt: now
      });

    database
      .prepare(
        `
          INSERT INTO advisor_messages (id, session_id, actor_id, role, model_name, plain_text, content_json, created_at)
          VALUES (@id, @sessionId, @actorId, @role, @modelName, @plainText, @contentJson, @createdAt)
        `
      )
      .run({
        id: crypto.randomUUID(),
        sessionId: params.session.id,
        actorId: params.actorId,
        role: "assistant",
        modelName: params.modelName,
        plainText: params.assistantText,
        contentJson: JSON.stringify(params.response),
        createdAt: new Date(Date.now() + 1).toISOString()
      });

    database
      .prepare(
        `
          UPDATE advisor_sessions
          SET title = @title,
              updated_at = @updatedAt
          WHERE id = @id
        `
      )
      .run({
        id: params.session.id,
        title: sessionTitle,
        updatedAt: now
      });

    database
      .prepare(
        `
          UPDATE advisor_profiles
          SET personalization_json = @personalizationJson,
              updated_at = @updatedAt,
              last_active_at = @lastActiveAt
          WHERE actor_id = @actorId
        `
      )
      .run({
        actorId: params.actorId,
        personalizationJson: JSON.stringify(mergedPersonalization),
        updatedAt: now,
        lastActiveAt: now
      });
  });

  transaction();

  return {
    session: {
      ...params.session,
      title: sessionTitle,
      updatedAt: now
    },
    profilePersonalization: mergedPersonalization,
    summary: summarizeAdviceResponse(params.response)
  };
}
