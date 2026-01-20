/**
 * TransferRequestForm - Org Manager creates transfer request
 * 
 * SSOT: src/constants/transferRequestConfig.ts
 * Workflow: Org Manager confirms teacher agreement → Submits to Admin
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserMinus, AlertCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  TRANSFER_TYPE,
  TRANSFER_VALIDATION,
  type TransferTypeValue,
} from "@/constants/transferRequestConfig";

interface TransferRequestFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  memberEmail: string;
  currentOrgId: string;
  currentOrgName: string;
  onSuccess?: () => void;
}

interface Organization {
  id: string;
  name: string;
}

export function TransferRequestForm({
  open,
  onOpenChange,
  memberId,
  memberName,
  memberEmail,
  currentOrgId,
  currentOrgName,
  onSuccess,
}: TransferRequestFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Form state
  const [transferType, setTransferType] = useState<TransferTypeValue>(TRANSFER_TYPE.LEAVE_ORG);
  const [destinationOrgId, setDestinationOrgId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [teacherAgreed, setTeacherAgreed] = useState(false);
  const [agreementDate, setAgreementDate] = useState("");

  // Load other organizations for destination selection
  useEffect(() => {
    async function loadOrganizations() {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .neq("id", currentOrgId)
        .eq("status", "active")
        .order("name");

      if (!error && data) {
        setOrganizations(data);
      }
    }

    if (open) {
      loadOrganizations();
    }
  }, [open, currentOrgId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setTransferType(TRANSFER_TYPE.LEAVE_ORG);
      setDestinationOrgId("");
      setReason("");
      setTeacherAgreed(false);
      setAgreementDate("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
    if (!teacherAgreed) {
      toast({
        title: "Teacher Agreement Required",
        description: "You must confirm that the teacher has agreed to this transfer.",
        variant: "destructive",
      });
      return;
    }

    if (!agreementDate) {
      toast({
        title: "Agreement Date Required",
        description: "Please enter the date when the teacher agreed.",
        variant: "destructive",
      });
      return;
    }

    if (reason.length < TRANSFER_VALIDATION.REASON_MIN_LENGTH) {
      toast({
        title: "Reason Too Short",
        description: `Please provide at least ${TRANSFER_VALIDATION.REASON_MIN_LENGTH} characters explaining the reason.`,
        variant: "destructive",
      });
      return;
    }

    if (transferType === TRANSFER_TYPE.TO_ANOTHER_ORG && !destinationOrgId) {
      toast({
        title: "Destination Required",
        description: "Please select the destination organization.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("transfer_requests").insert({
        user_id: memberId,
        from_organization_id: currentOrgId,
        to_organization_id: transferType === TRANSFER_TYPE.TO_ANOTHER_ORG ? destinationOrgId : null,
        transfer_type: transferType,
        reason: reason.trim(),
        teacher_agreement_confirmed: true,
        teacher_agreement_date: new Date(agreementDate).toISOString(),
        requested_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Transfer Request Submitted",
        description: "The platform admin will review your request.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting transfer request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit transfer request.",
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
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Request Member Transfer
          </DialogTitle>
          <DialogDescription>
            Submit a transfer request for {memberName} to the platform admin.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Member Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-medium">{memberName}</p>
            <p className="text-sm text-muted-foreground">{memberEmail}</p>
            <p className="text-sm text-muted-foreground">Current: {currentOrgName}</p>
          </div>

          {/* Transfer Type */}
          <div className="space-y-2">
            <Label>Transfer Type</Label>
            <Select value={transferType} onValueChange={(v) => setTransferType(v as TransferTypeValue)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TRANSFER_TYPE.LEAVE_ORG}>
                  Leave organization (become individual user)
                </SelectItem>
                <SelectItem value={TRANSFER_TYPE.TO_ANOTHER_ORG}>
                  Transfer to another organization
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Destination Organization (if transferring) */}
          {transferType === TRANSFER_TYPE.TO_ANOTHER_ORG && (
            <div className="space-y-2">
              <Label>Destination Organization *</Label>
              <Select value={destinationOrgId} onValueChange={setDestinationOrgId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination..." />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {org.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {organizations.length === 0 && (
                <p className="text-sm text-muted-foreground">No other organizations available</p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label>Reason for Transfer *</Label>
            <Textarea
              placeholder="Explain why this transfer is needed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={TRANSFER_VALIDATION.REASON_MAX_LENGTH}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {reason.length}/{TRANSFER_VALIDATION.REASON_MAX_LENGTH} characters
              (minimum {TRANSFER_VALIDATION.REASON_MIN_LENGTH})
            </p>
          </div>

          {/* Teacher Agreement */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The teacher must agree to this transfer before you submit.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="teacherAgreed"
                checked={teacherAgreed}
                onCheckedChange={(checked) => setTeacherAgreed(checked === true)}
              />
              <Label htmlFor="teacherAgreed" className="text-sm">
                I confirm that {memberName} has agreed to this transfer
              </Label>
            </div>

            {teacherAgreed && (
              <div className="space-y-2 pl-6">
                <Label>Date of Agreement *</Label>
                <Input
                  type="date"
                  value={agreementDate}
                  onChange={(e) => setAgreementDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !teacherAgreed}>
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
