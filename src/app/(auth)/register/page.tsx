import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Activity, Sparkles } from "lucide-react";

export const metadata = {
  title: "Create Account — Progress Tracker",
  description: "Join Progress Tracker to begin your personal momentum journey.",
};

export default async function RegisterPage() {
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
            Start tracking your habits, tasks, and goals today
          </p>
        </div>

        {/* Register Card */}
        <Card className="p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <CardHeader className="text-center pb-4 p-0">
            <CardTitle className="justify-center text-xl flex items-center gap-2">
              <span>Create Your Account</span>
              <Sparkles className="w-4 h-4 text-[var(--primary)]" />
            </CardTitle>
            <CardDescription>
              Join Progress Tracker to begin your personal momentum journey
            </CardDescription>
          </CardHeader>

          <RegisterForm />
        </Card>
      </div>
    </div>
  );
}
