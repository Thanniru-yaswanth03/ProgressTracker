import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "progresstracker_super_secret_jwt_auth_key_2026_x87v2",
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const isProtected =
        pathname === "/" ||
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/sections") ||
        pathname.startsWith("/tasks") ||
        pathname.startsWith("/habits") ||
        pathname.startsWith("/activities") ||
        pathname.startsWith("/goals") ||
        pathname.startsWith("/history") ||
        pathname.startsWith("/analytics");

      const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

      if (isProtected) {
        if (isLoggedIn) {
          return true;
        }
        return false; // Automatically redirects to /login?callbackUrl=...
      }

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      return true;
    },
  },
  providers: [], // Overridden in auth.ts with Credentials provider
};
