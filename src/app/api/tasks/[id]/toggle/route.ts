import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { taskService } from "@/server/services/task.service";
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
    let targetStatus: "pending" | "completed" | undefined = undefined;

    try {
      const body = await req.json();
      if (body?.status === "pending" || body?.status === "completed") {
        targetStatus = body.status;
      }
    } catch {
      // Empty body allowed for simple toggle
    }

    const task = await taskService.toggleTaskStatus(id, user.id, targetStatus);
    return NextResponse.json({ data: task });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.error("POST /api/tasks/[id]/toggle error:", error);
    return NextResponse.json(
      { error: "Failed to toggle task" },
      { status: 500 }
    );
  }
}
