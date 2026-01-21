/**
 * TransferRequestForm - Org Manager initiates transfer request
 * 
 * SSOT: src/constants/transferRequestConfig.ts
 * 
 * MUTUAL INITIATION WORKFLOW:
 *   1. Org Manager creates request (status: pending_teacher)
 *   2. Teacher agrees/declines in their Account page
 *   3. If agreed, request goes to Admin (status: pending_admin)
 * 
 * CHANGE: Removed attestation model. Teacher now responds in-app.
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserMinus, AlertCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  TRANSFER_TYPE,
  TRANSFER_STATUS,
  TRANSFER_VALIDATION,
  INITIATED_BY,
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

  // Load other organizations for destination selection
  useEffect(() => {
    async function loadOrganizations() {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name")
        .neq("id", currentOrgId)
        .eq("status", "approved")
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
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!user) return;

    // Validation
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
        status: TRANSFER_STATUS.PENDING_TEACHER,
        initiated_by: INITIATED_BY.ORG_MANAGER,
        reason: reason.trim(),
        requested_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Transfer Request Submitted",
        description: `${memberName} will be notified to agree or decline.`,
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
            Submit a transfer request for {memberName}. They will need to agree before it goes to the platform admin.
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

          {/* Workflow Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>What happens next:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>{memberName} will see this request in their Account page</li>
                <li>They can agree or decline</li>
                <li>If they agree, the platform admin will review and approve</li>
              </ol>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
