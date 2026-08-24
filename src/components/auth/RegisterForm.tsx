"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Eye, EyeOff, Lock, Mail, User as UserIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { registerAction } from "@/server/actions/auth.actions";

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = React.useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 25, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { score: 50, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 75, label: "Good", color: "bg-blue-500" };
    return { score: 100, label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});
    setIsLoading(true);

    const res = await registerAction({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    if (!res.success) {
      setIsLoading(false);
      if (res.errors) {
        setFieldErrors(res.errors);
      }
      if (res.error) {
        setGeneralError(res.error);
      }
      return;
    }

    // Auto sign-in after successful registration
    try {
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        // Redirect to login with success note if auto-sign in has edge-case issue
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Auto sign-in error:", err);
      router.push("/login?registered=true");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {generalError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      <Input
        label="Full Name"
        id="name"
        name="name"
        type="text"
        autoComplete="name"
        placeholder="Alex Morgan"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        icon={<UserIcon className="w-4 h-4" />}
        error={fieldErrors.name?.[0]}
        disabled={isLoading}
      />

      <Input
        label="Email Address"
        id="email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        placeholder="you@example.com"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon={<Mail className="w-4 h-4" />}
        error={fieldErrors.email?.[0]}
        disabled={isLoading}
      />

      <div className="space-y-1.5">
        <Input
          label="Password"
          id="new-password"
          name="new-password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Min 6 characters"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          error={fieldErrors.password?.[0]}
          disabled={isLoading}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 cursor-pointer focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          }
        />

        {password.length > 0 && (
          <div className="pt-1.5 space-y-1">
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium">
              <span>Password strength</span>
              <span>{strength.label}</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength.color}`}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <Button
        type="submit"
        className="w-full mt-2"
        size="lg"
        isLoading={isLoading}
      >
        Create Account
      </Button>

      <div className="text-center pt-2 text-xs text-slate-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
