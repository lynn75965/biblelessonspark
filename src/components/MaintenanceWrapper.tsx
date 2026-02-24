import { ReactNode } from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { PROGRAM_CONFIG } from "@/constants/programConfig";
import { Loader2, Wrench } from "lucide-react";

interface MaintenanceWrapperProps {
  children: ReactNode;
}

export function MaintenanceWrapper({ children }: MaintenanceWrapperProps) {
  const { settings, loading: settingsLoading } = useSystemSettings();
  const { isAdmin, loading: adminLoading } = useAdminAccess();

  if (settingsLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (settings.maintenance_mode && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center p-8 max-w-md">
          <Wrench className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {PROGRAM_CONFIG.maintenance.title}
          </h1>
          <p className="text-muted-foreground mb-6">
            {PROGRAM_CONFIG.maintenance.message}
          </p>
          <p className="text-sm text-muted-foreground">
            {PROGRAM_CONFIG.maintenance.subtext}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
