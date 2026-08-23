import { Skeleton } from "@/components/ui/Skeleton";

export default function SectionDetailLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Hero Banner skeleton */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
        </div>
        <Skeleton className="h-4 w-full max-w-lg" />
        <div className="pt-2 border-t border-slate-800 flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 h-40" />
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 h-40" />
      </div>
    </div>
  );
}
