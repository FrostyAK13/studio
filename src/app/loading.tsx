import { Skeleton } from "@/components/ui/skeleton";
import { Bitcoin, BrainCircuit, History, Settings, Star } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2">
          <Bitcoin className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-bold text-foreground">frostytraders.com</h1>
        </div>
        <div className="ml-auto">
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:grid md:grid-cols-3 lg:grid-cols-4 lg:gap-6 lg:p-6">
        <div className="flex flex-col gap-4 md:col-span-2 lg:col-span-3">
            <div className="flex flex-row items-center justify-between p-6">
                <div className="grid gap-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>
                <div className="ml-auto">
                    <Skeleton className="h-10 w-[200px]" />
                </div>
            </div>
            <Skeleton className="h-[55vh] w-full" />
        </div>
        <div className="flex flex-col gap-4">
            <div className="grid h-10 w-full grid-cols-3 rounded-md bg-muted p-1">
                <Skeleton className="h-full w-full" />
                <Skeleton className="h-full w-full" />
                <Skeleton className="h-full w-full" />
            </div>
            <Skeleton className="h-[60vh] w-full" />
        </div>
      </main>
    </div>
  );
}
