import { NextResponse } from "next/server";

import { createReview, readReviews } from "@/lib/reviews";

export const runtime = "nodejs";

export async function GET() {
  const reviews = await readReviews();

  return NextResponse.json({ reviews });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      location?: string;
      rating?: number;
      message?: string;
    };

    const review = await createReview({
      name: body.name ?? "",
      location: body.location ?? "",
      rating: body.rating ?? 0,
      message: body.message ?? ""
    });

    return NextResponse.json(
      {
        review,
        message: "Thank you. Your review has been submitted for moderation."
      },
      { status: 202 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save your review right now.";
    const status = message.toLowerCase().includes("already been submitted") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
