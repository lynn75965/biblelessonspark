import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, X } from 'lucide-react';
import { useSecurityMonitor } from '@/hooks/useSecurityMonitor';

export function SecurityAlerts() {
  const { alerts, clearAlert } = useSecurityMonitor();

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant="destructive" className="pr-8">
          <div className="flex items-start gap-2">
            {alert.type === 'suspicious_activity' ? (
              <AlertTriangle className="h-4 w-4 mt-0.5" />
            ) : (
              <Shield className="h-4 w-4 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertTitle>Security Alert</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-6 w-6 p-0"
              onClick={() => clearAlert(alert.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}