import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { historyService } from "@/server/services/history.service";
import { formatDateKey } from "@/server/services/streak.service";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || formatDateKey(new Date());

    const history = await historyService.getDayHistory(user.id, date);
    return NextResponse.json({ data: history });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("GET /api/history/day error:", error);
    return NextResponse.json(
      { error: "Failed to fetch day history" },
      { status: 500 }
    );
  }
}
