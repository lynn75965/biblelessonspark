import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileText, Upload, Trash2, Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrgResources } from "@/hooks/useOrgResources";
import { OrgResource } from "@/constants/contracts";

interface OrgResourcesPanelProps {
  organizationId: string;
  organizationName: string;
  canManage: boolean;
}

function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function OrgResourcesPanel({ organizationId, canManage }: OrgResourcesPanelProps) {
  const { resources, loading, refresh, deleteResource } = useOrgResources(organizationId);
  const { toast } = useToast();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<OrgResource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [openingId, setOpeningId] = useState<string | null>(null);

  const resetUploadForm = () => {
    setTitle("");
    setDescription("");
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;
      if (!authToken) {
        throw new Error("Authentication required");
      }

      const supabaseUrl = "https://hphebzdftpjbiudpfcrs.supabase.co";
      const formDataToSend = new FormData();
      formDataToSend.append("file", selectedFile);
      formDataToSend.append("title", title.trim());
      if (description.trim()) {
        formDataToSend.append("description", description.trim());
      }
      formDataToSend.append("organization_id", organizationId);

      const response = await fetch(`${supabaseUrl}/functions/v1/upload-org-resource`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "We ran into a problem uploading that. Please try again.");
      }

      toast({
        title: "Resource added",
        description: `${selectedFile.name} is now available to your teachers.`,
      });

      resetUploadForm();
      setUploadOpen(false);
      await refresh();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: (error as { message?: string }).message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleOpen = async (resource: OrgResource) => {
    setOpeningId(resource.id);
    try {
      const { data, error } = await supabase.storage
        .from('org-resources')
        .createSignedUrl(resource.file_path, 300);

      if (error || !data?.signedUrl) {
        throw new Error(error?.message || "Could not open this file");
      }

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      toast({
        title: "Could not open resource",
        description: (error as { message?: string }).message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setOpeningId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteResource(deleteTarget);
    setDeleting(false);

    if (result.success) {
      toast({
        title: "Resource removed",
        description: `${deleteTarget.title} has been removed.`,
      });
      setDeleteTarget(null);
    } else {
      toast({
        title: "Could not remove resource",
        description: result.error || "Please try again",
        variant: "destructive",
      });
    }
  };

  const isEmpty = !loading && resources.length === 0;

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setUploadOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" aria-hidden="true" />
            Add Resource
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading resources...
        </div>
      ) : isEmpty ? (
        <Card className="bg-gradient-card">
          <CardContent className="py-8 text-center text-muted-foreground">
            {canManage
              ? "Share study guides, training booklets, or other materials with your teachers. PDF files up to 25 MB."
              : "Your church hasn't shared any resources yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {resources.map((resource) => (
            <Card key={resource.id} className="bg-gradient-card">
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{resource.title}</p>
                  {resource.description && (
                    <p className="text-sm text-muted-foreground truncate">{resource.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(resource.created_at), 'MMM d, yyyy')} - {formatFileSize(resource.file_size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Open ${resource.title}`}
                  disabled={openingId === resource.id}
                  onClick={() => handleOpen(resource)}
                >
                  {openingId === resource.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${resource.title}`}
                    onClick={() => setDeleteTarget(resource)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload dialog -- leader only */}
      <Dialog open={uploadOpen} onOpenChange={(open) => { if (!uploading) { setUploadOpen(open); if (!open) resetUploadForm(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="resource-title">Title</Label>
              <Input
                id="resource-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resource-description">Description (optional)</Label>
              <Textarea
                id="resource-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resource-file">PDF file (up to 25 MB)</Label>
              <Input
                id="resource-file"
                type="file"
                accept="application/pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                disabled={uploading}
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !title.trim()}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />
                  Uploading...
                </>
              ) : (
                'Add Resource'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation -- shadcn AlertDialog, not window.confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              Teachers will no longer be able to open this. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
