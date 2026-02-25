/**
 * OrgManagerTransferRequests - Org Manager views/responds to teacher-initiated transfers
 * 
 * SSOT: src/constants/transferRequestConfig.ts
 * Location: OrgMemberManagement (Members tab)
 * 
 * Features:
 * - Shows transfer requests initiated by teachers in this org
 * - Allows Org Manager to agree or decline
 * - Shows status of all org transfer requests
 * - Filters out orphaned records (missing user profile or org)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowRightLeft,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  ArrowRight,
  RefreshCw,
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
  canOrgManagerRespond,
  isPendingMutualAgreement,
  type TransferRequest,
  type TransferStatusValue,
} from "@/constants/transferRequestConfig";

interface OrgManagerTransferRequestsProps {
  organizationId: string;
  organizationName: string;
}

export function OrgManagerTransferRequests({
  organizationId,
  organizationName,
}: OrgManagerTransferRequestsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dialog state
  const [showRespondDialog, setShowRespondDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [responseNote, setResponseNote] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      // Get all transfer requests FROM this organization
      const { data: requestsData, error } = await supabase
        .from("transfer_requests")
        .select("*")
        .eq("from_organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Fetch user profiles for display
      const userIds = [...new Set(requestsData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Fetch destination org names
      const toOrgIds = [...new Set(requestsData.map(r => r.to_organization_id).filter(Boolean))];
      const { data: orgs } = toOrgIds.length > 0
        ? await supabase
            .from("organizations")
            .select("id, name")
            .in("id", toOrgIds)
        : { data: [] };

      const orgMap = new Map((orgs || []).map(o => [o.id, o]));

      // Format data and filter out orphaned records
      const formatted: TransferRequest[] = requestsData
        .filter((r) => {
          // Filter out records where user profile is missing
          const hasProfile = profileMap.has(r.user_id);
          
          // For TO_ANOTHER_ORG type, also filter out if destination org is missing
          if (r.transfer_type === TRANSFER_TYPE.TO_ANOTHER_ORG && r.to_organization_id) {
            const hasDestOrg = orgMap.has(r.to_organization_id);
            return hasProfile && hasDestOrg;
          }
          
          return hasProfile;
        })
        .map((r) => {
          const profile = profileMap.get(r.user_id);
          const toOrg = r.to_organization_id ? orgMap.get(r.to_organization_id) : null;

          return {
            id: r.id,
            user_id: r.user_id,
            user_name: profile?.full_name || "Unknown",
            user_email: profile?.email || "",
            from_organization_id: r.from_organization_id,
            from_organization_name: organizationName,
            to_organization_id: r.to_organization_id,
            to_organization_name: toOrg?.name || null,
            transfer_type: r.transfer_type,
            status: r.status,
            initiated_by: r.initiated_by,
            reason: r.reason,
            response_note: r.response_note,
            responded_at: r.responded_at,
            admin_notes: r.admin_notes,
            requested_by: r.requested_by,
            created_at: r.created_at,
            processed_at: r.processed_at,
            processed_by: r.processed_by,
          };
        });

      setRequests(formatted);
    } catch (error) {
      console.error("Error loading transfer requests:", error);
      toast({
        title: "Error",
        description: "Failed to load transfer requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [organizationId]);

  const handleRespond = async (agree: boolean) => {
    if (!user || !selectedRequest) return;

    setSubmitting(true);
    try {
      const updateData: Record<string, any> = {
        status: agree ? TRANSFER_STATUS.PENDING_ADMIN : TRANSFER_STATUS.DECLINED_BY_ORG_MANAGER,
        response_note: responseNote.trim() || null,
        responded_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("transfer_requests")
        .update(updateData)
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: agree ? "Transfer Agreed" : "Transfer Declined",
        description: agree
          ? "The request will now go to the platform admin for final approval."
          : "You have declined the teacher's transfer request.",
      });

      setShowRespondDialog(false);
      setSelectedRequest(null);
      setResponseNote("");
      loadRequests();
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

  const handleCancelRequest = async (request: TransferRequest) => {
    if (!user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("transfer_requests")
        .update({
          status: TRANSFER_STATUS.CANCELLED,
          responded_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) throw error;

      toast({
        title: "Request Cancelled",
        description: "The transfer request has been cancelled.",
      });

      loadRequests();
    } catch (error: any) {
      console.error("Error cancelling request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: TransferStatusValue) => {
    const config = getStatusConfig(status);
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  // Count requests needing Org Manager response
  const pendingResponseCount = requests.filter(
    r => r.status === TRANSFER_STATUS.PENDING_ORG_MANAGER
  ).length;

  // Don't show if no requests at all
  if (!loading && requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Requests
              {pendingResponseCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingResponseCount} needs response
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Transfer requests for members of {organizationName}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading transfer requests...
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                <TableHead>Transfer To</TableHead>
                <TableHead>Initiated By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{request.user_name}</p>
                      <p className="text-sm text-muted-foreground">{request.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      {request.transfer_type === TRANSFER_TYPE.TO_ANOTHER_ORG ? (
                        <>
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{request.to_organization_name || "Unknown"}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">Leave (Individual)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {request.initiated_by === INITIATED_BY.TEACHER ? "Teacher" : "You"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status as TransferStatusValue)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Teacher initiated - Org Manager needs to respond */}
                    {request.status === TRANSFER_STATUS.PENDING_ORG_MANAGER && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRespondDialog(true);
                        }}
                      >
                        Respond
                      </Button>
                    )}
                    
                    {/* Org Manager initiated - can cancel while waiting for teacher */}
                    {request.status === TRANSFER_STATUS.PENDING_TEACHER && 
                     request.initiated_by === INITIATED_BY.ORG_MANAGER && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelRequest(request)}
                        disabled={submitting}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                    
                    {/* Waiting for admin - no actions */}
                    {request.status === TRANSFER_STATUS.PENDING_ADMIN && (
                      <span className="text-sm text-muted-foreground">
                        Awaiting Admin
                      </span>
                    )}
                    
                    {/* Terminal statuses */}
                    {[TRANSFER_STATUS.APPROVED, TRANSFER_STATUS.DENIED, 
                      TRANSFER_STATUS.DECLINED_BY_TEACHER, TRANSFER_STATUS.DECLINED_BY_ORG_MANAGER,
                      TRANSFER_STATUS.CANCELLED].includes(request.status as any) && (
                      <span className="text-sm text-muted-foreground">
                        {request.processed_at || request.responded_at
                          ? new Date(request.processed_at || request.responded_at!).toLocaleDateString()
                          : "--"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Respond Dialog */}
        <Dialog open={showRespondDialog} onOpenChange={setShowRespondDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Respond to Transfer Request</DialogTitle>
              <DialogDescription>
                {selectedRequest?.user_name} has requested to transfer.
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4 py-4">
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p>
                    <span className="font-medium">Teacher:</span> {selectedRequest.user_name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Transfer:</span>
                    <span>{organizationName}</span>
                    <ArrowRight className="h-4 w-4" />
                    {selectedRequest.transfer_type === TRANSFER_TYPE.TO_ANOTHER_ORG ? (
                      <span>{selectedRequest.to_organization_name}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Individual</span>
                    )}
                  </div>
                  <p>
                    <span className="font-medium">Reason:</span> {selectedRequest.reason}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Your Response Note (optional)</Label>
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
                  setSelectedRequest(null);
                  setResponseNote("");
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleRespond(false)}
                disabled={submitting}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Decline
              </Button>
              <Button
                onClick={() => handleRespond(true)}
                disabled={submitting}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Agree
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
