/**
 * MyOrganizationSection - Teacher views/manages organization membership
 * 
 * SSOT: src/constants/transferRequestConfig.ts
 * Location: Account page
 * 
 * Features:
 * - Shows current organization membership
 * - Displays pending transfer requests (from Org Manager)
 * - Allows teacher to initiate transfer request
 * - Allows teacher to agree/decline Org Manager requests
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  ArrowRight,
  UserMinus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  TRANSFER_STATUS,
  TRANSFER_TYPE,
  TRANSFER_VALIDATION,
  INITIATED_BY,
  getStatusConfig,
  canTeacherRespond,
  isTerminalStatus,
  type TransferRequest,
  type TransferStatusValue,
  type TransferTypeValue,
} from "@/constants/transferRequestConfig";

interface Organization {
  id: string;
  name: string;
}

interface UserProfile {
  organization_id: string | null;
  organization_role: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
}

export function MyOrganizationSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pendingRequest, setPendingRequest] = useState<TransferRequest | null>(null);
  const [myInitiatedRequest, setMyInitiatedRequest] = useState<TransferRequest | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Dialog states
  const [showInitiateDialog, setShowInitiateDialog] = useState(false);
  const [showRespondDialog, setShowRespondDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  // Form state
  const [transferType, setTransferType] = useState<TransferTypeValue>(TRANSFER_TYPE.LEAVE_ORG);
  const [destinationOrgId, setDestinationOrgId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [responseNote, setResponseNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load profile and transfer requests
  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user profile with organization
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          organization_id,
          organization_role,
          organization:organizations(id, name)
        `)
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Only check for transfer requests if user is in an organization
      if (profileData?.organization_id) {
        // Check for pending request FROM Org Manager (teacher needs to respond)
        const { data: incomingRequest } = await supabase
          .from("transfer_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", TRANSFER_STATUS.PENDING_TEACHER)
          .eq("initiated_by", INITIATED_BY.ORG_MANAGER)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setPendingRequest(incomingRequest);

        // Check for request initiated BY teacher (waiting for org manager)
        const { data: myRequest } = await supabase
          .from("transfer_requests")
          .select("*")
          .eq("user_id", user.id)
          .eq("initiated_by", INITIATED_BY.TEACHER)
          .in("status", [TRANSFER_STATUS.PENDING_ORG_MANAGER, TRANSFER_STATUS.PENDING_ADMIN])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setMyInitiatedRequest(myRequest);

        // Load other organizations for transfer destination
        const { data: orgsData } = await supabase
          .from("organizations")
          .select("id, name")
          .neq("id", profileData.organization_id)
          .eq("status", "approved")
          .order("name");

        setOrganizations(orgsData || []);
      }
    } catch (error) {
      console.error("Error loading organization data:", error);
      toast({
        title: "Error",
        description: "Failed to load organization information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Teacher initiates transfer request
  const handleInitiateTransfer = async () => {
    if (!user || !profile?.organization_id) return;

    if (reason.length < TRANSFER_VALIDATION.REASON_MIN_LENGTH) {
      toast({
        title: "Reason Too Short",
        description: `Please provide at least ${TRANSFER_VALIDATION.REASON_MIN_LENGTH} characters.`,
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

    setSubmitting(true);
    try {
      const { error } = await supabase.from("transfer_requests").insert({
        user_id: user.id,
        from_organization_id: profile.organization_id,
        to_organization_id: transferType === TRANSFER_TYPE.TO_ANOTHER_ORG ? destinationOrgId : null,
        transfer_type: transferType,
        status: TRANSFER_STATUS.PENDING_ORG_MANAGER,
        initiated_by: INITIATED_BY.TEACHER,
        reason: reason.trim(),
        requested_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Transfer Request Submitted",
        description: "Your organization manager will review your request.",
      });

      setShowInitiateDialog(false);
      resetForm();
      loadData();
    } catch (error: any) {
      console.error("Error initiating transfer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit transfer request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Teacher responds to Org Manager's request (agree or decline)
  const handleRespondToRequest = async (agree: boolean) => {
    if (!user || !pendingRequest) return;

    setSubmitting(true);
    try {
      const updateData: Record<string, any> = {
        status: agree ? TRANSFER_STATUS.PENDING_ADMIN : TRANSFER_STATUS.DECLINED_BY_TEACHER,
        response_note: responseNote.trim() || null,
        responded_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("transfer_requests")
        .update(updateData)
        .eq("id", pendingRequest.id);

      if (error) throw error;

      toast({
        title: agree ? "Transfer Agreed" : "Transfer Declined",
        description: agree
          ? "Your agreement has been recorded. Awaiting admin approval."
          : "You have declined the transfer request.",
      });

      setShowRespondDialog(false);
      setResponseNote("");
      loadData();
    } catch (error: any) {
      console.error("Error responding to transfer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to respond to transfer request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Teacher cancels their own initiated request
  const handleCancelRequest = async () => {
    if (!myInitiatedRequest) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("transfer_requests")
        .update({
          status: TRANSFER_STATUS.CANCELLED,
          responded_at: new Date().toISOString(),
        })
        .eq("id", myInitiatedRequest.id);

      if (error) throw error;

      toast({
        title: "Request Cancelled",
        description: "Your transfer request has been cancelled.",
      });

      setShowCancelDialog(false);
      loadData();
    } catch (error: any) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel transfer request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTransferType(TRANSFER_TYPE.LEAVE_ORG);
    setDestinationOrgId("");
    setReason("");
    setResponseNote("");
  };

  // Not in an organization - nothing to show
  if (!loading && !profile?.organization_id) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          My Organization
        </CardTitle>
        <CardDescription>
          Your organization membership and transfer options
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Current Organization */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">Current Organization</p>
              <p className="text-lg font-semibold">{profile?.organization?.name || "Unknown"}</p>
              <p className="text-sm text-muted-foreground capitalize">
                Role: {profile?.organization_role || "Member"}
              </p>
            </div>

            {/* Pending Request FROM Org Manager */}
            {pendingRequest && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Clock className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="ml-2">
                  <div className="space-y-2">
                    <p className="font-medium text-yellow-800">
                      Transfer Request Pending Your Response
                    </p>
                    <p className="text-sm text-yellow-700">
                      Your organization manager has requested to transfer you
                      {pendingRequest.to_organization_id
                        ? " to another organization"
                        : " out of the organization"}.
                    </p>
                    <p className="text-sm text-yellow-700">
                      <span className="font-medium">Reason:</span> {pendingRequest.reason}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => setShowRespondDialog(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* My Initiated Request Status */}
            {myInitiatedRequest && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="ml-2">
                  <div className="space-y-2">
                    <p className="font-medium text-blue-800">
                      Your Transfer Request
                    </p>
                    <p className="text-sm text-blue-700">
                      Status:{" "}
                      <Badge className={getStatusConfig(myInitiatedRequest.status as TransferStatusValue).color}>
                        {getStatusConfig(myInitiatedRequest.status as TransferStatusValue).label}
                      </Badge>
                    </p>
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">Reason:</span> {myInitiatedRequest.reason}
                    </p>
                    {myInitiatedRequest.status === TRANSFER_STATUS.PENDING_ORG_MANAGER && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCancelDialog(true)}
                        className="mt-2"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel Request
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Request Transfer Button (only if no pending requests) */}
            {!pendingRequest && !myInitiatedRequest && (
              <Button
                variant="outline"
                onClick={() => setShowInitiateDialog(true)}
                className="w-full"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Request Transfer
              </Button>
            )}
          </>
        )}

        {/* Initiate Transfer Dialog */}
        <Dialog open={showInitiateDialog} onOpenChange={setShowInitiateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserMinus className="h-5 w-5" />
                Request Transfer
              </DialogTitle>
              <DialogDescription>
                Submit a transfer request to your organization manager.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Current Org */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Leaving</p>
                <p className="font-medium">{profile?.organization?.name}</p>
              </div>

              {/* Transfer Type */}
              <div className="space-y-2">
                <Label>Transfer Type</Label>
                <Select
                  value={transferType}
                  onValueChange={(v) => setTransferType(v as TransferTypeValue)}
                >
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

              {/* Destination Organization */}
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
                    <p className="text-sm text-muted-foreground">
                      No other organizations available
                    </p>
                  )}
                </div>
              )}

              {/* Reason */}
              <div className="space-y-2">
                <Label>Reason for Transfer *</Label>
                <Textarea
                  placeholder="Explain why you would like to transfer..."
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

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your organization manager must agree before this request goes to the platform admin.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInitiateDialog(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleInitiateTransfer} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Respond to Org Manager Dialog */}
        <Dialog open={showRespondDialog} onOpenChange={setShowRespondDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Respond to Transfer Request</DialogTitle>
              <DialogDescription>
                Review and respond to your organization manager's transfer request.
              </DialogDescription>
            </DialogHeader>

            {pendingRequest && (
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{profile?.organization?.name}</span>
                    <ArrowRight className="h-4 w-4" />
                    {pendingRequest.to_organization_id ? (
                      <span>Another Organization</span>
                    ) : (
                      <span className="text-muted-foreground italic">Individual</span>
                    )}
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Reason:</span> {pendingRequest.reason}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Your Response (optional)</Label>
                  <Textarea
                    placeholder="Add a note to your response..."
                    value={responseNote}
                    onChange={(e) => setResponseNote(e.target.value)}
                    maxLength={TRANSFER_VALIDATION.RESPONSE_NOTE_MAX_LENGTH}
                    rows={2}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRespondDialog(false);
                  setResponseNote("");
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRespondToRequest(false)}
                disabled={submitting}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                onClick={() => handleRespondToRequest(true)}
                disabled={submitting}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Agree
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cancel My Request Confirmation */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Transfer Request?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to cancel your transfer request? You can submit a new request later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Keep Request</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelRequest}
                disabled={submitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {submitting ? "Cancelling..." : "Yes, Cancel Request"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
