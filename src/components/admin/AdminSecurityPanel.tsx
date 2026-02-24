/**
 * Admin Security Panel
 *
 * SSOT COMPLIANCE:
 * - All configuration imported from securityConfig.ts
 * - No hardcoded limits, categories, or display rules
 * - Component only handles rendering and data fetching
 * 
 * MERGED: Guardrails tab consolidated here (January 1, 2026)
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Shield, RefreshCw, User, Clock, ShieldAlert } from 'lucide-react';
import {
  SECURITY_DISPLAY,
  EVENT_CATEGORIES,
  getEventsForCategories,
  getEventMetadata,
  getSeverityColor,
  type EventCategoryId
} from '@/constants/securityConfig';
import { GuardrailViolationsPanel } from './GuardrailViolationsPanel';

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

  // Pagination state
  const [eventsPerPage, setEventsPerPage] = useState(10);
  const [currentEventPage, setCurrentEventPage] = useState(1);

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

  // Pagination logic
  const totalEventPages = Math.ceil(events.length / eventsPerPage);
  const paginatedEvents = events.slice(
    (currentEventPage - 1) * eventsPerPage,
    currentEventPage * eventsPerPage
  );

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
    <div className="space-y-6">
      {/* Security Section Header */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Guardrails
          </CardTitle>
          <CardDescription>
            Monitor security events and theological guardrail compliance
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sub-tabs for Security Events and Guardrails */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Security Events</span>
          </TabsTrigger>
          <TabsTrigger value="guardrails" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>Guardrail Violations</span>
          </TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="events" className="mt-4">
          <Card className="bg-gradient-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
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
                <div className="text-center py-8 text-destructive">
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
                  {paginatedEvents.map((event) => {
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

                  {/* Pagination Controls */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Show</span>
                      <select
                        value={eventsPerPage}
                        onChange={(e) => {
                          setEventsPerPage(Number(e.target.value));
                          setCurrentEventPage(1);
                        }}
                        className="border rounded px-2 py-1 bg-background"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>of {events.length} events</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentEventPage(p => Math.max(1, p - 1))}
                        disabled={currentEventPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm px-2">
                        Page {currentEventPage} of {totalEventPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentEventPage(p => Math.min(totalEventPages, p + 1))}
                        disabled={currentEventPage === totalEventPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guardrail Violations Tab */}
        <TabsContent value="guardrails" className="mt-4">
          <GuardrailViolationsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
