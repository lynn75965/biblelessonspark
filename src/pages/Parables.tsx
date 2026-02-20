/**
 * Parables.tsx
 * Modern Parable Generator Page
 * 
 * DUAL CONTEXT SUPPORT:
 * 
 * 1. TEACHING CONTEXT (from Lesson Library sparkle button)
 *    - URL includes: ?context=teaching&lessonId=...&passage=...&theologyProfile=...
 *    - Inherits lesson's settings as defaults
 *    - User can override via "Customize" toggle
 *    - TEACHING_DIRECTIVE used for teaching context
 * 
 * 2. STANDALONE CONTEXT (direct navigation to /parables)
 *    - No URL params or context=standalone
 *    - Simplified UI: Age Group only (no theology/bible version)
 *    - Uses defaults for theology (Southern Baptist) and Bible (KJV)
 *    - STANDALONE_DIRECTIVE used for contemplative parables
 * 
 * @version 1.2.0
 * @lastUpdated 2025-12-21
 */

import { useSearchParams } from "react-router-dom";
import { ParableGenerator } from "@/components/ParableGenerator";
import { Card, CardContent } from "@/components/ui/card";
import type { ParableContext } from "@/constants/parableDirectives";
import { UI_SYMBOLS } from "@/constants/uiSymbols";

// ============================================================================
// TYPES
// ============================================================================

export interface LessonSettings {
  lessonId: string;
  lessonTitle: string;
  passage: string;
  theologyProfile: string;
  ageGroup: string;
  bibleVersion: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function Parables() {
  const [searchParams] = useSearchParams();
  
  // Determine context from URL
  const contextParam = searchParams.get("context") as ParableContext | null;
  const isTeachingContext = contextParam === "teaching";
  
  // Extract lesson settings if coming from BibleLessonSpark
  const lessonSettings: LessonSettings | undefined = isTeachingContext ? {
    lessonId: searchParams.get("lessonId") || "",
    lessonTitle: searchParams.get("lessonTitle") || "Untitled Lesson",
    passage: searchParams.get("passage") || "",
    theologyProfile: searchParams.get("theologyProfile") || "",
    ageGroup: searchParams.get("ageGroup") || "",
    bibleVersion: searchParams.get("bibleVersion") || "",
  } : undefined;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header - Different messaging based on context */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          {isTeachingContext ? "Modern Parable Generator" : "✨ Modern Parable Generator"}
        </h1>
        <p className="text-muted-foreground">
          {isTeachingContext 
            ? "Generate a contemporary parable to enhance your Bible study lesson."
            : "Create contemporary parables inspired by today's news, crafted in the teaching style of Jesus."
          }
        </p>
      </div>
      
      {/* Standalone Context: Condensed Explanation */}
      {!isTeachingContext && (
        <Card className="mb-6 border-accent/50 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>How it works:</strong> Enter a passage or theme, and we'll find a recent news story to inspire a parable in Jesus' teaching style—complete with source attribution.
            </p>
          </CardContent>
        </Card>
      )}
      
      <ParableGenerator 
        context={isTeachingContext ? "teaching" : "standalone"}
        lessonSettings={lessonSettings}
      />
    </div>
  );
}
