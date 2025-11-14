import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Clock, User } from 'lucide-react';

interface SecurityEvent {
  id: string;
  event: string;
  meta: any;
  created_at: string;
  user_id: string;
  lesson_id?: string | null;
}

export function SecurityMonitor() {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSecurityEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .like('event', 'security_%')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching security events:', error);
          return;
        }

        setSecurityEvents(data || []);
      } catch (error) {
        console.error('Error in fetchSecurityEvents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSecurityEvents();

    // Set up real-time subscription for security events
    const subscription = supabase
      .channel('security_events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newEvent = payload.new as SecurityEvent;
          if (newEvent.event.startsWith('security_')) {
            setSecurityEvents(prev => [newEvent, ...prev.slice(0, 9)]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('role_changed')) return <User className="h-4 w-4" />;
    if (eventType.includes('founder_status')) return <User className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getEventVariant = (eventType: string): "default" | "destructive" | "secondary" => {
    if (eventType.includes('role_changed') || eventType.includes('founder_status')) {
      return "destructive";
    }
    return "secondary";
  };

  const formatEventMessage = (event: SecurityEvent) => {
    const eventType = event.event.replace('security_', '');
    const meta = event.meta || {};
    
    switch (eventType) {
      case 'role_changed':
        return `Role changed from "${meta.old_role}" to "${meta.new_role}"`;
      case 'founder_status_changed':
        return `Founder status changed from "${meta.old_status}" to "${meta.new_status}"`;
      default:
        return `Security event: ${eventType}`;
    }
  };

  if (!user) return null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Security Activity Monitor
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Recent security events for your account
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Clock className="h-4 w-4 animate-spin mr-2" />
            Loading security events...
          </div>
        ) : securityEvents.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            No security events recorded
          </div>
        ) : (
          <div className="space-y-3">
            {securityEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getEventIcon(event.event)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getEventVariant(event.event)} className="text-xs">
                      {event.event.replace('security_', '').replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium">
                    {formatEventMessage(event)}
                  </p>
                  {event.meta?.changed_by && event.meta.changed_by !== user.id && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Changed by administrator
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}