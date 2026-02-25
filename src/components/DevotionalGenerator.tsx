/**
 * DevotionalGenerator Component
 * 
 * Generates personal devotionals anchored to lessons.
 * 
 * SSOT Compliance:
 * - DEVOTIONAL_TARGETS from @/constants/devotionalConfig
 * - DEVOTIONAL_LENGTHS from @/constants/devotionalConfig
 * - mapAgeGroupToTarget() for default Target selection
 * - Usage limit enforced via check_devotional_limit RPC
 * 
 * User Flow:
 * 1. Arrives from LessonLibrary with lesson params in URL
 * 2. Sees inherited passage AND/OR theme (read-only)
 * 3. Selects Target (Preschool, Children, Youth, Adult)
 * 4. Selects Length (3 min, 5 min, 10 min)
 * 5. Clicks Generate
 * 6. Views generated devotional with copy/print options
 * 
 * Supports:
 * - Passage-based lessons (bible_passage)
 * - Theme/focus-based lessons (focused_topic)
 * - Combined passage + theme lessons
 * 
 * @version 1.3.0
 * @lastUpdated 2025-12-30
 */

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowLeft, Copy, Printer, BookOpen, Clock, Users, CheckCircle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  getDevotionalTargetOptions,
  getDevotionalLengthOptions,
  getDefaultDevotionalTarget,
  getDefaultDevotionalLength,
  mapAgeGroupToTarget,
} from "@/constants/devotionalConfig";
import { UI_SYMBOLS } from "@/constants/uiSymbols";
import { normalizeLegacyContent } from "@/utils/formatLessonContent";
import { ROUTES } from "@/constants/routes";
import { DEFAULT_THEOLOGY_PROFILE_ID } from "@/constants/theologyProfiles";
import { useSubscription } from "@/hooks/useSubscription";
import { hasFeatureAccess, getUpgradePrompt } from "@/constants/featureFlags";
import { useNavigate as useNavigateUpgrade } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Lock } from "lucide-react";

// ============================================================================
// INTERFACES
// ============================================================================

interface GeneratedDevotional {
  id: string;
  title: string;
  content: string;
  bible_passage: string;
  target_id: string;
  length_id: string;
  word_count: number;
  detected_valence: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DevotionalGenerator() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { tier, isFreeTier } = useSubscription();
  const navigateUpgrade = useNavigateUpgrade();
  const canUseDevotional = hasFeatureAccess(tier, 'devotional');

  // URL Parameters (inherited from lesson)
  const context = searchParams.get("context") || "standalone";
  const lessonId = searchParams.get("lessonId");
  const lessonTitle = searchParams.get("lessonTitle") || "";
  const passage = searchParams.get("passage") || "";
  const theme = searchParams.get("theme") || "";
  const theologyProfile = searchParams.get("theologyProfile") || DEFAULT_THEOLOGY_PROFILE_ID;
  const ageGroup = searchParams.get("ageGroup") || "";
  const bibleVersion = searchParams.get("bibleVersion") || "kjv";

  // User Selections
  const [targetId, setTargetId] = useState<string>("");
  const [lengthId, setLengthId] = useState<string>(getDefaultDevotionalLength().id);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [devotional, setDevotional] = useState<GeneratedDevotional | null>(null);
  const [copied, setCopied] = useState(false);

  // Usage State
  const [devotionalsUsed, setDevotionalsUsed] = useState(0);
  const [devotionalsLimit, setDevotionalsLimit] = useState(7);
  const [periodEnd, setPeriodEnd] = useState<Date | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [canGenerate, setCanGenerate] = useState(true);

  // Options from SSOT
  const targetOptions = getDevotionalTargetOptions();
  const lengthOptions = getDevotionalLengthOptions();

  // Determine if we have valid input
  const hasPassage = passage.trim().length > 0;
  const hasTheme = theme.trim().length > 0;
  const hasValidInput = hasPassage || hasTheme;

  // ============================================================================
  // PROGRESS TIMER - Rate based on devotional length
  // ============================================================================
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setProgress(0);
      
      // Calculate increment based on length to reach ~95% at estimated time
      // short (3 min): ~4 sec generation -> 95/4 = 24% per sec
      // medium (5 min): ~11 sec generation -> 95/11 = 8.6% per sec  
      // long (10 min): ~34 sec generation -> 95/34 = 2.8% per sec
      const incrementPerSecond = lengthId === 'short' ? 24 
        : lengthId === 'long' ? 2.8 
        : 8.6; // medium default
      
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 99) return 99;
          if (prev >= 95) return prev + 0.3;
          return Math.min(prev + incrementPerSecond, 95);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isGenerating, lengthId]);

  // Set default target based on lesson's age group
  useEffect(() => {
    if (ageGroup) {
      const mappedTarget = mapAgeGroupToTarget(ageGroup);
      setTargetId(mappedTarget.id);
    } else {
      setTargetId(getDefaultDevotionalTarget().id);
    }
  }, [ageGroup]);

  // Fetch usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      if (!user) {
        setUsageLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc("check_devotional_limit", {
          p_user_id: user.id,
        });

        if (error) {
          console.error("Error fetching devotional usage:", error);
          setUsageLoading(false);
          return;
        }

        const result = Array.isArray(data) ? data[0] : data;
        if (result) {
          setDevotionalsUsed(result.devotionals_used || 0);
          setDevotionalsLimit(result.devotionals_limit || 7);
          setCanGenerate(result.can_generate ?? true);
          if (result.period_end) {
            setPeriodEnd(new Date(result.period_end));
          }
        }
      } catch (err) {
        console.error("Usage fetch error:", err);
      } finally {
        setUsageLoading(false);
      }
    };

    fetchUsage();
  }, [user]);

  // Format reset date
  const formatResetDate = (date: Date | null) => {
    if (!date) {
      // Default to first of next month
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonth.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleGenerate = async () => {
    if (!hasValidInput) {
      toast({
        title: "Missing Content",
        description: "A Bible passage or theme is required to generate a devotional.",
        variant: "destructive",
      });
      return;
    }

    if (!canGenerate) {
      toast({
        title: "Monthly Limit Reached",
        description: `You've used all ${devotionalsLimit} devotionals this month. Resets ${formatResetDate(periodEnd)}.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setDevotional(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to generate devotionals.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      const response = await supabase.functions.invoke("generate-devotional", {
        body: {
          bible_passage: passage || null,
          focused_topic: theme || null,
          target_id: targetId,
          length_id: lengthId,
          theology_profile_id: theologyProfile,
          bible_version_id: bibleVersion,
          age_group_id: ageGroup,
          source_lesson_id: lessonId,
          lesson_title: lessonTitle,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Generation failed");
      }

      const result = response.data;

      if (!result.success) {
        if (result.code === "LIMIT_REACHED") {
          setDevotionalsUsed(result.devotionals_used);
          setDevotionalsLimit(result.devotionals_limit);
          setCanGenerate(false);
          toast({
            title: "Monthly Limit Reached",
            description: `You've used ${result.devotionals_used} of ${result.devotionals_limit} devotionals this month.`,
            variant: "destructive",
          });
        } else {
          throw new Error(result.error || "Generation failed");
        }
        setIsGenerating(false);
        return;
      }

      // Update usage count after successful generation
      setDevotionalsUsed(prev => prev + 1);
      if (devotionalsUsed + 1 >= devotionalsLimit) {
        setCanGenerate(false);
      }

      setProgress(100);
      setDevotional(result.devotional);
      toast({
        title: "Devotional Generated",
        description: "Your devotional is ready to view and share.",
      });

    } catch (error: any) {
      console.error("Devotional generation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!devotional) return;

    try {
      await navigator.clipboard.writeText(devotional.content);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Devotional copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    if (!devotional) return;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      // Normalize content and convert markdown to HTML
      const normalizedContent = normalizeLegacyContent(devotional.content);
      const formattedContent = normalizedContent
        .replace(/## (.*?)(?=\n|$)/g, '<h2>$1</h2>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${devotional.title}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.6; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            .passage { color: #666; font-style: italic; margin-bottom: 24px; }
            h2 { font-size: 18px; margin-top: 24px; margin-bottom: 12px; color: #333; }
            p { margin-bottom: 12px; }
            strong { font-weight: bold; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${devotional.title}</h1>
          <p class="passage">${devotional.bible_passage}</p>
          <p>${formattedContent}</p>
          <div class="footer">Generated by DevotionalSpark | biblelessonspark.com</div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleBack = () => {
    if (context === "teaching" && lessonId) {
      navigate(ROUTES.DASHBOARD);
    } else {
      navigate(-1);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-amber-500" />
            DevotionalSpark
          </h1>
          <p className="text-muted-foreground text-sm">
            Generate a personal devotional from your lesson
          </p>
        </div>
      </div>

      {/* Source Lesson Info */}
      {context === "teaching" && lessonTitle && (
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <BookOpen className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Based on Lesson</p>
                <p className="text-sm text-amber-700">{lessonTitle}</p>
                {passage && (
                  <p className="text-sm text-amber-600 mt-1">Scripture: {passage}</p>
                )}
                {theme && (
                  <p className="text-sm text-amber-600 mt-1">Theme: {theme}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Gate: Devotional requires Personal Plan */}
      {!canUseDevotional && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-8 flex flex-col items-center text-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Personal Plan Required</h3>
              <p className="text-sm text-amber-700 max-w-sm">
                {getUpgradePrompt(tier, 'devotional')}
              </p>
            </div>
            <button
              onClick={() => navigateUpgrade(ROUTES.PRICING)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              View Plans
            </button>
          </CardContent>
        </Card>
      )}

      {/* Generation Form */}
      {canUseDevotional && !devotional && (
        <Card>
          <CardHeader>
            <CardTitle>Customize Your Devotional</CardTitle>
            <CardDescription>
              Select who will read this devotional and how long it should be
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Scripture/Theme Display */}
            <div className="space-y-3">
              {hasPassage && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Scripture Passage
                  </Label>
                  <div className="mt-1.5 p-3 bg-muted rounded-md">
                    <p className="font-medium">{passage}</p>
                  </div>
                </div>
              )}
              
              {hasTheme && (
                <div>
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Theme / Focus
                  </Label>
                  <div className="mt-1.5 p-3 bg-muted rounded-md">
                    <p className="font-medium">{theme}</p>
                  </div>
                </div>
              )}

              {!hasValidInput && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md">
                  <p className="text-sm">No Scripture passage or theme found for this lesson.</p>
                </div>
              )}
            </div>

            {/* Target Selection */}
            <div>
              <Label htmlFor="target" className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Target Audience
              </Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger id="target" className="mt-1.5">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map((target) => (
                    <SelectItem key={target.id} value={target.id}>
                      <div>
                        <span className="font-medium">{target.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          - {target.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Length Selection */}
            <div>
              <Label htmlFor="length" className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Reading Length
              </Label>
              <Select value={lengthId} onValueChange={setLengthId}>
                <SelectTrigger id="length" className="mt-1.5">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {lengthOptions.map((length) => (
                    <SelectItem key={length.id} value={length.id}>
                      <div>
                        <span className="font-medium">{length.label}</span>
                        <span className="text-muted-foreground ml-2 text-sm">
                          - {length.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Usage Indicator */}
            <div
              className={`text-sm text-center p-2 rounded-lg ${
                !canGenerate ? "bg-destructive/10 text-destructive" : "bg-muted"
              }`}
            >
              {usageLoading ? (
                <span className="text-muted-foreground">Loading usage...</span>
              ) : !canGenerate ? (
                <span>
                  Limit reached - Resets {formatResetDate(periodEnd)}
                </span>
              ) : (
                <span>
                  {devotionalsUsed} of {devotionalsLimit} devotionals used this month - Resets {formatResetDate(periodEnd)}
                </span>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !hasValidInput || !canGenerate}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Generating Devotional... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Devotional
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Devotional Display */}
      {canUseDevotional && devotional && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{devotional.title}</CardTitle>
                <CardDescription className="mt-1">
                  {devotional.bible_passage} {UI_SYMBOLS.BULLET} {devotional.word_count} words
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <CheckCircle className="h-4 w-4 mr-1.5 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4 mr-1.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-1.5" />
                  Print
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Devotional Content */}
            <div className="prose prose-sm max-w-none">
              {(() => {
                const content = normalizeLegacyContent(devotional.content);
                return content.split("\n").map((line, index) => {
                  // Handle ## headers
                  if (line.startsWith("## ")) {
                    return (
                      <h3 key={index} className="text-lg font-semibold mt-6 mb-3 text-primary">
                        {line.replace("## ", "")}
                      </h3>
                    );
                  }
                  // Handle **Label:** format and other bold text
                  if (line.includes("**")) {
                    const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                    return (
                      <p key={index} className="mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
                    );
                  }
                  // Handle empty lines
                  if (!line.trim()) {
                    return <div key={index} className="h-3" />;
                  }
                  // Regular paragraphs
                  return (
                    <p key={index} className="mb-3 leading-relaxed">
                      {line}
                    </p>
                  );
                });
              })()}
            </div>

            {/* Generate Another */}
            <div className="mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setDevotional(null)}
                className="w-full"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Another Devotional
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

