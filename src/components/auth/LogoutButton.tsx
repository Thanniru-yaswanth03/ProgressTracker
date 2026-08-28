"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      isLoading={isLoading}
      className="text-xs hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-600 dark:hover:text-rose-400 transition-all gap-1.5"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Sign Out</span>
    </Button>
  );
}
