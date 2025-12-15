/**
 * OrgSharedFocusPanel - Shared Focus Management for Organizations
 * 
 * SSOT: src/constants/sharedFocusConfig.ts
 * Allows Org Leaders to set church-wide passage/theme for date ranges
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Plus, Pencil, Trash2, Calendar, BookOpen, Lightbulb, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  FOCUS_TYPES,
  FOCUS_STATUS,
  SHARED_FOCUS_VALIDATION,
  getFocusStatus,
  formatDateRange,
  validateDateRange,
  type FocusTypeKey,
  type SharedFocus,
  DEFAULT_SHARED_FOCUS,
} from "@/constants/sharedFocusConfig";

interface OrgSharedFocusPanelProps {
  organizationId: string;
  organizationName: string;
  canEdit: boolean;
}

export function OrgSharedFocusPanel({
  organizationId,
  organizationName,
  canEdit,
}: OrgSharedFocusPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [focusList, setFocusList] = useState<SharedFocus[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingFocus, setEditingFocus] = useState<SharedFocus | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Form state
  const [focusType, setFocusType] = useState<FocusTypeKey>(DEFAULT_SHARED_FOCUS.focus_type);
  const [passage, setPassage] = useState("");
  const [theme, setTheme] = useState("");
  const [startDate, setStartDate] = useState(DEFAULT_SHARED_FOCUS.start_date);
  const [endDate, setEndDate] = useState(DEFAULT_SHARED_FOCUS.end_date);
  const [notes, setNotes] = useState("");

  // Fetch shared focus list
  const fetchFocusList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("org_shared_focus")
        .select("*")
        .eq("organization_id", organizationId)
        .order("start_date", { ascending: false });

      if (error) throw error;
      setFocusList(data || []);
    } catch (error) {
      console.error("Error fetching shared focus:", error);
      toast({
        title: "Error",
        description: "Failed to load shared focus list",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFocusList();
  }, [organizationId]);

  // Reset form
  const resetForm = () => {
    setFocusType(DEFAULT_SHARED_FOCUS.focus_type);
    setPassage("");
    setTheme("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setNotes("");
    setEditingFocus(null);
    setFormError(null);
  };

  // Open dialog for new focus
  const handleNewFocus = () => {
    resetForm();
    setShowDialog(true);
  };

  // Open dialog for editing
  const handleEditFocus = (focus: SharedFocus) => {
    setEditingFocus(focus);
    setFocusType(focus.focus_type);
    setPassage(focus.passage || "");
    setTheme(focus.theme || "");
    setStartDate(focus.start_date);
    setEndDate(focus.end_date);
    setNotes(focus.notes || "");
    setFormError(null);
    setShowDialog(true);
  };

  // Validate form
  const validateForm = (): boolean => {
    setFormError(null);

    // Check date range
    const dateValidation = validateDateRange(startDate, endDate);
    if (!dateValidation.valid) {
      setFormError(dateValidation.error || "Invalid date range");
      return false;
    }

    // Check required fields based on focus type
    const typeConfig = FOCUS_TYPES[focusType];
    if (typeConfig.requiresPassage && !passage.trim()) {
      setFormError("Scripture passage is required for this focus type");
      return false;
    }
    if (typeConfig.requiresTheme && !theme.trim()) {
      setFormError("Theme is required for this focus type");
      return false;
    }

    // Check max lengths
    if (passage.length > SHARED_FOCUS_VALIDATION.PASSAGE_MAX_LENGTH) {
      setFormError(`Passage cannot exceed ${SHARED_FOCUS_VALIDATION.PASSAGE_MAX_LENGTH} characters`);
      return false;
    }
    if (theme.length > SHARED_FOCUS_VALIDATION.THEME_MAX_LENGTH) {
      setFormError(`Theme cannot exceed ${SHARED_FOCUS_VALIDATION.THEME_MAX_LENGTH} characters`);
      return false;
    }
    if (notes.length > SHARED_FOCUS_VALIDATION.NOTES_MAX_LENGTH) {
      setFormError(`Notes cannot exceed ${SHARED_FOCUS_VALIDATION.NOTES_MAX_LENGTH} characters`);
      return false;
    }

    return true;
  };

  // Save focus
  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user) return;

    try {
      const focusData = {
        organization_id: organizationId,
        focus_type: focusType,
        passage: passage.trim() || null,
        theme: theme.trim() || null,
        start_date: startDate,
        end_date: endDate,
        notes: notes.trim() || null,
        created_by: user.id,
      };

      let savedFocusId: string | null = null;
      const isUpdate = !!editingFocus;

      if (editingFocus) {
        // Update existing
        const { error } = await supabase
          .from("org_shared_focus")
          .update({
            focus_type: focusType,
            passage: passage.trim() || null,
            theme: theme.trim() || null,
            start_date: startDate,
            end_date: endDate,
            notes: notes.trim() || null,
          })
          .eq("id", editingFocus.id);

        if (error) throw error;
        savedFocusId = editingFocus.id;
        toast({ title: "Success", description: "Shared focus updated" });
      } else {
        // Insert new
        const { data: newFocus, error } = await supabase
          .from("org_shared_focus")
          .insert(focusData)
          .select("id")
          .single();

        if (error) throw error;
        savedFocusId = newFocus?.id || null;
        toast({ title: "Success", description: "Shared focus created" });
      }

      setShowDialog(false);
      resetForm();
      fetchFocusList();

      // Ask to notify members
      if (savedFocusId && confirm("Would you like to notify organization members about this focus?")) {
        await sendNotification(savedFocusId, isUpdate);
      }
    } catch (error: any) {
      console.error("Error saving shared focus:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save shared focus",
        variant: "destructive",
      });
    }
  };

  // Delete focus
  const handleDelete = async (focusId: string) => {
    if (!confirm("Are you sure you want to delete this shared focus?")) return;

    try {
      const { error } = await supabase
        .from("org_shared_focus")
        .delete()
        .eq("id", focusId);

      if (error) throw error;
      toast({ title: "Success", description: "Shared focus deleted" });
      fetchFocusList();
    } catch (error: any) {
      console.error("Error deleting shared focus:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete shared focus",
        variant: "destructive",
      });
    }
  };

  // Send notification to org members
  const sendNotification = async (focusId: string, isUpdate: boolean = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
        return;
      }

      const response = await supabase.functions.invoke("send-focus-notification", {
        body: {
          focus_id: focusId,
          organization_id: organizationId,
          is_update: isUpdate,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      if (result.emails_sent > 0) {
        toast({
          title: "Notifications Sent",
          description: `${result.emails_sent} member(s) notified`,
        });
      } else {
        toast({
          title: "No Members to Notify",
          description: "You are the only member in this organization",
        });
      }
    } catch (error: any) {
      console.error("Error sending notifications:", error);
      toast({
        title: "Notification Failed",
        description: error.message || "Failed to send notifications",
        variant: "destructive",
      });
    }
  };

  // Get icon for focus type
  const getFocusIcon = (type: FocusTypeKey) => {
    switch (type) {
      case "passage": return <BookOpen className="h-4 w-4" />;
      case "theme": return <Lightbulb className="h-4 w-4" />;
      case "both": return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Shared Focus
          </h3>
          <p className="text-sm text-muted-foreground">
            Set Scripture passages or themes for coordinated study
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleNewFocus}>
            <Plus className="h-4 w-4 mr-2" />
            New Focus
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : focusList.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No shared focus set for {organizationName}</p>
            {canEdit && (
              <p className="text-sm mt-2">
                Click "New Focus" to assign a passage or theme
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {focusList.map((focus) => {
            const status = getFocusStatus(focus.start_date, focus.end_date);
            const statusConfig = FOCUS_STATUS[status];
            const typeConfig = FOCUS_TYPES[focus.focus_type];

            return (
              <Card key={focus.id} className={status === "active" ? "border-primary" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getFocusIcon(focus.focus_type)}
                      <CardTitle className="text-base">{typeConfig.label}</CardTitle>
                      <Badge variant={statusConfig.badgeVariant}>{statusConfig.label}</Badge>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFocus(focus)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(focus.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <CardDescription>
                    {formatDateRange(focus.start_date, focus.end_date)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {focus.passage && (
                    <div className="mb-2">
                      <span className="font-medium">Passage:</span> {focus.passage}
                    </div>
                  )}
                  {focus.theme && (
                    <div className="mb-2">
                      <span className="font-medium">Theme:</span> {focus.theme}
                    </div>
                  )}
                  {focus.notes && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {focus.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingFocus ? "Edit Shared Focus" : "Create Shared Focus"}
            </DialogTitle>
            <DialogDescription>
              Set a passage or theme for {organizationName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Focus Type */}
            <div className="space-y-2">
              <Label>Focus Type</Label>
              <Select value={focusType} onValueChange={(v) => setFocusType(v as FocusTypeKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(FOCUS_TYPES).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {FOCUS_TYPES[focusType].description}
              </p>
            </div>

            {/* Passage (conditional) */}
            {FOCUS_TYPES[focusType].requiresPassage && (
              <div className="space-y-2">
                <Label>Scripture Passage *</Label>
                <Input
                  placeholder="e.g., John 3:16-21"
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  maxLength={SHARED_FOCUS_VALIDATION.PASSAGE_MAX_LENGTH}
                />
              </div>
            )}

            {/* Theme (conditional) */}
            {FOCUS_TYPES[focusType].requiresTheme && (
              <div className="space-y-2">
                <Label>Theme/Topic *</Label>
                <Input
                  placeholder="e.g., God's Love for All"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  maxLength={SHARED_FOCUS_VALIDATION.THEME_MAX_LENGTH}
                />
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Additional guidance for teachers..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={SHARED_FOCUS_VALIDATION.NOTES_MAX_LENGTH}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingFocus ? "Save Changes" : "Create Focus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
