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
 *    - All settings visible and user-controlled
 *    - May use teacher_preferences if authenticated
 *    - STANDALONE_DIRECTIVE used for contemplative parables
 * 
 * @version 1.1.0
 * @lastUpdated 2025-12-21
 */

import { useSearchParams } from "react-router-dom";
import { ParableGenerator } from "@/components/ParableGenerator";
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
            : "Create contemplative parables for personal reflection and devotional reading."
          }
        </p>
      </div>
      
      <ParableGenerator 
        context={isLessonSparkContext ? "lessonspark" : "standalone"}
        lessonSettings={lessonSettings}
      />
    </div>
  );
}
