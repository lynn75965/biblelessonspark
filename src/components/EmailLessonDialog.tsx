/**
 * EmailLessonDialog Component
 * ============================
 * Modal dialog for emailing a lesson to recipients
 *
 * SSOT: All labels/limits from emailDeliveryConfig.ts
 * Tier gating handled by parent (only opens for paid users)
 *
 * Created: 2026-02-01
 */

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  EMAIL_DELIVERY_CONFIG,
  parseRecipients,
  validateRecipients,
} from "@/constants/emailDeliveryConfig";

const { labels, maxRecipients, maxPersonalMessageLength } = EMAIL_DELIVERY_CONFIG;

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

export function EmailLessonDialog({
  open,
  onOpenChange,
  lesson,
  senderName,
}: EmailLessonDialogProps) {
  const [recipientsInput, setRecipientsInput] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const messageRemaining = maxPersonalMessageLength - personalMessage.length;

  const handleSend = async () => {
    // Parse and validate recipients
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {labels.dialogTitle}
          </DialogTitle>
          <DialogDescription>{labels.dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Recipients */}
          <div className="space-y-2">
            <Label htmlFor="email-recipients">{labels.recipientsLabel}</Label>
            <Textarea
              id="email-recipients"
              placeholder={labels.recipientsPlaceholder}
              value={recipientsInput}
              onChange={(e) => setRecipientsInput(e.target.value)}
              rows={3}
              disabled={sending}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {labels.recipientsHelp}
            </p>
          </div>

          {/* Personal Message */}
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

          {/* Lesson preview */}
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
