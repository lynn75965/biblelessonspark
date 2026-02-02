/**
 * EmailLessonDialog Component
 * ============================
 * Modal dialog for emailing a lesson to recipients
 * Now with CLASS EMAIL ROSTERS — save/load named email lists
 *
 * SSOT: All labels/limits from emailDeliveryConfig.ts
 * Tier gating handled by parent (only opens for paid users)
 * Rosters stored in email_rosters table via Supabase client (RLS)
 *
 * Created: 2026-02-01
 * Updated: 2026-02-01 — Added roster load/save/manage
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Loader2,
  Save,
  Settings,
  X,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  EMAIL_DELIVERY_CONFIG,
  ROSTER_CONFIG,
  parseRecipients,
  validateRecipients,
} from "@/constants/emailDeliveryConfig";

const { labels, maxRecipients, maxPersonalMessageLength } = EMAIL_DELIVERY_CONFIG;
const rosterLabels = ROSTER_CONFIG.labels;

// ============================================================================
// TYPES
// ============================================================================

interface EmailRoster {
  id: string;
  name: string;
  emails: string[];
  created_at: string;
  updated_at: string;
}

interface EmailLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: {
    title: string;
    original_text: string;
    metadata?: {
      teaser?: string | null;
      ageGroup?: string;
      theologyProfile?: string;
      bibleVersion?: string;
      copyrightNotice?: string | null;
    } | null;
  };
  senderName: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmailLessonDialog({
  open,
  onOpenChange,
  lesson,
  senderName,
}: EmailLessonDialogProps) {
  // --- Email state ---
  const [recipientsInput, setRecipientsInput] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sending, setSending] = useState(false);

  // --- Roster state ---
  const [rosters, setRosters] = useState<EmailRoster[]>([]);
  const [loadingRosters, setLoadingRosters] = useState(false);
  const [selectedRosterId, setSelectedRosterId] = useState<string>("");
  const [showSaveRoster, setShowSaveRoster] = useState(false);
  const [newRosterName, setNewRosterName] = useState("");
  const [savingRoster, setSavingRoster] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { toast } = useToast();
  const messageRemaining = maxPersonalMessageLength - personalMessage.length;

  // ================================================================
  // LOAD ROSTERS on dialog open
  // ================================================================
  const loadRosters = useCallback(async () => {
    setLoadingRosters(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("email_rosters")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true });

      if (error) {
        console.error("Failed to load rosters:", error);
        return;
      }

      setRosters((data as EmailRoster[]) || []);
    } catch (err) {
      console.error("Error loading rosters:", err);
    } finally {
      setLoadingRosters(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadRosters();
      // Reset roster-related UI state when dialog opens
      setSelectedRosterId("");
      setShowSaveRoster(false);
      setNewRosterName("");
      setShowManage(false);
    }
  }, [open, loadRosters]);

  // ================================================================
  // SELECT ROSTER → populate recipients
  // ================================================================
  const handleRosterSelect = (rosterId: string) => {
    if (rosterId === "__none__") {
      setSelectedRosterId("");
      return;
    }
    const roster = rosters.find(r => r.id === rosterId);
    if (roster) {
      setSelectedRosterId(rosterId);
      setRecipientsInput(roster.emails.join("\n"));
    }
  };

  // ================================================================
  // SAVE NEW ROSTER
  // ================================================================
  const handleSaveRoster = async () => {
    // Validate name
    const trimmedName = newRosterName.trim();
    if (!trimmedName) {
      toast({ title: rosterLabels.rosterNameRequired, variant: "destructive" });
      return;
    }
    if (trimmedName.length > ROSTER_CONFIG.maxRosterNameLength) {
      toast({
        title: rosterLabels.rosterNameTooLong.replace("{max}", String(ROSTER_CONFIG.maxRosterNameLength)),
        variant: "destructive",
      });
      return;
    }

    // Validate emails
    const parsed = parseRecipients(recipientsInput);
    const { valid } = validateRecipients(parsed);
    if (valid.length === 0) {
      toast({ title: rosterLabels.noEmailsToSave, variant: "destructive" });
      return;
    }

    // Check roster limit
    if (rosters.length >= ROSTER_CONFIG.maxRosters) {
      toast({
        title: rosterLabels.maxRostersReached.replace("{max}", String(ROSTER_CONFIG.maxRosters)),
        variant: "destructive",
      });
      return;
    }

    setSavingRoster(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("email_rosters")
        .insert({
          user_id: user.id,
          name: trimmedName,
          emails: valid,
        });

      if (error) throw error;

      toast({
        title: rosterLabels.rosterSaved
          .replace("{name}", trimmedName)
          .replace("{count}", String(valid.length)),
      });

      setNewRosterName("");
      setShowSaveRoster(false);
      await loadRosters();
    } catch (err: any) {
      console.error("Save roster error:", err);
      toast({ title: "Failed to save roster", description: err.message, variant: "destructive" });
    } finally {
      setSavingRoster(false);
    }
  };

  // ================================================================
  // UPDATE ROSTER EMAILS (overwrite with current textarea)
  // ================================================================
  const handleUpdateRoster = async (roster: EmailRoster) => {
    const parsed = parseRecipients(recipientsInput);
    const { valid } = validateRecipients(parsed);
    if (valid.length === 0) {
      toast({ title: rosterLabels.noEmailsToSave, variant: "destructive" });
      return;
    }

    setUpdatingId(roster.id);
    try {
      const { error } = await supabase
        .from("email_rosters")
        .update({ emails: valid, updated_at: new Date().toISOString() })
        .eq("id", roster.id);

      if (error) throw error;

      toast({
        title: rosterLabels.rosterUpdated
          .replace("{name}", roster.name)
          .replace("{count}", String(valid.length)),
      });

      await loadRosters();
    } catch (err: any) {
      console.error("Update roster error:", err);
      toast({ title: "Failed to update roster", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  // ================================================================
  // DELETE ROSTER
  // ================================================================
  const handleDeleteRoster = async (roster: EmailRoster) => {
    const confirmed = window.confirm(
      rosterLabels.deleteConfirm.replace("{name}", roster.name)
    );
    if (!confirmed) return;

    setDeletingId(roster.id);
    try {
      const { error } = await supabase
        .from("email_rosters")
        .delete()
        .eq("id", roster.id);

      if (error) throw error;

      toast({
        title: rosterLabels.rosterDeleted.replace("{name}", roster.name),
      });

      if (selectedRosterId === roster.id) {
        setSelectedRosterId("");
      }

      await loadRosters();
    } catch (err: any) {
      console.error("Delete roster error:", err);
      toast({ title: "Failed to delete roster", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  // ================================================================
  // SEND EMAIL (unchanged from Phase 25)
  // ================================================================
  const handleSend = async () => {
    const parsed = parseRecipients(recipientsInput);

    if (parsed.length === 0) {
      toast({
        title: labels.errorTitle,
        description: labels.errorNoRecipients,
        variant: "destructive",
      });
      return;
    }

    if (parsed.length > maxRecipients) {
      toast({
        title: labels.errorTitle,
        description: labels.errorTooManyRecipients.replace(
          "{max}",
          String(maxRecipients)
        ),
        variant: "destructive",
      });
      return;
    }

    const { valid, invalid } = validateRecipients(parsed);

    if (valid.length === 0) {
      toast({
        title: labels.errorTitle,
        description: labels.errorInvalidEmail,
        variant: "destructive",
      });
      return;
    }

    if (invalid.length > 0) {
      toast({
        title: "Invalid addresses removed",
        description: `Skipped: ${invalid.join(", ")}`,
        variant: "destructive",
      });
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "send-lesson-email",
        {
          body: {
            recipients: valid,
            lessonTitle: lesson.title,
            lessonContent: lesson.original_text,
            teaserContent: lesson.metadata?.teaser || null,
            senderName: senderName,
            personalMessage: personalMessage.trim() || null,
            metadata: {
              ageGroup: lesson.metadata?.ageGroup || null,
              theologyProfile: lesson.metadata?.theologyProfile || null,
              bibleVersion: lesson.metadata?.bibleVersion || null,
              copyrightNotice: lesson.metadata?.copyrightNotice || null,
            },
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        const sent = data.sent || valid.length;
        const failed = data.failed || 0;

        if (failed > 0) {
          toast({
            title: labels.successTitle,
            description: labels.successPartial
              .replace("{success}", String(sent))
              .replace("{total}", String(sent + failed))
              .replace("{failed}", String(failed)),
          });
        } else {
          toast({
            title: labels.successTitle,
            description: labels.successMessage.replace(
              "{count}",
              String(sent)
            ),
          });
        }

        // Reset and close
        setRecipientsInput("");
        setPersonalMessage("");
        setSelectedRosterId("");
        onOpenChange(false);
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (err: any) {
      console.error("Email send error:", err);
      toast({
        title: labels.errorTitle,
        description: labels.errorMessage,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ================================================================
  // RENDER
  // ================================================================
  const hasEmailsInTextarea = recipientsInput.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {labels.dialogTitle}
          </DialogTitle>
          <DialogDescription>{labels.dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ============================================================ */}
          {/* ROSTER SELECTOR */}
          {/* ============================================================ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {rosterLabels.loadRoster}
              </Label>
              {rosters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowManage(!showManage)}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  {showManage ? rosterLabels.hideManage : rosterLabels.manageRosters}
                </Button>
              )}
            </div>

            {loadingRosters ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading rosters...
              </div>
            ) : rosters.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                {rosterLabels.noRosters}
              </p>
            ) : (
              <Select
                value={selectedRosterId || "__none__"}
                onValueChange={handleRosterSelect}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={rosterLabels.noRosterSelected} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    {rosterLabels.noRosterSelected}
                  </SelectItem>
                  {rosters.map((roster) => (
                    <SelectItem key={roster.id} value={roster.id}>
                      {roster.name} ({roster.emails.length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* ============================================================ */}
          {/* MANAGE ROSTERS (collapsible) */}
          {/* ============================================================ */}
          {showManage && rosters.length > 0 && (
            <div className="border rounded-md p-3 bg-muted/30 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Saved Rosters
              </p>
              {rosters.map((roster) => (
                <div
                  key={roster.id}
                  className="flex items-center justify-between gap-2 py-1.5 border-b last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{roster.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {rosterLabels.recipientCount.replace("{count}", String(roster.emails.length))}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Update roster with current textarea emails */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2"
                      disabled={!hasEmailsInTextarea || updatingId === roster.id}
                      onClick={() => handleUpdateRoster(roster)}
                      title={rosterLabels.updateEmails}
                    >
                      {updatingId === roster.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                    </Button>
                    {/* Delete roster */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={deletingId === roster.id}
                      onClick={() => handleDeleteRoster(roster)}
                    >
                      {deletingId === roster.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ============================================================ */}
          {/* RECIPIENTS TEXTAREA */}
          {/* ============================================================ */}
          <div className="space-y-2">
            <Label htmlFor="email-recipients">{labels.recipientsLabel}</Label>
            <Textarea
              id="email-recipients"
              placeholder={labels.recipientsPlaceholder}
              value={recipientsInput}
              onChange={(e) => {
                setRecipientsInput(e.target.value);
                // Clear roster selection when user manually edits
                if (selectedRosterId) setSelectedRosterId("");
              }}
              rows={3}
              disabled={sending}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {labels.recipientsHelp}
            </p>
          </div>

          {/* ============================================================ */}
          {/* SAVE AS NEW ROSTER */}
          {/* ============================================================ */}
          {hasEmailsInTextarea && !showSaveRoster && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowSaveRoster(true)}
              disabled={sending}
            >
              <Save className="h-3 w-3 mr-1.5" />
              {rosterLabels.saveAsRoster}
            </Button>
          )}

          {showSaveRoster && (
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="roster-name" className="text-xs">
                  {rosterLabels.rosterNameLabel}
                </Label>
                <Input
                  id="roster-name"
                  placeholder={rosterLabels.rosterNamePlaceholder}
                  value={newRosterName}
                  onChange={(e) => setNewRosterName(e.target.value)}
                  maxLength={ROSTER_CONFIG.maxRosterNameLength}
                  disabled={savingRoster}
                  className="h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                className="h-8"
                onClick={handleSaveRoster}
                disabled={savingRoster || !newRosterName.trim()}
              >
                {savingRoster ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    {rosterLabels.saving}
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" />
                    Save
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={() => {
                  setShowSaveRoster(false);
                  setNewRosterName("");
                }}
                disabled={savingRoster}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* ============================================================ */}
          {/* PERSONAL MESSAGE */}
          {/* ============================================================ */}
          <div className="space-y-2">
            <Label htmlFor="email-message">{labels.messageLabel}</Label>
            <Textarea
              id="email-message"
              placeholder={labels.messagePlaceholder}
              value={personalMessage}
              onChange={(e) => {
                if (e.target.value.length <= maxPersonalMessageLength) {
                  setPersonalMessage(e.target.value);
                }
              }}
              rows={3}
              disabled={sending}
              className="resize-none"
            />
            <p
              className={`text-xs ${
                messageRemaining < 50
                  ? "text-orange-500"
                  : "text-muted-foreground"
              }`}
            >
              {labels.messageHelp.replace(
                "{remaining}",
                String(messageRemaining)
              )}
            </p>
          </div>

          {/* ============================================================ */}
          {/* LESSON PREVIEW */}
          {/* ============================================================ */}
          <div className="bg-muted/50 rounded-md p-3 text-sm">
            <p className="font-medium">{lesson.title}</p>
            {lesson.metadata?.ageGroup && (
              <p className="text-muted-foreground text-xs mt-1">
                {lesson.metadata.ageGroup}
                {lesson.metadata.theologyProfile
                  ? ` | ${lesson.metadata.theologyProfile}`
                  : ""}
              </p>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* DIALOG FOOTER */}
        {/* ============================================================ */}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            {labels.cancelButton}
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                {labels.sendingButton}
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-1.5" />
                {labels.sendButton}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
