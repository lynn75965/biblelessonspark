import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useOrganization } from "@/hooks/useOrganization";
import { useSubscription } from "@/hooks/useSubscription";
import { MemberPoolStatusBanner } from "@/components/org/MemberPoolStatusBanner";
import { LessonExportButtons } from "@/components/dashboard/LessonExportButtons";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/constants/routes";
import { Building2, BookOpen, Loader2, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatLessonContentToHtml,
  LESSON_CONTENT_CONTAINER_CLASSES,
  LESSON_CONTENT_CONTAINER_STYLES,
} from "@/utils/formatLessonContent";

/**
 * Shepherding (member page) -- Shepherding B2.
 *
 * The read-only, member-facing counterpart to the leader-only /org-manager.
 * Active org members reach it from the "Shepherding" sidebar tab. It shows the
 * group's pool status and the group's pool-funded lessons (Option B: pool-funded
 * lessons are group-visible). Read access is provided by the SECURITY DEFINER
 * resolver get_org_pool_lessons, scoped strictly to the caller's own
 * organization (no cross-org leakage), which returns the full content so each
 * lesson offers the same actions as the Library: view, copy, download, email.
 * Edit is intentionally absent -- members do not own these lessons.
 *
 * Leaders use /org-manager for management; if a leader lands here they simply
 * see the same read-only view.
 */

interface ShepherdLesson {
  lesson_id: string;
  user_id: string;
  title: string;
  bible_passage: string | null;
  age_group: string | null;
  theology_profile: string | null;
  visibility: string | null;
  created_at: string;
  author_name: string | null;
  original_text: string;
  metadata: Record<string, any> | null;
}

export default function Shepherding() {
  const { organization, hasOrganization, loading: orgLoading } = useOrganization();
  const { isPaidTier } = useSubscription();

  const [lessons, setLessons] = useState<ShepherdLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [viewing, setViewing] = useState<ShepherdLesson | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchLessons = async () => {
      setLessonsLoading(true);
      const { data, error } = await supabase.rpc("get_org_pool_lessons");
      if (cancelled) return;
      if (error) {
        console.error("Error loading shepherd lessons:", error);
        setLessons([]);
      } else {
        setLessons((data ?? []) as unknown as ShepherdLesson[]);
      }
      setLessonsLoading(false);
    };

    if (hasOrganization) {
      fetchLessons();
    } else {
      setLessonsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [hasOrganization]);

  // Client-side search across the pooled lessons (title, scripture, author).
  const query = search.trim().toLowerCase();
  const filteredLessons = query
    ? lessons.filter((l) =>
        [l.title, l.bible_passage, l.author_name]
          .filter(Boolean)
          .some((field) => (field as string).toLowerCase().includes(query))
      )
    : lessons;

  // Access gate: must belong to an organization. Non-members go to the dashboard.
  if (!orgLoading && !hasOrganization) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <AppShell conditions={{ hasOrganization }}>
      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
            <Building2
              className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
              aria-hidden="true"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Shepherding</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {organization?.name
                ? `${organization.name} -- shared lessons and pool`
                : "Your shepherding group"}
            </p>
          </div>
        </div>

        {/* Pool status */}
        {organization?.id && organization?.name && (
          <div className="mb-6">
            <MemberPoolStatusBanner
              organizationId={organization.id}
              organizationName={organization.name}
            />
          </div>
        )}

        {/* Shepherd Lessons */}
        <section aria-labelledby="shepherd-lessons-heading">
          <h2
            id="shepherd-lessons-heading"
            className="text-lg font-semibold mb-3 flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Shepherd Lessons
          </h2>

          {/* Search -- only meaningful once lessons have loaded */}
          {!lessonsLoading && lessons.length > 0 && (
            <div className="relative mb-3">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, scripture, or author"
                aria-label="Search shepherd lessons"
                className="pl-9"
              />
            </div>
          )}

          <div aria-live="polite">
            {lessonsLoading ? (
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground py-6"
                role="status"
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading your group's lessons...
              </div>
            ) : lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6">
                No shared lessons yet. Lessons your group creates from the shared
                pool will appear here.
              </p>
            ) : filteredLessons.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6">
                No lessons match your search.
              </p>
            ) : (
              <ul className="space-y-3">
                {filteredLessons.map((lesson) => (
                  <li
                    key={lesson.lesson_id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {lesson.title || "Untitled lesson"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          lesson.bible_passage,
                          lesson.author_name ? `by ${lesson.author_name}` : null,
                        ]
                          .filter(Boolean)
                          .join(" -- ")}
                      </p>
                    </div>
                    {/* Cards stay uncluttered: View only. Export actions live at
                        the top of the lesson view once opened. */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewing(lesson)}
                      aria-label={`View lesson: ${lesson.title || "Untitled lesson"}`}
                    >
                      <Eye className="h-4 w-4 mr-1.5" aria-hidden="true" />
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* Read-only lesson viewer */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewing?.title || "Lesson"}</DialogTitle>
          </DialogHeader>

          {/* Export actions at the TOP of the lesson view: copy, download,
              email (no edit -- members do not own these lessons). */}
          {viewing && (
            <div className="border-b border-border pb-3">
              <LessonExportButtons
                lesson={{
                  title: viewing.title || "Untitled lesson",
                  original_text: viewing.original_text,
                  metadata: viewing.metadata as any,
                }}
                isPaidUser={isPaidTier}
              />
            </div>
          )}

          <div
            className={LESSON_CONTENT_CONTAINER_CLASSES}
            style={LESSON_CONTENT_CONTAINER_STYLES}
            dangerouslySetInnerHTML={{
              __html: viewing ? formatLessonContentToHtml(viewing.original_text) : "",
            }}
          />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
