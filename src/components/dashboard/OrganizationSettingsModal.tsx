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

interface OrganizationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCTRINE_OPTIONS = [
  { value: "SBC", label: "Southern Baptist Convention" },
  { value: "Reformed Baptist", label: "Reformed Baptist" },
  { value: "Independent Baptist", label: "Independent Baptist" }
];


export function OrganizationSettingsModal({
  open,
  onOpenChange
}: OrganizationSettingsModalProps) {
  const { organization, updateOrganization, isAdmin } = useOrganization();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState(() => ({
    name: organization?.name || "",
    default_doctrine: organization?.default_doctrine || "SBC",
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
        default_doctrine: organization.default_doctrine || "SBC",
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
    if (!isAdmin) {
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Organization Settings</DialogTitle>
          <DialogDescription>
            Configure your organization's settings and preferences. 
            {!isAdmin && " (View only - contact an administrator to make changes)"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid gap-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={!isAdmin}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="doctrine">Default Doctrine</Label>
            <Select 
              value={formData.default_doctrine} 
              onValueChange={(value) => handleInputChange("default_doctrine", value)}
              disabled={!isAdmin}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select doctrine" />
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={!isAdmin}
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
                disabled={!isAdmin}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isAdmin}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={!isAdmin}
              placeholder="Street address"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="orgEmail">Organization Email</Label>
            <Input
              id="orgEmail"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={!isAdmin}
              placeholder="contact@organization.com"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {isAdmin ? "Cancel" : "Close"}
          </Button>
          {isAdmin && (
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