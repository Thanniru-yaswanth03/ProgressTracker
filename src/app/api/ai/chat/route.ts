import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/session";
import { aiService } from "@/server/services/ai.service";
import { ValidationError } from "@/lib/errors";
import { z } from "zod";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1, "Message cannot be empty").max(3000, "Message is too long"),
      })
    )
    .min(1, "At least one message is required")
    .max(50, "Conversation history cannot exceed 50 messages"),
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to use the AI Assistant." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const aiResponse = await aiService.chatWithAssistant(
      user.id,
      parsed.data.messages
    );

    return NextResponse.json({ data: aiResponse });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("POST /api/ai/chat error:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while processing your AI request.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
