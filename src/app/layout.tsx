import type { Metadata } from "next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Progress Tracker — Personal Growth & Momentum",
  description: "Track habits, manage tasks, maintain streaks, and achieve your goals with seamless precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-indigo-600 dark:selection:text-indigo-200 transition-colors duration-300">
        <ThemeProvider>
          <div className="fixed inset-0 glow-gradient pointer-events-none -z-10" />
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-indigo-500/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none -z-10" />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
