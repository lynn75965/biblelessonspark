/**
 * GuardrailViolationsPanel - Admin Dashboard Component
 * Displays theological guardrail violation statistics and recent violations.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ShieldAlert, CheckCircle, Eye, RefreshCw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ViolationSummary {
  theology_profile_id: string;
  theology_profile_name: string;
  total_violations: number;
  unreviewed_count: number;
  total_terms_violated: number;
  latest_violation: string | null;
}

interface ViolationDetail {
  id: string;
  lesson_id: string;
  user_id: string;
  theology_profile_name: string;
  violated_terms: string[];
  violation_count: number;
  violation_contexts: Array<{
    term: string;
    occurrences: number;
    samples: string[];
  }>;
  lesson_title: string;
  age_group: string;
  bible_passage: string | null;
  created_at: string;
  was_reviewed: boolean;
  review_notes: string | null;
}

export function GuardrailViolationsPanel() {
  const [summary, setSummary] = useState<ViolationSummary[]>([]);
  const [recentViolations, setRecentViolations] = useState<ViolationDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [marking, setMarking] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: summaryData, error: summaryError } = await supabase
        .from('guardrail_violation_summary')
        .select('*');
      if (summaryError) throw summaryError;
      setSummary(summaryData || []);

      const { data: violationsData, error: violationsError } = await supabase
        .from('guardrail_violations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (violationsError) throw violationsError;
      setRecentViolations(violationsData || []);
    } catch (err: any) {
      console.error('Error fetching violations:', err);
      setError(err.message || 'Failed to load violation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkReviewed = async (violation: ViolationDetail) => {
    setMarking(true);
    try {
      const { error } = await supabase
        .from('guardrail_violations')
        .update({
          was_reviewed: true,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null
        })
        .eq('id', violation.id);
      if (error) throw error;
      toast({ title: "Marked as Reviewed", description: "Violation has been marked as reviewed." });
      setReviewNotes("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update violation", variant: "destructive" });
    } finally {
      setMarking(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const totalUnreviewed = summary.reduce((sum, s) => sum + (s.unreviewed_count || 0), 0);
  const totalViolations = summary.reduce((sum, s) => sum + (s.total_violations || 0), 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Guardrail Violations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Guardrail Violations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchData} variant="outline" className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Guardrail Violations
            </CardTitle>
            <CardDescription>
              Track when AI generates content with prohibited terminology
            </CardDescription>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{totalViolations}</div>
            <div className="text-sm text-muted-foreground">Total Violations</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-amber-600">{totalUnreviewed}</div>
            <div className="text-sm text-muted-foreground">Unreviewed</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{summary.length}</div>
            <div className="text-sm text-muted-foreground">Profiles Affected</div>
          </div>
        </div>

        {totalViolations === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-primary" />
            <p className="font-medium">No Violations Detected</p>
            <p className="text-sm">All generated lessons are following theological guardrails correctly.</p>
          </div>
        ) : (
          <>
            {/* Summary by Profile */}
            {summary.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Violations by Theology Profile</h4>
                <div className="space-y-2">
                  {summary.map((s) => (
                    <div key={s.theology_profile_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/30 rounded-lg gap-2">
                      <div>
                        <span className="font-medium">{s.theology_profile_name}</span>
                        {s.unreviewed_count > 0 && (
                          <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">
                            {s.unreviewed_count} unreviewed
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {s.total_violations} violation{s.total_violations !== 1 ? 's' : ''} â€¢ {s.total_terms_violated} term{s.total_terms_violated !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Violations Table */}
            {recentViolations.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Recent Violations</h4>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Lesson</TableHead>
                        <TableHead className="hidden sm:table-cell">Profile</TableHead>
                        <TableHead>Violated Terms</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentViolations.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatDate(v.created_at)}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={v.lesson_title}>
                            {v.lesson_title}
                          </TableCell>
                          <TableCell className="text-sm hidden sm:table-cell">
                            {v.theology_profile_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {v.violated_terms.slice(0, 2).map((term, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{term}</Badge>
                              ))}
                              {v.violated_terms.length > 2 && (
                                <Badge variant="outline" className="text-xs">+{v.violated_terms.length - 2}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {v.was_reviewed ? (
                              <Badge variant="secondary" className="bg-primary/10 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />Reviewed
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => setReviewNotes(v.review_notes || "")}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Violation Details</DialogTitle>
                                  <DialogDescription>{v.lesson_title} â€¢ {v.theology_profile_name}</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-muted-foreground">Date:</span><span className="ml-2">{formatDate(v.created_at)}</span></div>
                                    <div><span className="text-muted-foreground">Age Group:</span><span className="ml-2">{v.age_group}</span></div>
                                    {v.bible_passage && (
                                      <div className="col-span-1 sm:col-span-2"><span className="text-muted-foreground">Passage:</span><span className="ml-2">{v.bible_passage}</span></div>
                                    )}
                                  </div>
                                  <div>
                                    <h5 className="font-medium mb-2">Violated Terms ({v.violation_count} occurrences)</h5>
                                    <div className="space-y-3">
                                      {v.violation_contexts?.map((ctx, i) => (
                                        <div key={i} className="bg-muted/50 rounded-lg p-3">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="destructive">{ctx.term}</Badge>
                                            <span className="text-sm text-muted-foreground">({ctx.occurrences}x)</span>
                                          </div>
                                          <div className="space-y-1">
                                            {ctx.samples?.map((sample, j) => (
                                              <p key={j} className="text-sm text-muted-foreground bg-background p-2 rounded break-words"
                                                dangerouslySetInnerHTML={{ __html: sample.replace(/\*\*(.*?)\*\*/g, '<mark class="bg-red-200 px-1 rounded">$1</mark>') }}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  {!v.was_reviewed && (
                                    <div className="border-t pt-4">
                                      <h5 className="font-medium mb-2">Mark as Reviewed</h5>
                                      <Textarea placeholder="Optional review notes..." value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} className="mb-3" />
                                      <Button onClick={() => handleMarkReviewed(v)} disabled={marking}>
                                        {marking ? "Saving..." : "Mark as Reviewed"}
                                      </Button>
                                    </div>
                                  )}
                                  {v.was_reviewed && v.review_notes && (
                                    <div className="border-t pt-4">
                                      <h5 className="font-medium mb-2">Review Notes</h5>
                                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{v.review_notes}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
