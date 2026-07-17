/**
 * GuardrailViolationsPanel - Admin Dashboard Component
 * Displays theological guardrail violation statistics and recent violations.
 */

import { useState, useEffect, useRef } from "react";
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
import { ShieldAlert, CheckCircle, Eye, RefreshCw, AlertTriangle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UI_SYMBOLS, formatEmpty } from "@/constants/uiSymbols";
import {
  getViolationPatternMeta,
  GUARDRAIL_SUMMARY_HEADING,
  REVIEW_DISPOSITIONS,
  VIOLATION_PATTERNS,
  GUARDRAIL_PATTERN_RETUNED_NOTICE,
  GUARDRAIL_TEXT_NOT_FOUND_NOTICE,
} from "@/constants/outputGuardrails";
import { formatLessonContentToHtml, LESSON_CONTENT_CONTAINER_CLASSES, LESSON_CONTENT_CONTAINER_STYLES } from "@/utils/formatLessonContent";

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
    matchedPhrase?: string;
  }>;
  lesson_title: string;
  age_group: string;
  bible_passage: string | null;
  created_at: string;
  was_reviewed: boolean;
  review_notes: string | null;
}

interface UserContext {
  full_name: string | null;
  email: string | null;
  subscription_tier: string | null;
  theology_profile_id: string | null;
  organization_name: string | null;
}

interface ViolationDetailDialogProps {
  violation: ViolationDetail;
  reviewNotes: string;
  setReviewNotes: (notes: string) => void;
  marking: boolean;
  onMarkReviewed: (violation: ViolationDetail) => void;
  formatDate: (dateString: string) => string;
}

// Text-node-level highlight helpers for Full Lesson Content.
// Operate on real DOM nodes only -- never string-concatenate user content
// into HTML -- so the existing dangerouslySetInnerHTML output stays the
// only place raw lesson text is parsed as markup.
//
// Matching is whitespace-tolerant and node-boundary-tolerant: the raw
// stored snippet's "\n\n" (paragraph break), "**bold**" markers, and
// "---" dividers become element boundaries in the rendered HTML with
// ZERO corresponding characters in textContent (a <p>A</p><p>B</p>
// flattens to "AB", not "A B"; formatLessonContentToHtml consumes "*",
// "#", and "-" entirely rather than repositioning them) -- so an
// exact-substring search against any single text node can never find
// text that spans those boundaries. Both the needle and the flattened
// container text strip the same character class (whitespace plus *#-)
// before comparison, so this never depends on exact markdown/whitespace
// reproduction between the raw stored snippet and the rendered DOM.

const STRUCTURAL_CHARS = /[\s*#-]/;

interface FlatTextNode {
  node: Text;
  start: number;
  end: number;
}

function buildFlatTextMap(container: HTMLElement): { flatText: string; nodeMap: FlatTextNode[] } {
  const nodeMap: FlatTextNode[] = [];
  let flatText = '';
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    const text = node.textContent || '';
    const start = flatText.length;
    flatText += text;
    nodeMap.push({ node, start, end: start + text.length });
    node = walker.nextNode() as Text | null;
  }
  return { flatText, nodeMap };
}

function stripStructuralCharsWithMap(text: string): { stripped: string; map: number[] } {
  let stripped = '';
  const map: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (!STRUCTURAL_CHARS.test(text[i])) {
      stripped += text[i];
      map.push(i);
    }
  }
  return { stripped, map };
}

function wrapFlatRange(nodeMap: FlatTextNode[], flatStart: number, flatEnd: number): HTMLElement | null {
  let firstMark: HTMLElement | null = null;
  for (const entry of nodeMap) {
    if (entry.end <= flatStart || entry.start >= flatEnd) continue;
    const node = entry.node;
    if (!node.parentNode) continue;
    const nodeText = node.textContent || '';
    const localStart = Math.max(0, flatStart - entry.start);
    const localEnd = Math.min(nodeText.length, flatEnd - entry.start);
    if (localStart >= localEnd) continue;

    const afterMatch = node.splitText(localStart);
    afterMatch.splitText(localEnd - localStart);
    const mark = document.createElement('mark');
    mark.className = 'bg-red-200 px-1 rounded font-bold';
    mark.textContent = afterMatch.textContent;
    afterMatch.parentNode?.replaceChild(mark, afterMatch);
    if (!firstMark) firstMark = mark;
  }
  return firstMark;
}

// Isolates the exact matched term within an already-stored snippet by
// running the pattern associated with the violation's code -- never
// against live content, so this stays "source of truth: the stored
// matched text," not a fresh guardrail re-scan. Returns null if the
// pattern (possibly retuned since flagging) no longer matches anything
// in that snippet -- callers must not fall back to treating the whole
// snippet as a match.
function findMatchedTerm(
  patternDef: (typeof VIOLATION_PATTERNS)[number] | undefined,
  sample: string
): string | null {
  if (!patternDef) return null;
  const match = sample.match(patternDef.pattern);
  return match && match[0] ? match[0] : null;
}

// Prefers the phrase persisted at flag time (tuning-proof, immune to any
// later pattern change) over re-deriving it from the current pattern.
// Only violations logged before matchedPhrase existed fall through to
// re-derivation.
function resolveMatchedTerm(
  ctx: { term: string; matchedPhrase?: string },
  sample: string,
  patternDef: (typeof VIOLATION_PATTERNS)[number] | undefined
): string | null {
  if (ctx.matchedPhrase) return ctx.matchedPhrase;
  return findMatchedTerm(patternDef, sample);
}

function highlightNeedleInContainer(container: HTMLElement, needle: string): HTMLElement | null {
  const needleStripped = needle.replace(new RegExp(STRUCTURAL_CHARS.source, 'g'), '');
  if (!needleStripped) return null;

  const { flatText, nodeMap } = buildFlatTextMap(container);
  const { stripped: flatStripped, map: strippedToFlatIndex } = stripStructuralCharsWithMap(flatText);

  const idxInStripped = flatStripped.indexOf(needleStripped);
  if (idxInStripped === -1) return null;

  const flatStart = strippedToFlatIndex[idxInStripped];
  const flatEnd = strippedToFlatIndex[idxInStripped + needleStripped.length - 1] + 1;

  return wrapFlatRange(nodeMap, flatStart, flatEnd);
}

function ViolationDetailDialog({
  violation,
  reviewNotes,
  setReviewNotes,
  marking,
  onMarkReviewed,
  formatDate,
}: ViolationDetailDialogProps) {
  const [context, setContext] = useState<UserContext | null>(null);
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [selectedDisposition, setSelectedDisposition] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [missingHighlight, setMissingHighlight] = useState(false);
  const [patternRetuned, setPatternRetuned] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) return;

    setReviewNotes(violation.review_notes || "");
    setSelectedDisposition(null);
    if (fetched) return;
    setFetched(true);
    setLoadingContext(true);

    (async () => {
      try {
        // Two-query pattern -- lessons.user_id has no FK to profiles
        // (same reasoning documented in AllLessonsPanel.tsx)
        const [{ data: profile }, { data: lesson }] = await Promise.all([
          violation.user_id
            ? supabase
                .from('profiles')
                .select('full_name, email, subscription_tier, theology_profile_id, organization_id')
                .eq('id', violation.user_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
          violation.lesson_id
            ? supabase
                .from('lessons')
                .select('original_text')
                .eq('id', violation.lesson_id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ]);

        let organizationName: string | null = null;
        if (profile?.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', profile.organization_id)
            .maybeSingle();
          organizationName = org?.name ?? null;
        }

        setContext({
          full_name: profile?.full_name ?? null,
          email: profile?.email ?? null,
          subscription_tier: profile?.subscription_tier ?? null,
          theology_profile_id: profile?.theology_profile_id ?? null,
          organization_name: organizationName,
        });
        setLessonContent(lesson?.original_text ?? null);
      } catch (err) {
        console.error('Error fetching violation context:', err);
      } finally {
        setLoadingContext(false);
      }
    })();
  };

  // Highlight the actual matched term inside the rendered Full Lesson
  // Content and auto-scroll to the first match. Runs on every open (not
  // just the first fetch) because DialogContent unmounts on close, which
  // discards any DOM marks applied during a prior open.
  //
  // A highlight may ONLY ever mark text the pattern actually matched --
  // there is no whole-snippet fallback. The stored context snippet often
  // spans a heading or unrelated adjacent narrative (it's a fixed-size
  // character window around the real match, not a semantic boundary), so
  // highlighting all of it mismarks innocent text as violating. Two
  // distinct failure states, surfaced with two distinct notices:
  //   - patternRetuned: the pattern associated with this code no longer
  //     matches anything in the stored snippet (e.g. AL02 dropping
  //     "right here") -- nothing is highlighted, by design.
  //   - missingHighlight: the term WAS re-derived from the stored
  //     snippet, but that exact text isn't found anywhere in the current
  //     rendered content -- the lesson itself may have changed since
  //     this violation was logged.
  useEffect(() => {
    if (!open || !lessonContent) return;
    const container = contentContainerRef.current;
    if (!container) return;

    const contexts = violation.violation_contexts || [];
    let firstMark: HTMLElement | null = null;
    let anyTextNotFound = false;
    let anyPatternRetuned = false;
    let anyProcessed = false;

    for (const ctx of contexts) {
      const patternDef = VIOLATION_PATTERNS.find(p => p.id === ctx.term);
      for (const rawSample of ctx.samples || []) {
        const sample = rawSample.trim();
        if (!sample) continue;
        anyProcessed = true;

        const needle = resolveMatchedTerm(ctx, sample, patternDef);
        if (!needle) {
          anyPatternRetuned = true;
          continue;
        }

        const mark = highlightNeedleInContainer(container, needle);
        if (mark) {
          if (!firstMark) firstMark = mark;
        } else {
          anyTextNotFound = true;
        }
      }
    }

    setMissingHighlight(anyProcessed && anyTextNotFound);
    setPatternRetuned(anyProcessed && anyPatternRetuned);

    if (firstMark) {
      // Scope the scroll to this one container -- never scrollIntoView,
      // which can also move ancestor scrollables (the dialog, the page).
      const containerRect = container.getBoundingClientRect();
      const markRect = firstMark.getBoundingClientRect();
      container.scrollTop += (markRect.top - containerRect.top) - 20;
    }
  }, [open, lessonContent, violation.violation_contexts]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`View details for ${violation.lesson_title}`}
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Violation Details</DialogTitle>
          <DialogDescription>{violation.lesson_title} {UI_SYMBOLS.BULLET} {violation.theology_profile_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Date:</span><span className="ml-2">{formatDate(violation.created_at)}</span></div>
            <div><span className="text-muted-foreground">Age Group:</span><span className="ml-2">{violation.age_group}</span></div>
            {violation.bible_passage && (
              <div className="col-span-1 sm:col-span-2"><span className="text-muted-foreground">Passage:</span><span className="ml-2">{violation.bible_passage}</span></div>
            )}
          </div>

          <div className="border-t pt-4">
            <h5 className="font-medium mb-2">User Context</h5>
            {loadingContext ? (
              <p className="text-sm text-muted-foreground">Loading user context...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm bg-muted/30 rounded-lg p-3">
                <div><span className="text-muted-foreground">Name:</span><span className="ml-2">{formatEmpty(context?.full_name)}</span></div>
                <div><span className="text-muted-foreground">Email:</span><span className="ml-2">{formatEmpty(context?.email)}</span></div>
                <div><span className="text-muted-foreground">Tier:</span><span className="ml-2">{formatEmpty(context?.subscription_tier)}</span></div>
                <div><span className="text-muted-foreground">Theology Profile:</span><span className="ml-2">{formatEmpty(context?.theology_profile_id)}</span></div>
                <div className="col-span-1 sm:col-span-2"><span className="text-muted-foreground">Organization:</span><span className="ml-2">{formatEmpty(context?.organization_name)}</span></div>
              </div>
            )}
          </div>

          <div>
            <h5 className="font-medium mb-2">Violated Terms ({violation.violation_count} occurrences)</h5>
            <div className="space-y-3">
              {violation.violation_contexts?.map((ctx, i) => {
                const meta = getViolationPatternMeta(ctx.term);
                const patternDef = VIOLATION_PATTERNS.find(p => p.id === ctx.term);
                return (
                  <div key={i} className="bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="destructive">{meta.description} ({meta.code})</Badge>
                      <span className="text-sm text-muted-foreground">({ctx.occurrences}x)</span>
                    </div>
                    <div className="space-y-1">
                      {ctx.samples?.map((rawSample, j) => {
                        const sample = rawSample.trim();
                        const term = resolveMatchedTerm(ctx, sample, patternDef);
                        const idx = term ? sample.indexOf(term) : -1;
                        return (
                          <p key={j} className="text-sm text-muted-foreground bg-background p-2 rounded break-words">
                            {term && idx !== -1 ? (
                              <>
                                {sample.slice(0, idx)}
                                <mark className="bg-red-200 px-1 rounded font-bold">{sample.slice(idx, idx + term.length)}</mark>
                                {sample.slice(idx + term.length)}
                              </>
                            ) : (
                              sample
                            )}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <h5 className="font-medium mb-2">Full Lesson Content</h5>
            {patternRetuned && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2" aria-live="polite">
                {GUARDRAIL_PATTERN_RETUNED_NOTICE}
              </p>
            )}
            {missingHighlight && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2" aria-live="polite">
                {GUARDRAIL_TEXT_NOT_FOUND_NOTICE}
              </p>
            )}
            {loadingContext ? (
              <p className="text-sm text-muted-foreground">Loading lesson content...</p>
            ) : lessonContent ? (
              <div
                ref={contentContainerRef}
                className={LESSON_CONTENT_CONTAINER_CLASSES}
                style={LESSON_CONTENT_CONTAINER_STYLES}
                dangerouslySetInnerHTML={{ __html: formatLessonContentToHtml(lessonContent) }}
              />
            ) : (
              <p className="text-muted-foreground italic text-sm">No lesson content available.</p>
            )}
          </div>

          {!violation.was_reviewed && (
            <div className="border-t pt-4">
              <h5 className="font-medium mb-2">Mark as Reviewed</h5>
              <p className="text-xs text-muted-foreground mb-2">
                Select a preset disposition to fill the notes field below, or write your own. Selecting a preset replaces the current notes text -- it does not submit.
              </p>
              <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Preset review dispositions">
                {REVIEW_DISPOSITIONS.map((disposition) => {
                  const isSelected = selectedDisposition === disposition.id;
                  return (
                    <Button
                      key={disposition.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="text-xs"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setReviewNotes(disposition.note);
                        setSelectedDisposition(disposition.id);
                      }}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1" aria-hidden="true" />}
                      {disposition.label}
                    </Button>
                  );
                })}
              </div>
              <Textarea placeholder="Optional review notes..." value={reviewNotes} onChange={(e) => { setReviewNotes(e.target.value); setSelectedDisposition(null); }} className="mb-3" />
              <Button onClick={() => onMarkReviewed(violation)} disabled={marking}>
                {marking ? "Saving..." : "Mark as Reviewed"}
              </Button>
            </div>
          )}
          {violation.was_reviewed && violation.review_notes && (
            <div className="border-t pt-4">
              <h5 className="font-medium mb-2">Review Notes</h5>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">{violation.review_notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
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
                <h4 className="font-medium mb-3">{GUARDRAIL_SUMMARY_HEADING}</h4>
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
                        {s.total_violations} violation{s.total_violations !== 1 ? 's' : ''} {UI_SYMBOLS.BULLET} {s.total_terms_violated} term{s.total_terms_violated !== 1 ? 's' : ''}
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
                              {v.violated_terms.slice(0, 2).map((term, i) => {
                                const meta = getViolationPatternMeta(term);
                                return (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {meta.description} ({meta.code})
                                  </Badge>
                                );
                              })}
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
                            <ViolationDetailDialog
                              violation={v}
                              reviewNotes={reviewNotes}
                              setReviewNotes={setReviewNotes}
                              marking={marking}
                              onMarkReviewed={handleMarkReviewed}
                              formatDate={formatDate}
                            />
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
