import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Sparkles, Upload, BookOpen, Loader2 } from "lucide-react";
import { useEnhanceLesson } from "@/hooks/useEnhanceLesson";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { THEOLOGY_PROFILES } from "@/constants/theologyProfiles";

interface EnhanceLessonFormProps {
  onLessonGenerated?: (lesson: any) => void;
}

export function EnhanceLessonForm({ onLessonGenerated }: EnhanceLessonFormProps) {
  const [passageOrTopic, setPassageOrTopic] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [notes, setNotes] = useState("");
  const [theologyProfileId, setTheologyProfileId] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { enhanceLesson, isEnhancing } = useEnhanceLesson();
  const { toast } = useToast();

  // Fetch user's theology profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('theology_profile_id')
          .eq('id', user.id)
          .single();

        if (profile?.theology_profile_id) {
          setTheologyProfileId(profile.theology_profile_id);
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      if (!validTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please upload a PDF, DOCX, or TXT file.",
        });
        return;
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please upload a file smaller than 10MB.",
        });
        return;
      }

      setUploadedFile(file);
      toast({
        title: "File uploaded",
        description: `${file.name} ready to process`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!passageOrTopic.trim()) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please enter a Bible passage or topic",
      });
      return;
    }

    if (!ageGroup) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select an age group",
      });
      return;
    }

    if (!theologyProfileId) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a theology profile",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await enhanceLesson({
        passageOrTopic: passageOrTopic.trim(),
        ageGroup,
        notes: notes.trim(),
        theologyProfileId,
        uploadedFile: uploadedFile || undefined,
      });

      if (result) {
        toast({
          title: "Lesson enhanced successfully!",
          description: "Your Baptist-enhanced lesson is ready",
        });
        
        // Reset form
        setPassageOrTopic("");
        setNotes("");
        setUploadedFile(null);
        
        // Notify parent component
        onLessonGenerated?.(result);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Enhancement failed",
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Create Baptist-Enhanced Lesson
        </CardTitle>
        <CardDescription>
          Generate a theologically-sound Bible study lesson tailored to your class
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bible Passage or Topic */}
          <div className="space-y-2">
            <Label htmlFor="passageOrTopic">
              Bible Passage or Topic <span className="text-destructive">*</span>
            </Label>
            <Input
              id="passageOrTopic"
              placeholder="e.g., John 3:16-21 or 'The Love of God'"
              value={passageOrTopic}
              onChange={(e) => setPassageOrTopic(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Age Group */}
          <div className="space-y-2">
            <Label htmlFor="ageGroup">
              Age Group <span className="text-destructive">*</span>
            </Label>
            <Select value={ageGroup} onValueChange={setAgeGroup} disabled={isSubmitting}>
              <SelectTrigger id="ageGroup">
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Preschoolers (Ages 3-5)">Preschoolers (Ages 3-5)</SelectItem>
                <SelectItem value="Elementary Kids (Ages 6-10)">Elementary Kids (Ages 6-10)</SelectItem>
                <SelectItem value="Preteens & Middle Schoolers (Ages 11-14)">Preteens & Middle Schoolers (Ages 11-14)</SelectItem>
                <SelectItem value="High School Students (Ages 15-18)">High School Students (Ages 15-18)</SelectItem>
                <SelectItem value="College & Early Career (Ages 19-25)">College & Early Career (Ages 19-25)</SelectItem>
                <SelectItem value="Young Adults (Ages 26-35)">Young Adults (Ages 26-35)</SelectItem>
                <SelectItem value="Mid-Life Adults (Ages 36-50)">Mid-Life Adults (Ages 36-50)</SelectItem>
                <SelectItem value="Experienced Adults (Ages 51-65)">Experienced Adults (Ages 51-65)</SelectItem>
                <SelectItem value="Active Seniors (Ages 66-75)">Active Seniors (Ages 66-75)</SelectItem>
                <SelectItem value="Senior Adults (Ages 76+)">Senior Adults (Ages 76+)</SelectItem>
                <SelectItem value="Mixed Groups">Mixed Groups</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theology Profile */}
          <div className="space-y-2">
            <Label htmlFor="theologyProfile">
              Baptist Theology Profile <span className="text-destructive">*</span>
            </Label>
            <Select value={theologyProfileId} onValueChange={setTheologyProfileId} disabled={isSubmitting}>
              <SelectTrigger id="theologyProfile">
                <SelectValue placeholder="Select theology profile" />
              </SelectTrigger>
              <SelectContent>
                {THEOLOGY_PROFILES.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Selected profile shapes AI generation to align with specific Baptist theological standards
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any specific focus areas, cultural context, or teaching preferences..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Upload Existing Curriculum (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                disabled={isSubmitting}
                className="cursor-pointer"
              />
              {uploadedFile && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                  disabled={isSubmitting}
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Upload PDF, DOCX, or TXT files (max 10MB)
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={isSubmitting || isEnhancing}
          >
            {isSubmitting || isEnhancing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Lesson...
              </>
            ) : (
              <>
                <BookOpen className="mr-2 h-4 w-4" />
                Generate Lesson
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}