/**
 * TransferRequestQueue - Admin reviews and processes transfer requests
 * 
 * SSOT: src/constants/transferRequestConfig.ts
 * Admin can approve (execute transfer) or deny requests
 * 
 * FIX: Simplified query to avoid foreign key naming issues with PostgREST
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  UserMinus, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Building2, 
  ArrowRight,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  TRANSFER_STATUS,
  TRANSFER_TYPE,
  TRANSFER_VALIDATION,
  getStatusConfig,
  canAdminProcess,
  isPending,
  type TransferRequest,
  type TransferStatusValue,
} from "@/constants/transferRequestConfig";

export function TransferRequestQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Dialog state
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "deny" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    try {
      // FIX: Use simpler query without explicit foreign key names
      // PostgREST can have issues with !fkey_name syntax
      const { data: requestsData, error: requestsError } = await supabase
        .from("transfer_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) {
        console.error("Error loading transfer requests:", requestsError);
        throw requestsError;
      }

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Fetch related data separately for reliability
      const userIds = [...new Set(requestsData.map(r => r.user_id).filter(Boolean))];
      const requesterIds = [...new Set(requestsData.map(r => r.requested_by).filter(Boolean))];
      const fromOrgIds = [...new Set(requestsData.map(r => r.from_organization_id).filter(Boolean))];
      const toOrgIds = [...new Set(requestsData.map(r => r.to_organization_id).filter(Boolean))];
      
      // Fetch profiles for users and requesters
      const allProfileIds = [...new Set([...userIds, ...requesterIds])];
      const { data: profiles } = allProfileIds.length > 0 
        ? await supabase
            .from("profiles")
            .select("id, full_name, email")
            .in("id", allProfileIds)
        : { data: [] };

      // Fetch organizations
      const allOrgIds = [...new Set([...fromOrgIds, ...toOrgIds])];
      const { data: orgs } = allOrgIds.length > 0
        ? await supabase
            .from("organizations")
            .select("id, name")
            .in("id", allOrgIds)
        : { data: [] };

      // Create lookup maps
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const orgMap = new Map((orgs || []).map(o => [o.id, o]));

      // Format the data
      const formatted: TransferRequest[] = requestsData.map((r) => {
        const userProfile = profileMap.get(r.user_id);
        const requesterProfile = profileMap.get(r.requested_by);
        const fromOrg = orgMap.get(r.from_organization_id);
        const toOrg = r.to_organization_id ? orgMap.get(r.to_organization_id) : null;

        return {
          id: r.id,
          user_id: r.user_id,
          user_name: userProfile?.full_name || "Unknown",
          user_email: userProfile?.email || "",
          from_organization_id: r.from_organization_id,
          from_organization_name: fromOrg?.name || "Unknown",
          to_organization_id: r.to_organization_id,
          to_organization_name: toOrg?.name || null,
          transfer_type: r.transfer_type,
          status: r.status,
          reason: r.reason,
          teacher_agreement_confirmed: r.teacher_agreement_confirmed,
          teacher_agreement_date: r.teacher_agreement_date,
          admin_notes: r.admin_notes,
          requested_by: r.requested_by,
          requested_by_name: requesterProfile?.full_name || "Unknown",
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
  }, []);

  const openActionDialog = (request: TransferRequest, action: "approve" | "deny") => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
  };

  const closeActionDialog = () => {
    setSelectedRequest(null);
    setActionType(null);
    setAdminNotes("");
  };

  const executeTransfer = async (request: TransferRequest) => {
    // Update user's organization_id in profiles
    const updateData: Record<string, any> = {
      organization_id: request.to_organization_id, // null for leave_org
      organization_role: request.to_organization_id ? "member" : null,
    };

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", request.user_id);

    if (error) throw error;
  };

  const handleAction = async () => {
    if (!selectedRequest || !actionType || !user) return;

    setProcessing(true);
    try {
      if (actionType === "approve") {
        // Execute the actual transfer first
        await executeTransfer(selectedRequest);
      }

      // Update the request status
      const { error } = await supabase
        .from("transfer_requests")
        .update({
          status: actionType === "approve" ? TRANSFER_STATUS.APPROVED : TRANSFER_STATUS.DENIED,
          admin_notes: adminNotes.trim() || null,
          processed_at: new Date().toISOString(),
          processed_by: user.id,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: actionType === "approve" ? "Transfer Approved" : "Transfer Denied",
        description: actionType === "approve"
          ? `${selectedRequest.user_name} has been transferred successfully.`
          : `Transfer request for ${selectedRequest.user_name} has been denied.`,
      });

      closeActionDialog();
      loadRequests();
    } catch (error: any) {
      console.error("Error processing transfer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process transfer request.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const pendingCount = requests.filter((r) => isPending(r.status as TransferStatusValue)).length;

  const getStatusBadge = (status: TransferStatusValue) => {
    const config = getStatusConfig(status);
    return (
      <Badge className={config.color}>
        {status === TRANSFER_STATUS.PENDING_ADMIN && <Clock className="h-3 w-3 mr-1" />}
        {status === TRANSFER_STATUS.APPROVED && <CheckCircle className="h-3 w-3 mr-1" />}
        {status === TRANSFER_STATUS.DENIED && <XCircle className="h-3 w-3 mr-1" />}
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              Transfer Requests
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingCount} pending
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Review and process member transfer requests from organization managers
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transfer requests found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Transfer</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span>{request.from_organization_name}</span>
                      <ArrowRight className="h-4 w-4" />
                      {request.transfer_type === TRANSFER_TYPE.TO_ANOTHER_ORG ? (
                        <span>{request.to_organization_name}</span>
                      ) : (
                        <span className="text-muted-foreground italic">Individual</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{request.requested_by_name}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(request.status as TransferStatusValue)}
                  </TableCell>
                  <TableCell>
                    {canAdminProcess(request.status as TransferStatusValue) ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => openActionDialog(request, "approve")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openActionDialog(request, "deny")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {request.processed_at
                          ? `Processed ${new Date(request.processed_at).toLocaleDateString()}`
                          : "—"}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Action Dialog */}
        <Dialog open={!!selectedRequest && !!actionType} onOpenChange={() => closeActionDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Approve Transfer" : "Deny Transfer"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve"
                  ? "This will immediately transfer the member."
                  : "The organization manager will be notified of the denial."}
              </DialogDescription>
            </DialogHeader>

            {selectedRequest && (
              <div className="space-y-4 py-4">
                {/* Request Summary */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p>
                    <span className="font-medium">Member:</span> {selectedRequest.user_name}
                  </p>
                  <p>
                    <span className="font-medium">From:</span> {selectedRequest.from_organization_name}
                  </p>
                  <p>
                    <span className="font-medium">To:</span>{" "}
                    {selectedRequest.transfer_type === TRANSFER_TYPE.TO_ANOTHER_ORG
                      ? selectedRequest.to_organization_name
                      : "Individual (no organization)"}
                  </p>
                  <p>
                    <span className="font-medium">Reason:</span> {selectedRequest.reason}
                  </p>
                  <p>
                    <span className="font-medium">Teacher agreed:</span>{" "}
                    {selectedRequest.teacher_agreement_date
                      ? new Date(selectedRequest.teacher_agreement_date).toLocaleDateString()
                      : "Yes"}
                  </p>
                </div>

                {actionType === "approve" && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Approving will immediately update the member's organization assignment.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Admin Notes */}
                <div className="space-y-2">
                  <Label>Admin Notes (optional)</Label>
                  <Textarea
                    placeholder={
                      actionType === "approve"
                        ? "Any notes about this approval..."
                        : "Reason for denial..."
                    }
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    maxLength={TRANSFER_VALIDATION.ADMIN_NOTES_MAX_LENGTH}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={closeActionDialog} disabled={processing}>
                Cancel
              </Button>
              <Button
                variant={actionType === "approve" ? "default" : "destructive"}
                onClick={handleAction}
                disabled={processing}
              >
                {processing
                  ? "Processing..."
                  : actionType === "approve"
                  ? "Approve & Transfer"
                  : "Deny Request"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
