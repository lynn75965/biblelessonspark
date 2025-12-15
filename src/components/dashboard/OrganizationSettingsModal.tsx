import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/useOrganization";
import { Loader2 } from "lucide-react";
import { THEOLOGY_PROFILE_OPTIONS } from "@/constants/theologyProfiles";
import { getBibleVersionOptions, getDefaultBibleVersion } from "@/constants/bibleVersions";

interface OrganizationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// SSOT: Map theology profile options to Select component format
const DOCTRINE_OPTIONS = THEOLOGY_PROFILE_OPTIONS.map(profile => ({
  value: profile.id,
  label: profile.name
}));

// SSOT: Bible version options
const BIBLE_VERSION_OPTIONS = getBibleVersionOptions();

export function OrganizationSettingsModal({
  open,
  onOpenChange
}: OrganizationSettingsModalProps) {
  const { organization, updateOrganization, isAdmin, userRole } = useOrganization();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Org Leaders and Co-Leaders can also edit settings
  const canEdit = isAdmin || userRole === "leader" || userRole === "co-leader";

  const [formData, setFormData] = useState(() => ({
    name: organization?.name || "",
    default_doctrine: organization?.default_doctrine || "sbc-bfm-2000",
    default_bible_version: organization?.default_bible_version || getDefaultBibleVersion().id,
    description: organization?.description || "",
    website: organization?.website || "",
    address: organization?.address || "",
    phone: organization?.phone || "",
    email: organization?.email || ""
  }));

  // Update form data when organization changes
  React.useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        default_doctrine: organization.default_doctrine || "sbc-bfm-2000",
        default_bible_version: organization.default_bible_version || getDefaultBibleVersion().id,
        description: organization.description || "",
        website: organization.website || "",
        address: organization.address || "",
        phone: organization.phone || "",
        email: organization.email || ""
      });
    }
  }, [organization]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!canEdit) {
      toast({
        title: "Error",
        description: "You don't have permission to update organization settings.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateOrganization(formData);

      toast({
        title: "Settings Updated",
        description: "Organization settings have been successfully updated.",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Organization Settings</DialogTitle>
          <DialogDescription>
            Configure your organization's settings and preferences.
            {!canEdit && " (View only - contact an organization leader to make changes)"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid gap-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="doctrine">Baptist Theology Profile</Label>
            <Select
              value={formData.default_doctrine}
              onValueChange={(value) => handleInputChange("default_doctrine", value)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select theology profile" />
              </SelectTrigger>
              <SelectContent>
                {DOCTRINE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bibleVersion">Default Bible Version</Label>
            <Select
              value={formData.default_bible_version}
              onValueChange={(value) => handleInputChange("default_bible_version", value)}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Bible version" />
              </SelectTrigger>
              <SelectContent>
                {BIBLE_VERSION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={!canEdit}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange("website", e.target.value)}
                disabled={!canEdit}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone {!isAdmin && <span className="text-sm text-muted-foreground">(Admin only)</span>}</Label>
              <Input
                id="phone"
                value={isAdmin ? formData.phone : "••••••••••"}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isAdmin}
                placeholder={isAdmin ? "(555) 123-4567" : ""}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address {!isAdmin && <span className="text-sm text-muted-foreground">(Admin only)</span>}</Label>
            <Input
              id="address"
              value={isAdmin ? formData.address : "••••••••••"}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={!isAdmin}
              placeholder={isAdmin ? "Street address" : ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="orgEmail">Organization Email {!isAdmin && <span className="text-sm text-muted-foreground">(Admin only)</span>}</Label>
            <Input
              id="orgEmail"
              type="email"
              value={isAdmin ? formData.email : "••••••••••"}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={!isAdmin}
              placeholder={isAdmin ? "contact@organization.com" : ""}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {canEdit ? "Cancel" : "Close"}
          </Button>
          {canEdit && (
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
