/**
 * Admin Security Panel
 * 
 * SSOT COMPLIANCE:
 * - All configuration imported from securityConfig.ts
 * - No hardcoded limits, categories, or display rules
 * - Component only handles rendering and data fetching
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, RefreshCw, User, Clock } from 'lucide-react';
import { 
  SECURITY_DISPLAY, 
  EVENT_CATEGORIES,
  getEventsForCategories,
  getEventMetadata,
  getSeverityColor,
  type EventCategoryId 
} from '@/constants/securityConfig';

interface EventRecord {
  id: string;
  event: string;
  user_id: string;
  lesson_id: string | null;
  meta: Record<string, any> | null;
  created_at: string;
  user_email?: string;
}

export function AdminSecurityPanel() {
  const { isAdmin, loading: adminLoading } = useAdminAccess();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get config from SSOT
  const config = SECURITY_DISPLAY.admin;
  const eventTypes = getEventsForCategories(config.defaultCategories);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch events with user info
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*')
        .in('event', eventTypes)
        .order('created_at', { ascending: false })
        .limit(config.defaultLimit);

      if (fetchError) throw fetchError;

      // If we need user emails, fetch them separately
      if (config.showUserEmail && data && data.length > 0) {
        const userIds = [...new Set(data.map(e => e.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || []);
        
        setEvents(data.map(e => ({
          ...e,
          user_email: emailMap.get(e.user_id) || 'Unknown'
        })));
      } else {
        setEvents(data || []);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load security events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
    }
  }, [isAdmin]);

  // Loading state
  if (adminLoading) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Admin access required</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Events
            </CardTitle>
            <CardDescription>
              Monitoring {config.defaultCategories.map(c => EVENT_CATEGORIES[c].label).join(', ')}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchEvents}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-center py-8 text-red-600">
            <p>{error}</p>
            <Button variant="outline" onClick={fetchEvents} className="mt-4">
              Try Again
            </Button>
          </div>
        )}

        {loading && !error && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No security events recorded yet</p>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="space-y-3">
            {events.map((event) => {
              const metadata = getEventMetadata(event.event);
              const severityClass = getSeverityColor(metadata.severity);
              
              return (
                <div 
                  key={event.id} 
                  className="flex items-start gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <Badge variant="outline" className={severityClass}>
                    {metadata.label}
                  </Badge>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">
                      {metadata.description}
                    </p>
                    {event.meta?.path && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Path: {event.meta.path}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right text-xs text-muted-foreground flex-shrink-0">
                    {config.showUserEmail && event.user_email && (
                      <div className="flex items-center gap-1 mb-1">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">{event.user_email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
            
            <p className="text-center text-xs text-muted-foreground pt-4">
              Showing {events.length} of {config.defaultLimit} most recent events
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
