import * as React from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Activity, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Sign In — Progress Tracker",
  description: "Sign in to your Progress Tracker workspace.",
};

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-[var(--background)]">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--primary)] text-white shadow-md mb-2">
            <Activity className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
            Progress<span className="text-[var(--primary)]">Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted-foreground)]">
            Build consistency, track progress, master habits.
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <CardHeader className="text-center pb-4 p-0">
            <CardTitle className="justify-center text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your protected workspace
            </CardDescription>
          </CardHeader>

          <Suspense fallback={<div className="h-48 flex items-center justify-center text-[var(--muted-foreground)] text-sm">Loading login form...</div>}>
            <LoginForm />
          </Suspense>
        </Card>

        {/* Security / Privacy Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--muted-foreground)]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Encrypted with bcrypt & secure HTTP-only sessions</span>
        </div>
      </div>
    </div>
  );
}
