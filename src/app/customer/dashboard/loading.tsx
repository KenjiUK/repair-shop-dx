import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-4" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
    </div>
  );
}
