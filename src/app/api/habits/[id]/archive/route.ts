import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { habitService } from "@/server/services/habit.service";
import { NotFoundError } from "@/lib/errors";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    let archived = true;

    try {
      const body = await req.json();
      if (typeof body?.archived === "boolean") {
        archived = body.archived;
      }
    } catch {
      // Default is true
    }

    const habit = await habitService.archiveHabit(id, user.id, archived);
    return NextResponse.json({ data: habit });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }
    console.error("POST /api/habits/[id]/archive error:", error);
    return NextResponse.json(
      { error: "Failed to update archive status" },
      { status: 500 }
    );
  }
}
