import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  FileText,
  ArrowLeft,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { BRANDING } from "@/config/branding";
import { ROUTES } from "@/constants/routes";
import { BLOG_CONFIG, type BlogPost } from "@/constants/blogConfig";

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "bullet",
  "blockquote",
  "link",
];

const quillEditorStyles = `
  .blog-editor .ql-container {
    font-family: inherit;
    font-size: 16px;
    min-height: 420px;
    border-bottom-left-radius: 0.5rem;
    border-bottom-right-radius: 0.5rem;
  }
  .blog-editor .ql-toolbar {
    border-top-left-radius: 0.5rem;
    border-top-right-radius: 0.5rem;
    padding: 4px 6px;
  }
  .blog-editor .ql-editor {
    min-height: 420px;
    line-height: 1.35;
    padding: 8px 12px;
  }
  .blog-editor .ql-editor h1,
  .blog-editor .ql-editor h2,
  .blog-editor .ql-editor h3,
  .blog-editor .ql-editor h4,
  .blog-editor .ql-editor h5,
  .blog-editor .ql-editor h6,
  .blog-editor .ql-editor p,
  .blog-editor .ql-editor ul,
  .blog-editor .ql-editor ol,
  .blog-editor .ql-editor li,
  .blog-editor .ql-editor blockquote,
  .blog-editor .ql-editor img,
  .blog-editor .ql-editor figure,
  .blog-editor .ql-editor div {
    margin: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
  .blog-editor .ql-editor h1 { font-size: 1.875rem; font-weight: 700; }
  .blog-editor .ql-editor h2 { font-size: 1.5rem;   font-weight: 700; }
  .blog-editor .ql-editor h3 { font-size: 1.25rem;  font-weight: 700; }
  .blog-editor .ql-editor ul,
  .blog-editor .ql-editor ol { padding-left: 1.5rem !important; }
  .blog-editor .ql-editor img {
    display: block;
    max-width: 100%;
    max-height: 280px !important;
    height: auto !important;
  }
  .blog-editor .ql-editor blockquote {
    border-left: 3px solid #3D5C3D;
    padding-left: 1rem !important;
    color: #555;
    font-style: italic;
  }
  .blog-editor .ql-editor p:empty,
  .blog-editor .ql-editor p > br:only-child {
    line-height: 0;
  }
  .blog-editor .ql-uppercase {
    width: auto !important;
    padding: 0 6px !important;
  }
  .blog-editor .ql-uppercase::after {
    content: "AA";
    font-weight: 700;
    font-size: 12px;
    letter-spacing: 0.5px;
  }
`;

type Mode = "list" | "preview" | "edit";

type DraftRow = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "content"
  | "featured_image_url"
  | "created_at"
  | "published_at"
>;

type EditForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image_url: string;
};

const SELECT_COLUMNS =
  "id, title, slug, excerpt, content, featured_image_url, created_at, published_at";

function stripLeadingFeaturedImage(content: string, featuredUrl: string | null): string {
  if (!featuredUrl) return content;
  const featuredPath = featuredUrl.split("?")[0];

  const wrapped = content.match(
    /^\s*<p[^>]*>\s*<img[^>]*src=["']([^"']+)["'][^>]*>\s*<\/p>\s*/i,
  );
  if (wrapped) {
    const srcPath = wrapped[1].split("?")[0];
    if (srcPath === featuredPath || wrapped[1] === featuredUrl) {
      return content.substring(wrapped[0].length);
    }
  }

  const bare = content.match(/^\s*<img[^>]*src=["']([^"']+)["'][^>]*>\s*/i);
  if (bare) {
    const srcPath = bare[1].split("?")[0];
    if (srcPath === featuredPath || bare[1] === featuredUrl) {
      return content.substring(bare[0].length);
    }
  }

  return content;
}

function formatCreatedDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function AdminBlogPreviewItem({
  draft,
  onPreview,
  onPublish,
  onEdit,
  onDelete,
  publishingId,
  deletingId,
}: {
  draft: DraftRow;
  onPreview: (id: string) => void;
  onPublish: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  publishingId: string | null;
  deletingId: string | null;
}) {
  const isPublishing = publishingId === draft.id;
  const isDeleting = deletingId === draft.id;
  const busy = isPublishing || isDeleting;
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => onPreview(draft.id)}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`Preview ${draft.title}`}
      >
        {draft.featured_image_url ? (
          <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
            <img
              src={draft.featured_image_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            aria-hidden="true"
            className="aspect-[16/9] w-full bg-gradient-to-br from-primary/15 to-secondary/15"
          />
        )}
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Badge variant="secondary">{BLOG_CONFIG.admin.draftBadge}</Badge>
          <span className="text-xs text-muted-foreground">
            {BLOG_CONFIG.admin.createdLabel}: {formatCreatedDate(draft.created_at)}
          </span>
        </div>

        <h2 className="mb-1 text-xl font-bold leading-tight tracking-tight text-foreground">
          {draft.title}
        </h2>
        <p className="mb-3 break-all font-mono text-xs text-muted-foreground">
          {BLOG_CONFIG.admin.slugLabel}: {draft.slug}
        </p>

        {draft.excerpt && (
          <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
            {draft.excerpt}
          </p>
        )}

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPreview(draft.id)}
          >
            <Eye aria-hidden="true" className="mr-1 h-4 w-4" />
            Preview
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => onPublish(draft.id)}
            aria-disabled={busy || undefined}
            className={busy ? "cursor-wait opacity-70" : ""}
          >
            <CheckCircle2 aria-hidden="true" className="mr-1 h-4 w-4" />
            {isPublishing
              ? BLOG_CONFIG.admin.publishingLabel
              : BLOG_CONFIG.admin.publishLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onEdit(draft.id)}
            aria-disabled={busy || undefined}
            className={busy ? "cursor-wait opacity-70" : ""}
          >
            <Pencil aria-hidden="true" className="mr-1 h-4 w-4" />
            {BLOG_CONFIG.admin.editLabel}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => onDelete(draft.id)}
            aria-disabled={busy || undefined}
            className={busy ? "cursor-wait opacity-70" : ""}
          >
            <Trash2 aria-hidden="true" className="mr-1 h-4 w-4" />
            {isDeleting
              ? BLOG_CONFIG.admin.deletingLabel
              : BLOG_CONFIG.admin.deleteLabel}
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function AdminBlogPreview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);

  const [mode, setMode] = useState<Mode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const quillRef = useRef<ReactQuill | null>(null);

  const handleUppercase = useCallback(() => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    const range = editor.getSelection();
    if (!range || range.length === 0) return;
    const text = editor.getText(range.index, range.length);
    const upper = text.toUpperCase();
    if (upper === text) return;
    editor.deleteText(range.index, range.length, "user");
    editor.insertText(range.index, upper, "user");
    editor.setSelection(range.index, range.length);
  }, []);

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline"],
          ["uppercase"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "link"],
          ["clean"],
        ],
        handlers: {
          uppercase: handleUppercase,
        },
      },
    }),
    [handleUppercase],
  );

  const selectedDraft = useMemo(
    () => drafts.find((d) => d.id === selectedId) ?? null,
    [drafts, selectedId],
  );

  // Admin gate -- mirrors Admin.tsx pattern.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        navigate(ROUTES.AUTH);
        return;
      }
      const { data: hasAdminRole, error: roleError } = await supabase.rpc(
        "has_role",
        { _user_id: user.id, _role: "admin" },
      );
      if (cancelled) return;
      if (roleError || !hasAdminRole) {
        toast({
          title: BLOG_CONFIG.admin.accessDeniedTitle,
          description: BLOG_CONFIG.admin.accessDeniedBody,
          variant: "destructive",
        });
        navigate(ROUTES.DASHBOARD);
        return;
      }
      setIsAdmin(true);
      setAuthChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, navigate, toast]);

  const fetchDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    const { data, error } = await supabase
      .from(BLOG_CONFIG.table)
      .select(SELECT_COLUMNS)
      .eq("published", false)
      .order("created_at", { ascending: false });
    if (error) {
      toast({
        title: "Could not load drafts",
        description: error.message,
        variant: "destructive",
      });
      setDrafts([]);
    } else {
      setDrafts(((data ?? []) as unknown) as DraftRow[]);
    }
    setLoadingDrafts(false);
  }, [toast]);

  useEffect(() => {
    if (isAdmin) fetchDrafts();
  }, [isAdmin, fetchDrafts]);

  useEffect(() => {
    const styleId = "blog-editor-styles";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = quillEditorStyles;
  }, []);

  useEffect(() => {
    if (mode !== "edit") return;
    const btn = document.querySelector<HTMLButtonElement>(
      ".blog-editor .ql-uppercase",
    );
    if (btn) {
      btn.setAttribute("aria-label", "Convert selected text to UPPERCASE");
      btn.setAttribute("title", "UPPERCASE selected text");
    }
  }, [mode]);

  function handlePreview(id: string) {
    setSelectedId(id);
    setMode("preview");
  }

  function handleStartEdit(id: string) {
    const d = drafts.find((x) => x.id === id);
    if (!d) return;
    setSelectedId(id);
    setEditForm({
      title: d.title,
      slug: d.slug,
      excerpt: d.excerpt ?? "",
      content: d.content,
      featured_image_url: d.featured_image_url ?? "",
    });
    setMode("edit");
  }

  async function handlePublish(id: string) {
    if (publishingId) return;
    setPublishingId(id);
    const { error } = await supabase
      .from(BLOG_CONFIG.table)
      .update({ published: true, published_at: new Date().toISOString() })
      .eq("id", id);
    setPublishingId(null);
    if (error) {
      toast({
        title: "Publish failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Post published" });
    setMode("list");
    setSelectedId(null);
    fetchDrafts();
  }

  async function handleDelete(id: string) {
    const d = drafts.find((x) => x.id === id);
    if (!d) return;
    if (
      !window.confirm(
        `${BLOG_CONFIG.admin.confirmDeleteTitle}\n\n"${d.title}"\n\n${BLOG_CONFIG.admin.confirmDeleteBody}`,
      )
    ) {
      return;
    }
    if (deletingId) return;
    setDeletingId(id);
    const { error } = await supabase
      .from(BLOG_CONFIG.table)
      .delete()
      .eq("id", id);
    setDeletingId(null);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Post deleted" });
    if (selectedId === id) {
      setSelectedId(null);
      setMode("list");
    }
    fetchDrafts();
  }

  async function handleSaveEdit() {
    if (!selectedId || saving) return;
    const title = editForm.title.trim();
    const slug = editForm.slug.trim();
    if (!title || !slug) {
      toast({
        title: "Title and slug are required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from(BLOG_CONFIG.table)
      .update({
        title,
        slug,
        excerpt: editForm.excerpt.trim() || null,
        content: editForm.content,
        featured_image_url: editForm.featured_image_url.trim() || null,
      })
      .eq("id", selectedId);
    setSaving(false);
    if (error) {
      const isUniqueViolation = error.message?.includes("blog_posts_slug_key");
      toast({
        title: "Save failed",
        description: isUniqueViolation
          ? "That slug is already in use."
          : error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Changes saved" });
    setMode("preview");
    fetchDrafts();
  }

  function renderLoadingSkeleton() {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <Skeleton className="aspect-[16/9] w-full rounded-none" />
            <div className="p-5">
              <Skeleton className="mb-3 h-6 w-3/4" />
              <Skeleton className="mb-2 h-4 w-full" />
              <Skeleton className="mb-4 h-4 w-5/6" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  function renderList() {
    if (loadingDrafts) return renderLoadingSkeleton();
    if (drafts.length === 0) {
      return (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText
              aria-hidden="true"
              className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60"
            />
            <p className="text-lg text-muted-foreground">
              {BLOG_CONFIG.admin.emptyState}
            </p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {drafts.map((draft) => (
          <AdminBlogPreviewItem
            key={draft.id}
            draft={draft}
            onPreview={handlePreview}
            onPublish={handlePublish}
            onEdit={handleStartEdit}
            onDelete={handleDelete}
            publishingId={publishingId}
            deletingId={deletingId}
          />
        ))}
      </div>
    );
  }

  function renderPreview() {
    if (!selectedDraft) return null;
    const busy =
      publishingId === selectedDraft.id || deletingId === selectedDraft.id;
    return (
      <article className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setMode("list");
              setSelectedId(null);
            }}
          >
            <ArrowLeft aria-hidden="true" className="mr-1 h-4 w-4" />
            {BLOG_CONFIG.admin.backToListLabel}
          </Button>
          <Badge variant="secondary">{BLOG_CONFIG.admin.draftBadge}</Badge>
        </div>

        <h1 className="mb-2 text-3xl font-bold tracking-tight md:text-4xl">
          {selectedDraft.title}
        </h1>
        <p className="mb-6 break-all font-mono text-sm text-muted-foreground">
          {BLOG_CONFIG.admin.slugLabel}: {selectedDraft.slug}
        </p>

        {selectedDraft.featured_image_url && (
          <img
            src={selectedDraft.featured_image_url}
            alt={selectedDraft.title}
            className="mb-6 max-h-96 w-full rounded-lg object-cover"
          />
        )}

        {selectedDraft.excerpt && (
          <p className="mb-6 text-lg text-muted-foreground">
            {selectedDraft.excerpt}
          </p>
        )}

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{
            __html: stripLeadingFeaturedImage(
              selectedDraft.content,
              selectedDraft.featured_image_url ?? null,
            ),
          }}
        />

        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button
            type="button"
            onClick={() => handlePublish(selectedDraft.id)}
            aria-disabled={busy || undefined}
            className={busy ? "cursor-wait opacity-70" : ""}
          >
            <CheckCircle2 aria-hidden="true" className="mr-1 h-4 w-4" />
            {publishingId === selectedDraft.id
              ? BLOG_CONFIG.admin.publishingLabel
              : BLOG_CONFIG.admin.publishLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleStartEdit(selectedDraft.id)}
          >
            <Pencil aria-hidden="true" className="mr-1 h-4 w-4" />
            {BLOG_CONFIG.admin.editLabel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => handleDelete(selectedDraft.id)}
            aria-disabled={busy || undefined}
            className={busy ? "cursor-wait opacity-70" : ""}
          >
            <Trash2 aria-hidden="true" className="mr-1 h-4 w-4" />
            {deletingId === selectedDraft.id
              ? BLOG_CONFIG.admin.deletingLabel
              : BLOG_CONFIG.admin.deleteLabel}
          </Button>
        </div>
      </article>
    );
  }

  function renderEdit() {
    if (!selectedDraft) return null;
    return (
      <form
        className="mx-auto max-w-3xl"
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveEdit();
        }}
      >
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMode("preview")}
          >
            <ArrowLeft aria-hidden="true" className="mr-1 h-4 w-4" />
            {BLOG_CONFIG.admin.cancelLabel}
          </Button>
          <Badge variant="secondary">{BLOG_CONFIG.admin.draftBadge}</Badge>
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="edit-title">
              {BLOG_CONFIG.admin.titleFieldLabel}
            </Label>
            <Input
              id="edit-title"
              type="text"
              value={editForm.title}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, title: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-slug">
              {BLOG_CONFIG.admin.slugFieldLabel}
            </Label>
            <Input
              id="edit-slug"
              type="text"
              value={editForm.slug}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, slug: e.target.value }))
              }
              required
              className="font-mono"
            />
          </div>

          <div>
            <Label htmlFor="edit-excerpt">
              {BLOG_CONFIG.admin.excerptFieldLabel}
            </Label>
            <Textarea
              id="edit-excerpt"
              value={editForm.excerpt}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, excerpt: e.target.value }))
              }
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit-featured-image">
              {BLOG_CONFIG.admin.featuredImageFieldLabel}
            </Label>
            <Input
              id="edit-featured-image"
              type="url"
              value={editForm.featured_image_url}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  featured_image_url: e.target.value,
                }))
              }
            />
          </div>

          <div>
            <Label id="edit-content-label">
              {BLOG_CONFIG.admin.contentFieldLabel}
            </Label>
            <div className="blog-editor mt-1.5 rounded-md border border-input">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={editForm.content}
                onChange={(value) =>
                  setEditForm((f) => ({ ...f, content: value }))
                }
                modules={quillModules}
                formats={quillFormats}
                placeholder="Write your post..."
                aria-labelledby="edit-content-label"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button
            type="submit"
            aria-disabled={saving || undefined}
            className={saving ? "cursor-wait opacity-70" : ""}
          >
            {saving
              ? BLOG_CONFIG.admin.savingLabel
              : BLOG_CONFIG.admin.saveLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMode("preview")}
          >
            {BLOG_CONFIG.admin.cancelLabel}
          </Button>
        </div>
      </form>
    );
  }

  if (authChecking) {
    return (
      <div className={`${BRANDING.layout.pageWrapper} items-center justify-center`}>
        <Card className="bg-gradient-card">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Verifying admin access...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary sm:h-14 sm:w-14">
            <FileText className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold sm:text-3xl">
              {BLOG_CONFIG.admin.pageTitle}
            </h1>
            <p className="truncate text-sm text-muted-foreground sm:text-base">
              {BLOG_CONFIG.admin.pageSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div aria-live="polite" aria-busy={loadingDrafts} className="sr-only">
        {loadingDrafts ? BLOG_CONFIG.admin.loadingLabel : ""}
      </div>

      {mode === "list" && renderList()}
      {mode === "preview" && renderPreview()}
      {mode === "edit" && renderEdit()}
    </AppShell>
  );
}
