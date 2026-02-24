import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logSecurityEvent } from '@/lib/auditLogger';

interface SecurityAlert {
  id: string;
  type: 'session_expiry_warning' | 'suspicious_activity' | 'rate_limit_warning';
  message: string;
  timestamp: number;
}

/**
 * Hook for monitoring security-related events and user activity
 */
export function useSecurityMonitor() {
  const { user, isSessionExpired } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  // Monitor for suspicious activity patterns
  useEffect(() => {
    if (!user) return;

    let rapidClickCount = 0;
    let rapidClickTimer: NodeJS.Timeout;

    const handleRapidClicking = () => {
      rapidClickCount++;
      
      if (rapidClickCount > 50) { // More than 50 clicks in 10 seconds
        const alert: SecurityAlert = {
          id: `rapid-click-${Date.now()}`,
          type: 'suspicious_activity',
          message: 'Unusual clicking activity detected',
          timestamp: Date.now(),
        };
        
        setAlerts(prev => [...prev, alert]);
        logSecurityEvent('rapid_clicking_detected', user.id, { clickCount: rapidClickCount });
        
        rapidClickCount = 0; // Reset counter
      }

      // Reset counter after 10 seconds of inactivity
      clearTimeout(rapidClickTimer);
      rapidClickTimer = setTimeout(() => {
        rapidClickCount = 0;
      }, 10000);
    };

    document.addEventListener('click', handleRapidClicking);
    
    return () => {
      document.removeEventListener('click', handleRapidClicking);
      clearTimeout(rapidClickTimer);
    };
  }, [user]);

  // Monitor for session expiration
  useEffect(() => {
    if (isSessionExpired && user) {
      logSecurityEvent('session_expired', user.id);
    }
  }, [isSessionExpired, user]);

  // Monitor for multiple failed requests (potential attack)
  const reportFailedRequest = (endpoint: string, error: string) => {
    if (!user) return;
    
    const failedRequests = JSON.parse(localStorage.getItem('failed_requests') || '[]');
    const now = Date.now();
    
    // Clean old entries (older than 1 hour)
    const recentFailures = failedRequests.filter((req: any) => now - req.timestamp < 3600000);
    
    recentFailures.push({ endpoint, error, timestamp: now });
    localStorage.setItem('failed_requests', JSON.stringify(recentFailures));

    // If more than 10 failed requests in the last hour, log as suspicious
    if (recentFailures.length > 10) {
      logSecurityEvent('multiple_failed_requests', user.id, { 
        count: recentFailures.length, 
        endpoints: recentFailures.map((r: any) => r.endpoint)
      });
      
      toast({
        title: "Security Alert",
        description: "Multiple failed requests detected. Please verify your connection.",
        variant: "destructive",
      });
    }
  };

  // Clear old alerts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setAlerts(prev => prev.filter(alert => now - alert.timestamp < 300000)); // Keep alerts for 5 minutes
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    reportFailedRequest,
    clearAlert: (alertId: string) => {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    },
  };
}
