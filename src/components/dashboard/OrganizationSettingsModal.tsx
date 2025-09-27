import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface OrganizationSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDoctrine: string;
  currentAgeGroup: string;
  onSettingsUpdated: (doctrine: string, ageGroup: string) => void;
}

const DOCTRINE_OPTIONS = [
  { value: "SBC", label: "Southern Baptist Convention" },
  { value: "Reformed Baptist", label: "Reformed Baptist" },
  { value: "Independent Baptist", label: "Independent Baptist" }
];

const AGE_GROUP_OPTIONS = [
  { value: "Children", label: "Children (Ages 5-12)" },
  { value: "Youth", label: "Youth (Ages 13-18)" },
  { value: "Adults", label: "Adults (18+)" },
  { value: "Seniors", label: "Seniors (65+)" }
];

export function OrganizationSettingsModal({
  open,
  onOpenChange,
  currentDoctrine,
  currentAgeGroup,
  onSettingsUpdated
}: OrganizationSettingsModalProps) {
  const [doctrine, setDoctrine] = useState(currentDoctrine);
  const [ageGroup, setAgeGroup] = useState(currentAgeGroup);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate save operation - in a real app this would update database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSettingsUpdated(doctrine, ageGroup);
      
      toast({
        title: "Settings Updated",
        description: "Organization settings have been successfully updated.",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
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
            Configure default doctrine and age group preferences for your organization.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="doctrine">Default Doctrine</Label>
            <Select value={doctrine} onValueChange={setDoctrine}>
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
            <Label htmlFor="ageGroup">Default Age Group</Label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}