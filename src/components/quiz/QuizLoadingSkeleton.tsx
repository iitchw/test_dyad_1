import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const QuizLoadingSkeleton = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-4">
    <Card className="w-full max-w-4xl p-8 space-y-6">
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <div className="space-y-4 p-6 border rounded-lg">
        <Skeleton className="h-8 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </Card>
  </div>
);