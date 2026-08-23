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
    const month =
      searchParams.get("month") || formatDateKey(new Date()).slice(0, 7);

    const history = await historyService.getMonthHistory(user.id, month);
    return NextResponse.json({ data: history });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("GET /api/history/month error:", error);
    return NextResponse.json(
      { error: "Failed to fetch month history" },
      { status: 500 }
    );
  }
}
