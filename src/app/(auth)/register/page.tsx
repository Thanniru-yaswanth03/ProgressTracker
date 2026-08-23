import * as React from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Activity, Sparkles } from "lucide-react";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 shadow-lg shadow-indigo-500/30 mb-2 border border-indigo-400/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Progress<span className="text-indigo-400">Tracker</span>
          </h1>
          <p className="text-sm text-slate-400">
            Start tracking your habits, tasks, and goals today
          </p>
        </div>

        {/* Register Card */}
        <Card glow className="border-slate-800/80 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="justify-center text-xl flex items-center gap-2">
              <span>Create Your Account</span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
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
