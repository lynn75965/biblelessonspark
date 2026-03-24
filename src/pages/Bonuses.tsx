import { Gift } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function Bonuses() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md text-center space-y-4">
          <Gift className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Resources Coming Soon</h1>
          <p className="text-muted-foreground">
            We are preparing special resources for BibleLessonSpark teachers. Check back soon.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
