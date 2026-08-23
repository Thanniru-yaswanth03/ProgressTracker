import * as React from "react";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Activity, ShieldCheck } from "lucide-react";

export default async function LoginPage() {
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
            Build consistency, track progress, master habits.
          </p>
        </div>

        {/* Login Card */}
        <Card glow className="border-slate-800/80 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="justify-center text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Enter your credentials to access your protected workspace
            </CardDescription>
          </CardHeader>

          <Suspense fallback={<div className="h-48 flex items-center justify-center text-slate-500 text-sm">Loading login form...</div>}>
            <LoginForm />
          </Suspense>
        </Card>

        {/* Security / Privacy Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Encrypted with bcrypt & secure HTTP-only sessions</span>
        </div>
      </div>
    </div>
  );
}
