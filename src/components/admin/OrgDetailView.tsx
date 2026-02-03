// OrgDetailView - Admin drill-down into organization details
// SSOT: Uses ORG_DETAIL_TABS from orgManagerConfig.ts
// FIX: Cascade delete invites, shared focus, transfer requests before org deletion

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Building2, Rocket, Power, Trash2, AlertTriangle } from "lucide-react";
import { Organization } from "@/constants/contracts";
import { OrgMemberManagement } from "@/components/org/OrgMemberManagement";
import { OrgLessonsPanel } from "@/components/org/OrgLessonsPanel";
import { OrgAnalyticsPanel } from "@/components/org/OrgAnalyticsPanel";
import { OrgSharedFocusPanel } from "@/components/org/OrgSharedFocusPanel";
import { ROLES } from "@/constants/accessControl";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ORG_DETAIL_TABS,
  OrgDetailTabKey,
  getOrgDetailTabsArray
} from "@/constants/orgManagerConfig";

interface OrgDetailViewProps {
  organization: Organization;
  activeTab: OrgDetailTabKey;
  onTabChange: (tab: OrgDetailTabKey) => void;
  onBack: () => void;
  onOrganizationUpdate?: (org: Organization) => void;
}

export function OrgDetailView({
  organization,
  activeTab,
  onTabChange,
  onBack,
  onOrganizationUpdate
}: OrgDetailViewProps) {
  const tabs = getOrgDetailTabsArray();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Delete organization state
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch member count on mount
  useEffect(() => {
    const fetchMemberCount = async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      if (!error) {
        setMemberCount(count || 0);
      }
    };

    fetchMemberCount();
  }, [organization.id]);

  const handleBetaToggle = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const newBetaMode = !organization.beta_mode;
      
      const updateData: Record<string, any> = {
        beta_mode: newBetaMode,
      };

      if (newBetaMode) {
        // Enabling beta
        updateData.beta_start_date = new Date().toISOString();
        updateData.beta_activated_by = user.id;
        updateData.beta_end_date = null;
      } else {
        // Disabling beta
        updateData.beta_end_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: newBetaMode ? "Beta Mode Enabled" : "Beta Mode Disabled",
        description: newBetaMode 
          ? `${organization.name} is now in beta mode. New members will be marked as beta testers.`
          : `${organization.name} beta period has ended.`,
      });

      // Update parent state
      if (onOrganizationUpdate) {
        onOrganizationUpdate({
          ...organization,
          ...updateData
        });
      }
    } catch (error) {
      console.error('Error toggling beta mode:', error);
      toast({
        title: "Error",
        description: "Failed to update beta mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrganization = async () => {
    if (deleteConfirmName !== organization.name) {
      toast({
        title: "Name Mismatch",
        description: "Please type the exact organization name to confirm deletion.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Double-check member count before deleting
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id);

      if (count && count > 0) {
        toast({
          title: "Cannot Delete",
          description: "This organization still has members. Remove all members first.",
          variant: "destructive",
        });
        setIsDeleting(false);
        return;
      }

      // ============================================================
      // CASCADE DELETE RELATED RECORDS
      // Order matters: delete FK-dependent records first
      // ============================================================

      // 1. Delete invites linked to this organization
      const { error: invitesError } = await supabase
        .from("invites")
        .delete()
        .eq("organization_id", organization.id);

      if (invitesError) {
        console.error("Error deleting invites:", invitesError);
        // Continue anyway - invites are not critical
      }

      // 2. Delete shared focus records for this organization
      const { error: focusError } = await supabase
        .from("org_shared_focus")
        .delete()
        .eq("organization_id", organization.id);

      if (focusError) {
        console.error("Error deleting shared focus:", focusError);
        // Continue anyway
      }

      // 3. Delete transfer requests where this org is source or target
      const { error: transferError1 } = await supabase
        .from("transfer_requests")
        .delete()
        .eq("source_org_id", organization.id);

      if (transferError1) {
        console.error("Error deleting source transfer requests:", transferError1);
      }

      const { error: transferError2 } = await supabase
        .from("transfer_requests")
        .delete()
        .eq("target_org_id", organization.id);

      if (transferError2) {
        console.error("Error deleting target transfer requests:", transferError2);
      }

      // 4. Unlink any child organizations (set their parent_org_id to null)
      const { error: childrenError } = await supabase
        .from("organizations")
        .update({ parent_org_id: null })
        .eq("parent_org_id", organization.id);

      if (childrenError) {
        console.error("Error unlinking child organizations:", childrenError);
      }

      // ============================================================
      // NOW DELETE THE ORGANIZATION
      // ============================================================

      const { error } = await supabase
        .from("organizations")
        .delete()
        .eq("id", organization.id);

      if (error) throw error;

      toast({
        title: "Organization Deleted",
        description: `${organization.name} has been permanently deleted.`,
      });

      // Close dialog and go back to list
      setDeleteDialogOpen(false);
      onBack();
    } catch (error: any) {
      console.error("Error deleting organization:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete organization. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = memberCount === 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {organization.name}
          </CardTitle>
          {organization.beta_mode && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <Rocket className="h-3 w-3 mr-1" />
              Beta Mode
            </Badge>
          )}
        </div>
        <CardDescription>
          {organization.denomination || "No denomination specified"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as OrgDetailTabKey)}>
          <TabsList className="grid w-full grid-cols-5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value={ORG_DETAIL_TABS.details.value} className="mt-4">
            <div className="space-y-6">
              {/* Organization Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="text-sm">{organization.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm">{organization.description || "No description"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(organization.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Members</label>
                  <p className="text-sm">{memberCount !== null ? memberCount : "Loading..."}</p>
                </div>
              </div>

              {/* Beta Mode Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Organization Beta Program
                </h3>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Beta Mode</p>
                      <p className="text-sm text-muted-foreground">
                        {organization.beta_mode 
                          ? "New members joining will be marked as beta testers"
                          : "Enable to start an organization beta program"}
                      </p>
                    </div>
                    <Badge variant={organization.beta_mode ? "default" : "outline"}>
                      {organization.beta_mode ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {organization.beta_mode && organization.beta_start_date && (
                    <div className="text-sm text-muted-foreground">
                      Started: {new Date(organization.beta_start_date).toLocaleDateString()}
                    </div>
                  )}

                  {!organization.beta_mode && organization.beta_end_date && (
                    <div className="text-sm text-muted-foreground">
                      Ended: {new Date(organization.beta_end_date).toLocaleDateString()}
                    </div>
                  )}

                  <Button
                    onClick={handleBetaToggle}
                    disabled={isUpdating}
                    variant={organization.beta_mode ? "destructive" : "default"}
                    className="w-full sm:w-auto"
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {isUpdating 
                      ? "Updating..." 
                      : organization.beta_mode 
                        ? "End Beta Mode" 
                        : "Enable Beta Mode"}
                  </Button>
                </div>
              </div>

              {/* Delete Organization Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Danger Zone
                </h3>
                
                <div className="border border-destructive/50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Delete Organization</p>
                      <p className="text-sm text-muted-foreground">
                        {canDelete 
                          ? "Permanently delete this organization. This action cannot be undone."
                          : `Cannot delete: Organization has ${memberCount} member(s). Remove all members first.`}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={!canDelete}
                    variant="destructive"
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Organization
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Shared Focus Tab */}
          <TabsContent value={ORG_DETAIL_TABS.focus.value} className="mt-4">
            <OrgSharedFocusPanel
              organizationId={organization.id}
              organizationName={organization.name}
              canEdit={true}
            />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value={ORG_DETAIL_TABS.members.value} className="mt-4">
            <OrgMemberManagement
              organizationId={organization.id}
              organizationName={organization.name}
              userRole={ROLES.platformAdmin}
            />
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value={ORG_DETAIL_TABS.lessons.value} className="mt-4">
            <OrgLessonsPanel
              organizationId={organization.id}
              organizationName={organization.name}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value={ORG_DETAIL_TABS.analytics.value} className="mt-4">
            <OrgAnalyticsPanel
              organizationId={organization.id}
              organizationName={organization.name}
              betaMode={organization.beta_mode}
              betaStartDate={organization.beta_start_date}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) setDeleteConfirmName("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Organization
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the organization
              and all associated data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are about to delete <strong>{organization.name}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="confirm-name">
                Type <strong>{organization.name}</strong> to confirm:
              </Label>
              <Input
                id="confirm-name"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Enter organization name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrganization}
              disabled={isDeleting || deleteConfirmName !== organization.name}
            >
              {isDeleting ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
