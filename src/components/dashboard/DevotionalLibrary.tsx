/**
 * DevotionalLibrary Component
 *
 * Displays and manages user's generated devotionals with series grouping.
 *
 * SSOT Compliance:
 * - DEVOTIONAL_TARGETS from @/constants/devotionalConfig
 * - DEVOTIONAL_LENGTHS from @/constants/devotionalConfig
 * - DEVOTIONAL_SERIES_UI, DEVOTIONAL_SERIES_LIMITS from @/constants/devotionalSeriesConfig
 *
 * Features:
 * - Devotional series grouping (create, assign, reorder, pin, delete)
 * - Series cards with expand/collapse
 * - Card grid display for ungrouped devotionals
 * - Filter by target audience (age group)
 * - Search by scripture or title
 * - View full content in modal
 * - Copy to clipboard
 * - Delete devotional
 * - Link to source lesson (opens in modal)
 *
 * Phase C5: March 2026 -- Devotional Series grouping (storage & browsing only)
 *
 * @version 2.0.0
 * @lastUpdated 2026-03-28
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Eye,
  Trash2,
  Search,
  BookOpen,
  Users,
  Clock,
  Copy,
  CheckCircle,
  Heart,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Pin,
  FolderPlus,
  X,
} from "lucide-react";
import { useDevotionals, Devotional } from "@/hooks/useDevotionals";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  getDevotionalTarget,
  getDevotionalLength,
  getDevotionalTargetOptions,
} from "@/constants/devotionalConfig";
import { normalizeLegacyContent } from "@/utils/formatLessonContent";
import {
  DEVOTIONAL_SERIES_UI as UI,
  DEVOTIONAL_SERIES_LIMITS as LIMITS,
} from "@/constants/devotionalSeriesConfig";

// ============================================================================
// TYPES
// ============================================================================

interface DevotionalSeries {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  pin_order: number | null;
  created_at: string;
  updated_at: string;
}

interface SeriesDevotional {
  id: string;
  title: string | null;
  series_devotional_number: number;
}

// ============================================================================
// BADGE COLORS
// ============================================================================

const TARGET_BADGE_COLORS: Record<string, string> = {
  preschool: "bg-pink-100 text-pink-800 border-pink-200",
  children: "bg-blue-100 text-blue-800 border-accent/50",
  youth: "bg-purple-100 text-purple-800 border-purple-200",
  adult: "bg-primary/10 text-green-800 border-primary/30",
};

const LENGTH_BADGE_COLORS: Record<string, string> = {
  short: "bg-cyan-100 text-cyan-800 border-cyan-200",
  medium: "bg-indigo-100 text-indigo-800 border-indigo-200",
  long: "bg-violet-100 text-violet-800 border-violet-200",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DevotionalLibrary() {
  const { toast } = useToast();
  const { devotionals, loading, deleteDevotional, refetch } = useDevotionals();

  // Search & filter
  const [searchTerm, setSearchTerm] = useState("");
  const [targetFilter, setTargetFilter] = useState<string>("all");

  // View devotional modal
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [sourceLesson, setSourceLesson] = useState<any>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [copied, setCopied] = useState(false);

  // Series state
  const [series, setSeries] = useState<DevotionalSeries[]>([]);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [seriesDevotionals, setSeriesDevotionals] = useState<SeriesDevotional[]>([]);
  const [seriesDevotionalsLoading, setSeriesDevotionalsLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [devotionalCounts, setDevotionalCounts] = useState<Record<string, number>>({});

  // Create series modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSeriesName, setNewSeriesName] = useState("");
  const [newSeriesDescription, setNewSeriesDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // Add to series modal
  const [addToSeriesDevotionalId, setAddToSeriesDevotionalId] = useState<string | null>(null);

  const targetOptions = getDevotionalTargetOptions();

  // ============================================================================
  // FETCH SERIES
  // ============================================================================

  const fetchSeries = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setSeries([]); setSeriesLoading(false); return; }

      const { data, error } = await supabase
        .from("devotional_series")
        .select("*")
        .eq("user_id", session.user.id)
        .order("pin_order", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      // Sort: pinned first (by pin_order ASC), then unpinned by created_at DESC
      const sorted = (data || []).sort((a: DevotionalSeries, b: DevotionalSeries) => {
        if (a.pin_order != null && b.pin_order != null) return a.pin_order - b.pin_order;
        if (a.pin_order != null) return -1;
        if (b.pin_order != null) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setSeries(sorted);
    } catch (err) {
      console.error("Error fetching devotional series:", err);
    } finally {
      setSeriesLoading(false);
    }
  };

  useEffect(() => { fetchSeries(); }, []);

  // Batch fetch devotional counts per series
  useEffect(() => {
    if (series.length === 0) return;
    const fetchCounts = async () => {
      const seriesIds = series.map(s => s.id);
      const { data, error } = await supabase
        .from("devotionals")
        .select("series_id")
        .in("series_id", seriesIds);
      if (error || !data) return;
      const counts: Record<string, number> = {};
      for (const row of data) {
        if (row.series_id) {
          counts[row.series_id] = (counts[row.series_id] || 0) + 1;
        }
      }
      setDevotionalCounts(counts);
    };
    fetchCounts();
  }, [series]);

  // ============================================================================
  // SERIES DEVOTIONALS (expand/collapse)
  // ============================================================================

  const fetchSeriesDevotionals = async (seriesId: string) => {
    setSeriesDevotionalsLoading(true);
    try {
      const { data, error } = await supabase
        .from("devotionals")
        .select("id, title, series_devotional_number")
        .eq("series_id", seriesId)
        .order("series_devotional_number", { ascending: true });
      if (error) { setSeriesDevotionals([]); return; }
      setSeriesDevotionals((data || []) as SeriesDevotional[]);
    } catch {
      setSeriesDevotionals([]);
    } finally {
      setSeriesDevotionalsLoading(false);
    }
  };

  const handleToggleExpand = (seriesId: string) => {
    if (expandedSeriesId === seriesId) {
      setExpandedSeriesId(null);
      setSeriesDevotionals([]);
    } else {
      setExpandedSeriesId(seriesId);
      fetchSeriesDevotionals(seriesId);
    }
  };

  // ============================================================================
  // CREATE SERIES
  // ============================================================================

  const handleCreateSeries = async () => {
    const trimmedName = newSeriesName.trim();
    if (!trimmedName) {
      toast({ title: "Error", description: UI.nameRequired, variant: "destructive" });
      return;
    }
    if (trimmedName.length > LIMITS.maxSeriesNameLength) {
      toast({ title: "Error", description: UI.nameTooLong(LIMITS.maxSeriesNameLength), variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("devotional_series")
        .insert({
          user_id: session.user.id,
          name: trimmedName,
          description: newSeriesDescription.trim() || null,
        });

      if (error) throw error;

      toast({ title: "Created", description: UI.seriesCreated });
      setShowCreateModal(false);
      setNewSeriesName("");
      setNewSeriesDescription("");
      fetchSeries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create series.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  // ============================================================================
  // ADD TO SERIES
  // ============================================================================

  const handleAddToSeries = async (devotionalId: string, seriesId: string) => {
    try {
      // Get next devotional number
      const { data: existing } = await supabase
        .from("devotionals")
        .select("series_devotional_number")
        .eq("series_id", seriesId)
        .order("series_devotional_number", { ascending: false })
        .limit(1);

      const nextNumber = (existing && existing.length > 0 && existing[0].series_devotional_number != null)
        ? existing[0].series_devotional_number + 1
        : 1;

      const { error } = await supabase
        .from("devotionals")
        .update({ series_id: seriesId, series_devotional_number: nextNumber })
        .eq("id", devotionalId);

      if (error) throw error;

      toast({ title: "Added", description: UI.addedToSeries });
      setAddToSeriesDevotionalId(null);
      refetch();
      fetchSeries();
      if (expandedSeriesId === seriesId) fetchSeriesDevotionals(seriesId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add to series.", variant: "destructive" });
    }
  };

  // ============================================================================
  // REMOVE FROM SERIES
  // ============================================================================

  const handleRemoveFromSeries = async (devotionalId: string) => {
    if (!window.confirm(UI.removeFromSeriesConfirm)) return;

    try {
      const { error } = await supabase
        .from("devotionals")
        .update({ series_id: null, series_devotional_number: null })
        .eq("id", devotionalId);

      if (error) throw error;

      toast({ title: "Removed", description: UI.removedFromSeries });
      refetch();
      fetchSeries();
      if (expandedSeriesId) fetchSeriesDevotionals(expandedSeriesId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to remove from series.", variant: "destructive" });
    }
  };

  // ============================================================================
  // REORDER WITHIN SERIES
  // ============================================================================

  const handleReorder = async (devIndex: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? devIndex - 1 : devIndex + 1;
    if (swapIndex < 0 || swapIndex >= seriesDevotionals.length) return;

    setReordering(true);
    try {
      const devA = seriesDevotionals[devIndex];
      const devB = seriesDevotionals[swapIndex];

      const [errA] = await Promise.all([
        supabase.from("devotionals").update({ series_devotional_number: devB.series_devotional_number }).eq("id", devA.id),
        supabase.from("devotionals").update({ series_devotional_number: devA.series_devotional_number }).eq("id", devB.id),
      ]).then(results => results.map(r => r.error));

      if (errA) {
        toast({ title: "Error", description: UI.reorderFailed, variant: "destructive" });
        return;
      }

      const updated = [...seriesDevotionals];
      const tempNum = updated[devIndex].series_devotional_number;
      updated[devIndex].series_devotional_number = updated[swapIndex].series_devotional_number;
      updated[swapIndex].series_devotional_number = tempNum;
      updated.sort((a, b) => a.series_devotional_number - b.series_devotional_number);
      setSeriesDevotionals(updated);
    } catch {
      toast({ title: "Error", description: UI.reorderFailed, variant: "destructive" });
    } finally {
      setReordering(false);
    }
  };

  // ============================================================================
  // PIN / UNPIN SERIES
  // ============================================================================

  const handleTogglePin = async (seriesId: string, currentPinOrder: number | null) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const userId = session.user.id;

      if (currentPinOrder === 1) {
        // Unpin
        await supabase.from("devotional_series").update({ pin_order: null }).eq("id", seriesId).eq("user_id", userId);

        const { data: remaining } = await supabase
          .from("devotional_series")
          .select("id, pin_order")
          .eq("user_id", userId)
          .not("pin_order", "is", null)
          .order("pin_order", { ascending: true });

        if (remaining) {
          for (let i = 0; i < remaining.length; i++) {
            await supabase.from("devotional_series").update({ pin_order: i + 1 }).eq("id", remaining[i].id).eq("user_id", userId);
          }
        }
      } else {
        // Pin to position 1
        const { data: pinned } = await supabase
          .from("devotional_series")
          .select("id, pin_order")
          .eq("user_id", userId)
          .not("pin_order", "is", null)
          .neq("id", seriesId)
          .order("pin_order", { ascending: true });

        if (pinned) {
          for (let i = 0; i < pinned.length; i++) {
            await supabase.from("devotional_series").update({ pin_order: i + 2 }).eq("id", pinned[i].id).eq("user_id", userId);
          }
        }

        await supabase.from("devotional_series").update({ pin_order: 1 }).eq("id", seriesId).eq("user_id", userId);
      }

      fetchSeries();
    } catch {
      toast({ title: "Error", description: UI.pinFailed, variant: "destructive" });
    }
  };

  // ============================================================================
  // DELETE SERIES
  // ============================================================================

  const handleDeleteSeries = async (seriesId: string) => {
    if (!window.confirm(UI.deleteSeriesConfirm)) return;

    try {
      const { error } = await supabase
        .from("devotional_series")
        .delete()
        .eq("id", seriesId);

      if (error) throw error;

      toast({ title: "Deleted", description: UI.seriesDeleted });
      if (expandedSeriesId === seriesId) {
        setExpandedSeriesId(null);
        setSeriesDevotionals([]);
      }
      refetch();
      fetchSeries();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete series.", variant: "destructive" });
    }
  };

  // ============================================================================
  // EXISTING HANDLERS
  // ============================================================================

  const filteredDevotionals = devotionals.filter((devotional) => {
    const matchesSearch =
      !searchTerm ||
      devotional.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devotional.bible_passage?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTarget = targetFilter === "all" || devotional.target_id === targetFilter;
    return matchesSearch && matchesTarget;
  });

  // Split into ungrouped only
  const ungroupedDevotionals = filteredDevotionals.filter(d => !d.series_id);

  const handleView = (devotional: Devotional) => {
    setSelectedDevotional(devotional);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this devotional? This action cannot be undone.")) {
      await deleteDevotional(id);
    }
  };

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ title: "Copied", description: "Devotional copied to clipboard." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy Failed", description: "Could not copy to clipboard.", variant: "destructive" });
    }
  };

  const handleViewSourceLesson = async (lessonId: string) => {
    setLoadingSource(true);
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", lessonId)
        .single();
      if (error) throw error;
      setSourceLesson(data);
    } catch {
      toast({ title: "Error", description: "Could not load source lesson.", variant: "destructive" });
    } finally {
      setLoadingSource(false);
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getTargetLabel = (targetId: string): string => {
    const target = getDevotionalTarget(targetId);
    return target ? target.label : targetId;
  };

  const getLengthLabel = (lengthId: string): string => {
    const length = getDevotionalLength(lengthId);
    return length ? length.label : lengthId;
  };

  // ============================================================================
  // RENDER: DEVOTIONAL CARD (reusable for ungrouped devotionals)
  // ============================================================================

  const renderDevotionalCard = (devotional: Devotional, showAddToSeries: boolean) => (
    <Card key={devotional.id} className="group hover:shadow-glow transition-all duration-normal bg-gradient-card">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {devotional.title || "Untitled Devotional"}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm line-clamp-1">
              {devotional.bible_passage}
            </CardDescription>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
          <Badge className={`${TARGET_BADGE_COLORS[devotional.target_id] || "bg-gray-100 text-gray-800"} dark:bg-[#3d5a3d] dark:text-[#e8f0e8] dark:border-[#4d6a4d] text-xs`} variant="secondary">
            <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            {getTargetLabel(devotional.target_id)}
          </Badge>
          <Badge className={`${LENGTH_BADGE_COLORS[devotional.length_id] || "bg-gray-100 text-gray-800"} dark:bg-[#3d5a3d] dark:text-[#e8f0e8] dark:border-[#4d6a4d] text-xs`} variant="secondary">
            <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            {getLengthLabel(devotional.length_id)}
          </Badge>
          {devotional.series_id && (
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-[#4d4a3d] dark:text-[#f0ece8] dark:border-[#6a654d] text-xs" variant="secondary">
              <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
              In Series
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {formatDate(devotional.created_at)}
          </span>
          {devotional.word_count && <span>{devotional.word_count} words</span>}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleView(devotional)} className="flex-1" size="sm">
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View
          </Button>
          <Button onClick={() => handleCopy(devotional.content || "")} variant="outline" size="sm" title="Copy to clipboard">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {showAddToSeries && series.length > 0 && (
            <Button onClick={() => setAddToSeriesDevotionalId(devotional.id)} variant="outline" size="sm" title={UI.addToSeriesButton}>
              <FolderPlus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button onClick={() => handleDelete(devotional.id)} variant="outline" size="sm" className="hover:bg-destructive hover:text-destructive-foreground" title="Delete devotional">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {devotional.source_lesson_id && (
          <Button
            onClick={() => handleViewSourceLesson(devotional.source_lesson_id!)}
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs text-muted-foreground hover:text-primary"
            disabled={loadingSource}
          >
            {loadingSource ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ExternalLink className="h-3 w-3 mr-1" />}
            View Source Lesson
          </Button>
        )}
      </CardContent>
    </Card>
  );

  // ============================================================================
  // RENDER: LOADING
  // ============================================================================

  if (loading || seriesLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                {UI.pageTitle}
              </CardTitle>
              <CardDescription>{UI.pageDescription}</CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              {UI.newSeriesButton}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title or passage..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={targetFilter} onValueChange={setTargetFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Age Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                {targetOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Series Cards */}
      {series.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{UI.seriesSectionTitle}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {series.map((s) => {
              const isExpanded = expandedSeriesId === s.id;
              const count = isExpanded ? seriesDevotionals.length : (devotionalCounts[s.id] ?? 0);

              return (
                <Card key={s.id} className="group hover:shadow-glow transition-all duration-normal bg-gradient-card">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base sm:text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {s.name}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          {UI.devotionalCount(count)}
                        </CardDescription>
                      </div>
                      <button
                        onClick={() => handleTogglePin(s.id, s.pin_order)}
                        className={`shrink-0 cursor-pointer transition-colors ${
                          s.pin_order != null
                            ? "text-yellow-400 hover:text-yellow-500"
                            : "text-muted-foreground hover:text-yellow-400"
                        }`}
                        title={s.pin_order != null ? (s.pin_order === 1 ? UI.unpinSeries : UI.moveToTopPin) : UI.pinToTop}
                      >
                        <Pin className={`h-4 w-4 ${s.pin_order != null ? "fill-yellow-400" : ""}`} />
                      </button>
                    </div>

                    {s.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{s.description}</p>
                    )}
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6 pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        Created {formatDate(s.created_at)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleExpand(s.id)}
                        className="gap-1"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        {UI.expandButton}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSeries(s.id)}
                        className="hover:bg-destructive hover:text-destructive-foreground"
                        title={UI.deleteSeriesButton}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Expanded devotional list with reorder controls */}
                    {isExpanded && (
                      <div className="mt-4 border-t pt-3 space-y-1">
                        {seriesDevotionalsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                          </div>
                        ) : seriesDevotionals.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-3">{UI.noDevotionalsInSeries}</p>
                        ) : (
                          seriesDevotionals.map((dev, index) => (
                            <div
                              key={dev.id}
                              className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted transition-colors"
                            >
                              <span className="text-xs font-medium text-muted-foreground w-5 text-center shrink-0">
                                {dev.series_devotional_number}
                              </span>
                              <span
                                className="text-sm line-clamp-2 flex-1 min-w-0 cursor-pointer hover:text-primary"
                                onClick={() => {
                                  const fullDev = devotionals.find(d => d.id === dev.id);
                                  if (fullDev) handleView(fullDev);
                                }}
                              >
                                {dev.title || "Untitled Devotional"}
                              </span>
                              <div className="flex gap-0.5 shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  disabled={index === 0 || reordering}
                                  onClick={() => handleReorder(index, "up")}
                                  title={UI.moveUpTitle}
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  disabled={index === seriesDevotionals.length - 1 || reordering}
                                  onClick={() => handleReorder(index, "down")}
                                  title={UI.moveDownTitle}
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleRemoveFromSeries(dev.id)}
                                  title={UI.removeFromSeries}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Ungrouped Devotionals */}
      {ungroupedDevotionals.length > 0 && (
        <div className="space-y-4">
          {series.length > 0 && (
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{UI.ungroupedHeading}</h3>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {ungroupedDevotionals.map((devotional) => renderDevotionalCard(devotional, true))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {series.length === 0 && ungroupedDevotionals.length === 0 && (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">
                {searchTerm || targetFilter !== "all" ? UI.noFilterResults : UI.noDevotionals}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchTerm || targetFilter !== "all"
                  ? UI.noFilterResultsDescription
                  : UI.noDevotionalsDescription}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Series Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{UI.createModalTitle}</DialogTitle>
            <DialogDescription>{UI.createModalDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{UI.seriesNameLabel}</label>
              <Input
                value={newSeriesName}
                onChange={(e) => setNewSeriesName(e.target.value)}
                placeholder={UI.seriesNamePlaceholder}
                maxLength={LIMITS.maxSeriesNameLength}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">{UI.seriesDescriptionLabel}</label>
              <Input
                value={newSeriesDescription}
                onChange={(e) => setNewSeriesDescription(e.target.value)}
                placeholder={UI.seriesDescriptionPlaceholder}
                maxLength={LIMITS.maxDescriptionLength}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{UI.cancelButton}</Button>
            <Button onClick={handleCreateSeries} disabled={creating || !newSeriesName.trim()}>
              {creating ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
              {UI.createButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Series Modal */}
      <Dialog open={!!addToSeriesDevotionalId} onOpenChange={() => setAddToSeriesDevotionalId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{UI.addToSeriesTitle}</DialogTitle>
            <DialogDescription>{UI.addToSeriesDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {series.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{UI.noSeriesAvailable}</p>
            ) : (
              series.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => addToSeriesDevotionalId && handleAddToSeries(addToSeriesDevotionalId, s.id)}
                >
                  <FolderPlus className="h-4 w-4 shrink-0" />
                  <span className="truncate">{s.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {devotionalCounts[s.id] ?? 0}
                  </span>
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Devotional Modal */}
      <Dialog open={!!selectedDevotional} onOpenChange={() => setSelectedDevotional(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedDevotional && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedDevotional.title || "Untitled Devotional"}</DialogTitle>
                <DialogDescription>{selectedDevotional.bible_passage} - {selectedDevotional.word_count} words</DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 py-2">
                <Button variant="outline" size="sm" onClick={() => handleCopy(selectedDevotional.content || "")}>
                  {copied ? <CheckCircle className="h-4 w-4 mr-1.5 text-primary" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setSelectedDevotional(null)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" />
                  Back to Library
                </Button>
              </div>
              <div className="prose prose-sm max-w-none">
                {(() => {
                  const content = normalizeLegacyContent(selectedDevotional.content || "");
                  return content.split("\n").map((line, index) => {
                    if (line.startsWith("## ")) {
                      return <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-primary">{line.replace("## ", "")}</h3>;
                    }
                    if (line.match(/^\*\*[^*]+:\*\*/)) {
                      const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                      return <p key={index} className="mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                    }
                    if (line.includes("**")) {
                      const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                      return <p key={index} className="mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                    }
                    if (!line.trim()) return <div key={index} className="h-3" />;
                    return <p key={index} className="mb-3 leading-relaxed">{line}</p>;
                  });
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Source Lesson Modal */}
      <Dialog open={!!sourceLesson} onOpenChange={() => setSourceLesson(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {sourceLesson && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{sourceLesson.ai_lesson_title || sourceLesson.title || "Source Lesson"}</DialogTitle>
                <DialogDescription>{sourceLesson.filters?.bible_passage || sourceLesson.filters?.focused_topic}</DialogDescription>
              </DialogHeader>
              <div className="prose prose-sm max-w-none mt-4">
                {(() => {
                  const content = normalizeLegacyContent(sourceLesson.original_text || "");
                  return content.split("\n").map((line: string, index: number) => {
                    if (line.startsWith("## ")) {
                      return <h2 key={index} className="text-lg font-bold mt-6 mb-3 text-primary">{line.replace("## ", "")}</h2>;
                    }
                    if (line.includes("**")) {
                      const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                      return <p key={index} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                    }
                    if (!line.trim()) return <div key={index} className="h-2" />;
                    return <p key={index} className="mb-2 leading-relaxed">{line}</p>;
                  });
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
