import { Wrench } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function MoreTools() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md text-center space-y-4">
          <Wrench className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold tracking-tight">Teacher Tools Coming Soon</h1>
          <p className="text-muted-foreground">
            Additional teaching tools and resources are on the way. We will notify you when they are available.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
