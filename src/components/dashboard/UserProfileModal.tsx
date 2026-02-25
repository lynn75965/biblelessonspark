import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { sanitizeText } from "@/lib/inputSanitization";
import { BIBLE_VERSIONS, getDefaultBibleVersion } from "@/constants/bibleVersions";
import { THEOLOGY_PROFILES, getTheologyProfile, DEFAULT_THEOLOGY_PROFILE_ID } from "@/constants/theologyProfiles";

import { LANGUAGE_OPTIONS } from "@/constants/teacherPreferences";

type Language = typeof LANGUAGE_OPTIONS[number]["id"];

interface UserProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: () => void;
}

export function UserProfileModal({
  open,
  onOpenChange,
  onProfileUpdated
}: UserProfileModalProps) {
  // Editable fields
  const [fullName, setFullName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<Language>("english");
  const [defaultBibleVersion, setDefaultBibleVersion] = useState(getDefaultBibleVersion().id);
  const [theologyProfileId, setTheologyProfileId] = useState(DEFAULT_THEOLOGY_PROFILE_ID);

  // Read-only fields
  const [memberId, setMemberId] = useState("");
  const [role, setRole] = useState("");
  const [orgName, setOrgName] = useState("");

  // UI state
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
      // Load profile with org info
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, preferred_language, default_bible_version, theology_profile_id, organization_role, organization_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
        setMemberId(user.id?.substring(0, 8) || '');
        return;
      }

      // Set editable fields
      setFullName(profile?.full_name || '');
      setPreferredLanguage((profile?.preferred_language as Language) || 'english');
      setDefaultBibleVersion(profile?.default_bible_version || getDefaultBibleVersion().id);
      setTheologyProfileId(profile?.theology_profile_id || DEFAULT_THEOLOGY_PROFILE_ID);

      // Set read-only fields
      setMemberId(user.id?.substring(0, 8) || '');

      // Format role display
      const roleMap: Record<string, string> = {
        'platform_admin': 'Administrator',
        'org_leader': 'Organization Manager',
        'org_member': 'Organization Member',
        'individual': 'Individual',
      };
      setRole(roleMap[profile?.organization_role || ''] || 'Individual');

      // Fetch org name if user belongs to one
      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', profile.organization_id)
          .single();
        setOrgName(org?.name || '');
      } else {
        setOrgName('');
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
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: sanitizedName,
          preferred_language: preferredLanguage,
          default_bible_version: defaultBibleVersion?.toLowerCase() ?? null,
          theology_profile_id: theologyProfileId,
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      onProfileUpdated?.();

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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription>
            Your identity and personal defaults. These pre-populate throughout BibleLessonSpark.
          </DialogDescription>
        </DialogHeader>

        {initialLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* -- READ-ONLY IDENTITY FIELDS ----------------------- */}

            {/* Email */}
            <div className="grid gap-1">
              <Label htmlFor="email" className="text-xs text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted h-9 text-sm"
              />
            </div>

            {/* Member ID & Role -- side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Member ID</Label>
                <Input
                  value={memberId}
                  disabled
                  className="bg-muted h-9 text-sm font-mono"
                />
              </div>
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Input
                  value={role}
                  disabled
                  className="bg-muted h-9 text-sm"
                />
              </div>
            </div>

            {/* Organization */}
            {orgName && (
              <div className="grid gap-1">
                <Label className="text-xs text-muted-foreground">Organization</Label>
                <Input
                  value={orgName}
                  disabled
                  className="bg-muted h-9 text-sm"
                />
              </div>
            )}

            {/* -- DIVIDER ----------------------------------------- */}
            <div className="border-t my-1" />

            {/* -- EDITABLE FIELDS --------------------------------- */}

            {/* Full Name */}
            <div className="grid gap-1">
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

            {/* Language */}
            <div className="grid gap-1">
              <Label>Language</Label>
              <Select
                value={preferredLanguage}
                onValueChange={(value) => setPreferredLanguage(value as Language)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Default Bible Version */}
            <div className="grid gap-1">
              <Label>Default Bible Version</Label>
              <Select
                value={defaultBibleVersion}
                onValueChange={(value) => setDefaultBibleVersion(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Bible version" />
                </SelectTrigger>
                <SelectContent>
                  {BIBLE_VERSIONS.map(version => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.name} ({version.abbreviation})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Baptist Theology Profile */}
            <div className="grid gap-1">
              <Label>Baptist Theology Profile</Label>
              <Select
                value={theologyProfileId}
                onValueChange={(value) => setTheologyProfileId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select theology profile" />
                </SelectTrigger>
                <SelectContent>
                  {THEOLOGY_PROFILES.map(profile => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {theologyProfileId && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-1 p-2 bg-muted/50 rounded-md">
                  {getTheologyProfile(theologyProfileId)?.summary}
                </p>
              )}
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
