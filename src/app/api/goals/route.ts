import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { goalService } from "@/server/services/goal.service";
import { z } from "zod";
import { ValidationError } from "@/lib/errors";
import { GoalStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sectionId = searchParams.get("sectionId") || undefined;
    const statusParam = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;

    const goals = await goalService.getGoals(user.id, {
      sectionId: sectionId || "all",
      status: (statusParam as GoalStatus | "all") || "all",
      search,
    });

    return NextResponse.json({ data: goals });
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
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
    const goal = await goalService.createGoal(user.id, body);
    return NextResponse.json({ data: goal }, { status: 201 });
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
    console.error("POST /api/goals error:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
