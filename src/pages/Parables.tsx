/**
 * Parables.tsx
 * Modern Parable Generator Page
 * 
 * DUAL CONTEXT SUPPORT:
 * 
 * 1. LESSONSPARK CONTEXT (from Lesson Library sparkle button)
 *    - URL includes: ?context=lessonspark&lessonId=...&passage=...&theologyProfile=...
 *    - Inherits lesson's settings as defaults
 *    - User can override via "Customize" toggle
 *    - LESSONSPARK_DIRECTIVE used for teaching context
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
import { Newspaper, Sparkles, BookOpen } from "lucide-react";
import type { ParableContext } from "@/constants/parableDirectives";

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
  const isLessonSparkContext = contextParam === "lessonspark";
  
  // Extract lesson settings if coming from LessonSparkUSA
  const lessonSettings: LessonSettings | undefined = isLessonSparkContext ? {
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
          {isLessonSparkContext ? "Modern Parable Generator" : "✨ Modern Parable Generator"}
        </h1>
        <p className="text-muted-foreground">
          {isLessonSparkContext 
            ? "Generate a contemporary parable to enhance your Bible study lesson."
            : "Create contemporary parables inspired by today's news, crafted in the teaching style of Jesus."
          }
        </p>
      </div>
      
      {/* Standalone Context: Expanded Explanation */}
      {!isLessonSparkContext && (
        <Card className="mb-6 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* How It Works */}
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2 flex-shrink-0">
                  <Newspaper className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Inspired by Today's Headlines
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Just as Jesus drew from everyday life—farmers sowing seed, women baking bread, 
                    shepherds searching for lost sheep—this generator finds <strong>real news stories</strong> from 
                    the past 7 days and transforms them into modern parables that illuminate timeless spiritual truths.
                  </p>
                </div>
              </div>
              
              {/* Jesus' Teaching Style */}
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900 p-2 flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    Crafted in Jesus' Teaching Style
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Each parable follows the patterns Jesus used: relatable characters facing real dilemmas, 
                    unexpected plot twists that challenge assumptions, and endings that invite reflection 
                    rather than force conclusions. The goal is stories that <em>linger</em>—prompting the reader 
                    to discover truth through contemplation.
                  </p>
                </div>
              </div>
              
              {/* How to Use */}
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-purple-100 dark:bg-purple-900 p-2 flex-shrink-0">
                  <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                    How to Use This Tool
                  </h3>
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    Enter a Bible passage or spiritual theme you'd like to explore. Choose your target audience 
                    and preferred parable style. The generator will find a relevant current event and weave 
                    it into a thought-provoking parable—complete with attribution to the original news source.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <ParableGenerator 
        context={isLessonSparkContext ? "lessonspark" : "standalone"}
        lessonSettings={lessonSettings}
      />
    </div>
  );
}
