import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { goalService } from "@/server/services/goal.service";
import { NotFoundError, ValidationError } from "@/lib/errors";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const goal = await goalService.togglePauseGoal(id, user.id);
    return NextResponse.json({ data: goal });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/goals/[id]/pause error:", error);
    return NextResponse.json(
      { error: "Failed to toggle pause state" },
      { status: 500 }
    );
  }
}
