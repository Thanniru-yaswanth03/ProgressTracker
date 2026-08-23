import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { goalService } from "@/server/services/goal.service";
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
    const body = await req.json();

    const progress = Number(body.progress ?? body.currentValue);
    if (isNaN(progress) || progress < 0) {
      return NextResponse.json(
        { error: "Invalid progress value. Must be a non-negative number." },
        { status: 400 }
      );
    }

    const goal = await goalService.updateGoalProgress(id, user.id, progress);
    return NextResponse.json({ data: goal });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/goals/[id]/progress error:", error);
    return NextResponse.json(
      { error: "Failed to update goal progress" },
      { status: 500 }
    );
  }
}
