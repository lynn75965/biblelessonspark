// ============================================================
// CreateChildOrgDialog.tsx
// Dialog for creating child organizations under a parent org
// SSOT Source: organizationConfig.ts → CHILD_ORG_CREATION, ORG_HIERARCHY
// 
// Used by:
//   - OrgManager.tsx (parent Org Manager creates child)
//   - OrganizationManagement.tsx (Platform Admin creates child)
// 
// Validates:
//   - Org name and denomination (ORGANIZATION_VALIDATION)
//   - Depth limit (ORG_HIERARCHY.maxDepth = 4)
//   - Org type selection (ORG_TYPES from SSOT)
// ============================================================

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ORGANIZATION_VALIDATION, DENOMINATION_OPTIONS } from "@/constants/validation";
import { ORG_TYPES, ORG_HIERARCHY, isWithinMaxDepth, getOrgLevel, getLevelName } from "@/constants/organizationConfig";

interface CreateChildOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentOrgId: string;
  parentOrgName: string;
  parentOrgLevel: number;
  /** Called after successful creation with new org data */
  onCreated?: () => void;
}

export function CreateChildOrgDialog({
  open,
  onOpenChange,
  parentOrgId,
  parentOrgName,
  parentOrgLevel,
  onCreated,
}: CreateChildOrgDialogProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    denomination: "",
    description: "",
    org_type: "church" as string,
    manager_email: "",
  });

  const childLevel = parentOrgLevel + 1;
  const childLevelName = getLevelName(childLevel);
  const canCreate = isWithinMaxDepth(parentOrgLevel);

  const resetForm = () => {
    setFormData({
      name: "",
      denomination: "",
      description: "",
      org_type: "church",
      manager_email: "",
    });
  };

  const handleCreate = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast({ title: "Validation Error", description: "Organization name is required", variant: "destructive" });
      return;
    }
    if (formData.name.length < ORGANIZATION_VALIDATION.NAME_MIN_LENGTH) {
      toast({ title: "Validation Error", description: `Name must be at least ${ORGANIZATION_VALIDATION.NAME_MIN_LENGTH} characters`, variant: "destructive" });
      return;
    }
    if (!formData.denomination) {
      toast({ title: "Validation Error", description: "Please select a denomination", variant: "destructive" });
      return;
    }
    if (!canCreate) {
      toast({ title: "Depth Limit", description: `Maximum hierarchy depth of ${ORG_HIERARCHY.maxDepth} levels reached`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Insert child organization with parent reference
      const { data: newOrg, error: insertError } = await supabase
        .from("organizations")
        .insert({
          name: formData.name.trim(),
          denomination: formData.denomination,
          description: formData.description.trim() || null,
          org_type: formData.org_type,
          parent_org_id: parentOrgId,
          org_level: childLevel,
          status: "approved",
          created_by: user.id,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // If manager email provided and different from current user,
      // update created_by to that user (Admin-only flow)
      // For now, the creating user becomes the Org Manager (created_by)
      // Future: invitation workflow for designated manager

      toast({
        title: "Organization Created",
        description: `${formData.name} has been created as a ${childLevelName} under ${parentOrgName}`,
      });

      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (error: any) {
      console.error("Error creating child organization:", error);
      
      // Handle RLS denial gracefully
      if (error?.message?.includes('row-level security') || error?.code === '42501') {
        toast({
          title: "Permission Denied",
          description: "You don't have permission to create organizations under this parent.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to create organization",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create Child Organization</DialogTitle>
          <DialogDescription>
            Create a new {childLevelName.toLowerCase()} under{" "}
            <span className="font-medium text-foreground">{parentOrgName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Parent context badge */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Parent:</span>
            <Badge variant="outline">{parentOrgName}</Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="secondary">Level {childLevel}: {childLevelName}</Badge>
          </div>

          {/* Org Name */}
          <div className="space-y-2">
            <Label htmlFor="child-org-name">Organization Name *</Label>
            <Input
              id="child-org-name"
              placeholder="e.g., Children's Ministry, First Baptist of..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={ORGANIZATION_VALIDATION.NAME_MAX_LENGTH}
              disabled={submitting}
            />
          </div>

          {/* Org Type */}
          <div className="space-y-2">
            <Label htmlFor="child-org-type">Organization Type</Label>
            <select
              id="child-org-type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.org_type}
              onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
              disabled={submitting}
            >
              {ORG_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Informational label only — all organizations have identical capabilities.
            </p>
          </div>

          {/* Denomination */}
          <div className="space-y-2">
            <Label htmlFor="child-org-denom">Denomination *</Label>
            <select
              id="child-org-denom"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={formData.denomination}
              onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
              disabled={submitting}
            >
              <option value="">Select denomination...</option>
              {DENOMINATION_OPTIONS.map((denom) => (
                <option key={denom} value={denom}>{denom}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="child-org-desc">Description</Label>
            <Textarea
              id="child-org-desc"
              placeholder="Brief description of this organization..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              disabled={submitting}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={submitting || !canCreate}>
            {submitting ? "Creating..." : `Create ${childLevelName}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
