import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { sanitizeText } from "@/lib/inputSanitization";

const AGE_GROUP_OPTIONS = [
  'Children (Ages 3-11)',
  'Youth (Ages 12-18)', 
  'Adults',
  'Seniors (Ages 65+)'
];

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated: () => void;
}

export function UserProfileModal({
  open,
  onOpenChange,
  onProfileUpdated
}: UserProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [preferredAgeGroup, setPreferredAgeGroup] = useState("Adults");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (open && user) {
      loadProfile();
    }
  }, [open, user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setInitialLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, preferred_age_group')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        setPreferredAgeGroup("Adults");
      } else {
        setFullName(profile?.full_name || '');
        setPreferredAgeGroup(profile?.preferred_age_group || "Adults");
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const sanitizedName = sanitizeText(fullName.trim());
      
      if (!sanitizedName) {
        toast({
          title: "Error",
          description: "Name cannot be empty.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: sanitizedName,
          preferred_age_group: preferredAgeGroup
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      
      onProfileUpdated();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
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
          <DialogTitle>Update Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and preferences.
          </DialogDescription>
        </DialogHeader>
        
        {initialLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                maxLength={100}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="preferredAgeGroup">Preferred Age Group</Label>
              <Select
                value={preferredAgeGroup}
                onValueChange={setPreferredAgeGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_GROUP_OPTIONS.map(group => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading || initialLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || initialLoading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}