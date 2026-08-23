import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { habitService } from "@/server/services/habit.service";
import { z } from "zod";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("sectionId") || undefined;
    const archivedParam = searchParams.get("archived");
    const archived = archivedParam !== null ? archivedParam === "true" : false;
    const search = searchParams.get("search") || undefined;

    const habits = await habitService.getHabits(user.id, {
      sectionId: sectionId || "all",
      archived,
      search,
    });

    return NextResponse.json({ data: habits });
  } catch (error) {
    console.error("GET /api/habits error:", error);
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const habit = await habitService.createHabit(user.id, body);
    return NextResponse.json({ data: habit }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/habits error:", error);
    return NextResponse.json(
      { error: "Failed to create habit" },
      { status: 500 }
    );
  }
}
