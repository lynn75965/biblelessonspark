/**
 * DevotionalLibrary Component
 *
 * Displays and manages user's generated devotionals.
 *
 * SSOT Compliance:
 * - DEVOTIONAL_TARGETS from @/constants/devotionalConfig
 * - DEVOTIONAL_LENGTHS from @/constants/devotionalConfig
 *
 * Features:
 * - Card grid display
 * - Filter by target audience (age group)
 * - Search by scripture or title
 * - View full content in modal
 * - Copy to clipboard
 * - Print devotional
 * - Delete devotional
 * - Link to source lesson (opens in modal)
 *
 * @version 1.2.0
 * @lastUpdated 2025-12-30
 */

import { useState } from "react";
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
} from "@/components/ui/dialog";
import {
  Eye,
  Trash2,
  Search,
  BookOpen,
  Users,
  Clock,
  Copy,
  Printer,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Loader2,
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

export function DevotionalLibrary() {
  const { toast } = useToast();
  const { devotionals, loading, deleteDevotional } = useDevotionals();

  const [searchTerm, setSearchTerm] = useState("");
  const [targetFilter, setTargetFilter] = useState<string>("all");
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null);
  const [sourceLesson, setSourceLesson] = useState<any>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [copied, setCopied] = useState(false);

  const targetOptions = getDevotionalTargetOptions();

  const filteredDevotionals = devotionals.filter((devotional) => {
    const matchesSearch =
      !searchTerm ||
      devotional.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      devotional.bible_passage?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTarget = targetFilter === "all" || devotional.target_id === targetFilter;
    return matchesSearch && matchesTarget;
  });

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
    } catch (error) {
      toast({ title: "Copy Failed", description: "Could not copy to clipboard.", variant: "destructive" });
    }
  };

  const handlePrint = (devotional: Devotional) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const targetLabel = getTargetLabel(devotional.target_id);
      // Normalize content and convert markdown to HTML
      const normalizedContent = normalizeLegacyContent(devotional.content || "");
      const formattedContent = normalizedContent
        .replace(/## (.*?)(?=\n|$)/g, '<h2>$1</h2>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${devotional.title || "Devotional"}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.6; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            .meta { color: #666; font-style: italic; margin-bottom: 24px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; color: #333; }
            p { margin-bottom: 12px; }
            strong { font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${devotional.title || "Devotional"}</h1>
          <p class="meta">${devotional.bible_passage} | ${targetLabel}</p>
          <p>${formattedContent}</p>
          <div class="footer">Generated by DevotionalSpark | biblelessonspark.com</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
    } catch (error) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            My Devotionals
          </CardTitle>
          <CardDescription>Browse and manage your generated devotionals</CardDescription>
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

      {filteredDevotionals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredDevotionals.map((devotional) => (
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
                  <Badge className={`${TARGET_BADGE_COLORS[devotional.target_id] || "bg-gray-100 text-gray-800"} text-xs`} variant="secondary">
                    <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    {getTargetLabel(devotional.target_id)}
                  </Badge>
                  <Badge className={`${LENGTH_BADGE_COLORS[devotional.length_id] || "bg-gray-100 text-gray-800"} text-xs`} variant="secondary">
                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                    {getLengthLabel(devotional.length_id)}
                  </Badge>
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
                  <Button onClick={() => handlePrint(devotional)} variant="outline" size="sm" title="Print devotional">
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
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
          ))}
        </div>
      ) : (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">
                {searchTerm || targetFilter !== "all" ? "No devotionals match your filters" : "No devotionals yet"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchTerm || targetFilter !== "all"
                  ? "Try adjusting your search terms or filters."
                  : "Generate your first devotional from a lesson in your Lesson Library."}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Devotional Modal */}
      <Dialog open={!!selectedDevotional} onOpenChange={() => setSelectedDevotional(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedDevotional && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedDevotional.title || "Untitled Devotional"}</DialogTitle>
                <DialogDescription>{selectedDevotional.bible_passage} - {selectedDevotional.word_count} words</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 py-2">
                <Button variant="outline" size="sm" onClick={() => handleCopy(selectedDevotional.content || "")}>
                  {copied ? <CheckCircle className="h-4 w-4 mr-1.5 text-primary" /> : <Copy className="h-4 w-4 mr-1.5" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handlePrint(selectedDevotional)}>
                  <Printer className="h-4 w-4 mr-1.5" />
                  Print
                </Button>
              </div>
              <div className="prose prose-sm max-w-none">
                {(() => {
                  const content = normalizeLegacyContent(selectedDevotional.content || "");
                  return content.split("\n").map((line, index) => {
                    // Handle ## headers
                    if (line.startsWith("## ")) {
                      return <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-primary">{line.replace("## ", "")}</h3>;
                    }
                    // Handle **Label:** format - render bold label with content
                    if (line.match(/^\*\*[^*]+:\*\*/)) {
                      const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                      return <p key={index} className="mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                    }
                    // Handle remaining **bold** text
                    if (line.includes("**")) {
                      const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                      return <p key={index} className="mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                    }
                    // Empty line
                    if (!line.trim()) return <div key={index} className="h-3" />;
                    // Plain text
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
                    // Handle ## headers
                    if (line.startsWith("## ")) {
                      return <h2 key={index} className="text-lg font-bold mt-6 mb-3 text-primary">{line.replace("## ", "")}</h2>;
                    }
                    // Handle **Label:** format and other bold text
                    if (line.includes("**")) {
                      const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                      return <p key={index} className="mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />;
                    }
                    // Empty line
                    if (!line.trim()) return <div key={index} className="h-2" />;
                    // Plain text
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
