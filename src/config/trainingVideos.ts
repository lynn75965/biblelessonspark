/**
 * Training Videos SSOT
 *
 * Authoritative registry of BibleLessonSpark tutorial videos.
 * Consumed by:
 *   - src/pages/Training.tsx (full Training Resources page)
 *   - src/components/dashboard/TutorialsModal.tsx (dashboard welcome banner modal)
 *
 * To add or change a tutorial, edit this file only. All UI surfaces update.
 */

export interface TrainingVideo {
  /** Vimeo numeric video id */
  id: string;
  /** Vimeo private-link hash (required for unlisted videos) */
  hash: string;
  /** Display title shown in lists and iframe title attribute */
  title: string;
  /** One-line description of what the video covers */
  description: string;
}

export const TRAINING_VIDEOS: TrainingVideo[] = [
  {
    id: "1185247853",
    hash: "ef593269e9",
    title: "Your Personal Workspace",
    description: "A guided tour of your dashboard and all the tools available to you.",
  },
  {
    id: "1184980897",
    hash: "794ce59043",
    title: "Fast Track Through Steps 1 to 3",
    description: "Quickly learn the first three steps to generating a lesson.",
  },
  {
    id: "1185175647",
    hash: "ad3dd946cd",
    title: "Insights to the Generated Lesson",
    description: "Understand the 8-section lesson format and how to make the most of it.",
  },
  {
    id: "1184980935",
    hash: "11d08c547c",
    title: "Lesson Library and Publishing",
    description: "Learn how to save, organize, and publish your lessons.",
  },
];
