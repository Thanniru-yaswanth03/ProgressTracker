import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { aiService } from "@/server/services/ai.service";
import { ValidationError } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view AI insights." },
        { status: 401 }
      );
    }

    const insights = await aiService.getQuickInsights(user.id);
    return NextResponse.json({ data: insights });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("GET /api/ai/insights error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI insights." },
      { status: 500 }
    );
  }
}
