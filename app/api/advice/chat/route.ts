import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { assertAdviceRateLimit } from "@/lib/advice-rate-limit";
import { generateAdvice } from "@/lib/advice-service";
import { getAdviceBootstrap, getAdviceHistory, getOrCreateAdviceSession, saveAdviceTurn, ensureAdvisorProfile, updateAdvisorProfile } from "@/lib/advice-store";
import type { AdviceFaithStyle, AdviceLanguage } from "@/lib/advice-types";
import { parsePersonalization } from "@/lib/advice-utils";

function sanitizeText(value: unknown, maxLength = 120) {
  if (typeof value !== "string") {
    return undefined;
  }

  const nextValue = value.trim().slice(0, maxLength);
  return nextValue || undefined;
}

export const runtime = "nodejs";

function sanitizeGuestId(value: string | null) {
  if (!value) {
    return null;
  }

  return value.trim().slice(0, 120) || null;
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    const url = new URL(request.url);
    const guestId = sanitizeGuestId(url.searchParams.get("guestId"));
    const sessionId = sanitizeGuestId(url.searchParams.get("sessionId"));

    const bootstrap = await getAdviceBootstrap({
      clerkUserId: userId,
      guestId
    }, sessionId);

    return NextResponse.json(bootstrap);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the advice studio right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const body = (await request.json()) as {
      guestId?: string;
      sessionId?: string;
      message?: string;
      displayName?: string;
    };
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (message.length < 4 || message.length > 3000) {
      return NextResponse.json({ error: "Please enter a message between 4 and 3000 characters." }, { status: 400 });
    }

    const { profile, actor } = await ensureAdvisorProfile({
      clerkUserId: userId,
      guestId: sanitizeGuestId(body.guestId ?? null),
      displayName: typeof body.displayName === "string" ? body.displayName.trim().slice(0, 80) : undefined
    });
    assertAdviceRateLimit(actor.actorId);
    const session = await getOrCreateAdviceSession(actor.actorId, sanitizeGuestId(body.sessionId ?? null));
    const history = await getAdviceHistory(session.id, 12);
    const generated = await generateAdvice({
      message,
      history,
      profile
    });
    const saved = await saveAdviceTurn({
      session,
      actorId: actor.actorId,
      userText: message,
      assistantText: generated.response.replyText,
      modelName: generated.modelName,
      response: generated.response,
      personalization: generated.response.personalization
    });

    return NextResponse.json({
      session: saved.session,
      profile: {
        ...profile,
        personalization: saved.profilePersonalization
      },
      reply: generated.response,
      model: generated.modelName,
      sessions: await getAdviceBootstrap({
        clerkUserId: userId,
        guestId: sanitizeGuestId(body.guestId ?? null)
      }, saved.session.id).then((bootstrap) => bootstrap.sessions)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The advisor could not respond right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    const body = (await request.json()) as {
      guestId?: string;
      displayName?: string;
      preferredLanguage?: string;
      uiLanguage?: string;
      conversationLanguage?: string;
      faithStyle?: string;
      denomination?: string;
      province?: string;
      city?: string;
      personalization?: unknown;
    };

    const { actor } = await ensureAdvisorProfile({
      clerkUserId: userId,
      guestId: sanitizeGuestId(body.guestId ?? null)
    });

    const updated = await updateAdvisorProfile({
      actorId: actor.actorId,
      displayName: sanitizeText(body.displayName, 80),
      preferredLanguage: body.preferredLanguage as AdviceLanguage | undefined,
      uiLanguage: body.uiLanguage as AdviceLanguage | undefined,
      conversationLanguage: body.conversationLanguage as AdviceLanguage | undefined,
      faithStyle: body.faithStyle as AdviceFaithStyle | undefined,
      denomination: sanitizeText(body.denomination, 80),
      province: sanitizeText(body.province, 80),
      city: sanitizeText(body.city, 80),
      personalization: parsePersonalization(body.personalization)
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the advisor profile right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
