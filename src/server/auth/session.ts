import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth";
import { AuthSessionUser } from "@/types";

/**
 * Returns the currently authenticated user or null if not logged in.
 */
export async function getCurrentUser(): Promise<AuthSessionUser | null> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || "User",
  };
}

/**
 * Returns the currently authenticated user or redirects to /login.
 * Use this as the single authorization check choke-point across all server actions, pages, and services.
 */
export async function requireUser(): Promise<AuthSessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
