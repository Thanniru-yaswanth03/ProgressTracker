import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { habitService } from "@/server/services/habit.service";
import { NotFoundError, ValidationError } from "@/lib/errors";

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
    let dateStr: string | undefined = undefined;

    try {
      const body = await req.json();
      if (body?.date) {
        dateStr = body.date;
      }
    } catch {
      // Empty body allows toggling today's date
    }

    const result = await habitService.toggleHabitLog(id, user.id, dateStr);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/habits/[id]/log error:", error);
    return NextResponse.json(
      { error: "Failed to toggle habit check-in" },
      { status: 500 }
    );
  }
}
