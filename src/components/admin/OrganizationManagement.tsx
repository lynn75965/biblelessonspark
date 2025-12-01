import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Building2, Plus, Check, X, UserCog, RefreshCw } from "lucide-react";

// SSOT Imports - Frontend Drives Backend
import { ORG_ROLES } from "@/constants/accessControl";
import { ORGANIZATION_VALIDATION } from "@/constants/validation";

interface Organization {
  id: string;
  name: string;
  status: string;
  denomination: string | null;
  description: string | null;
  created_at: string;
  created_by: string;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  organization_id: string | null;
  organization_role: string | null;
}

// Status constants derived from SSOT
const ORG_STATUS = {
  PENDING: ORGANIZATION_VALIDATION.STATUS_VALUES[0],   // 'pending'
  APPROVED: ORGANIZATION_VALIDATION.STATUS_VALUES[1],  // 'approved'
  REJECTED: ORGANIZATION_VALIDATION.STATUS_VALUES[2],  // 'rejected'
} as const;

export function OrganizationManagement() {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignLeaderDialogOpen, setAssignLeaderDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  
  // Create form state
  const [newOrg, setNewOrg] = useState({
    name: "",
    denomination: "",
    description: "",
  });

  // Assign leader state
  const [selectedUserId, setSelectedUserId] = useState("");

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, organization_id, organization_role")
        .order("full_name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    fetchUsers();
  }, []);

  const handleCreateOrganization = async () => {
    if (!newOrg.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    if (newOrg.name.length < ORGANIZATION_VALIDATION.NAME_MIN_LENGTH) {
      toast({
        title: "Validation Error",
        description: `Name must be at least ${ORGANIZATION_VALIDATION.NAME_MIN_LENGTH} characters`,
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("organizations").insert({
        name: newOrg.name.trim(),
        denomination: newOrg.denomination.trim() || null,
        description: newOrg.description.trim() || null,
        status: ORG_STATUS.APPROVED,  // SSOT reference
        created_by: user.id,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization created successfully",
      });

      setCreateDialogOpen(false);
      setNewOrg({ name: "", denomination: "", description: "" });
      fetchOrganizations();
    } catch (error) {
      console.error("Error creating organization:", error);
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      });
    }
  };

  const handleApproveOrg = async (orgId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("organizations")
        .update({
          status: ORG_STATUS.APPROVED,  // SSOT reference
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization approved",
      });

      fetchOrganizations();
    } catch (error) {
      console.error("Error approving organization:", error);
      toast({
        title: "Error",
        description: "Failed to approve organization",
        variant: "destructive",
      });
    }
  };

  const handleRejectOrg = async (orgId: string) => {
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ status: ORG_STATUS.REJECTED })  // SSOT reference
        .eq("id", orgId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization rejected",
      });

      fetchOrganizations();
    } catch (error) {
      console.error("Error rejecting organization:", error);
      toast({
        title: "Error",
        description: "Failed to reject organization",
        variant: "destructive",
      });
    }
  };

  const handleAssignLeader = async () => {
    if (!selectedOrg || !selectedUserId) {
      toast({
        title: "Validation Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          organization_id: selectedOrg.id,
          organization_role: ORG_ROLES.leader,  // SSOT reference
        })
        .eq("id", selectedUserId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization leader assigned successfully",
      });

      setAssignLeaderDialogOpen(false);
      setSelectedOrg(null);
      setSelectedUserId("");
      fetchUsers();
    } catch (error) {
      console.error("Error assigning leader:", error);
      toast({
        title: "Error",
        description: "Failed to assign organization leader",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ORG_STATUS.APPROVED:
        return <Badge className="bg-green-500">Approved</Badge>;
      case ORG_STATUS.PENDING:
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      case ORG_STATUS.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getOrgLeader = (orgId: string) => {
    const leader = users.find(
      (u) => u.organization_id === orgId && u.organization_role === ORG_ROLES.leader  // SSOT reference
    );
    return leader?.full_name || "Not assigned";
  };

  const getAvailableUsers = () => {
    // Users without an organization or in the selected org
    return users.filter(
      (u) => !u.organization_id || u.organization_id === selectedOrg?.id
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Organization Management
              </CardTitle>
              <CardDescription>
                Create and manage church organizations
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchOrganizations}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Organization</DialogTitle>
                    <DialogDescription>
                      Add a new church organization to the platform
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="org-name">Organization Name *</Label>
                      <Input
                        id="org-name"
                        placeholder="First Baptist Church of..."
                        value={newOrg.name}
                        onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                        maxLength={ORGANIZATION_VALIDATION.NAME_MAX_LENGTH}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-denomination">Denomination</Label>
                      <Input
                        id="org-denomination"
                        placeholder="Southern Baptist Convention"
                        value={newOrg.denomination}
                        onChange={(e) => setNewOrg({ ...newOrg, denomination: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-description">Description</Label>
                      <Textarea
                        id="org-description"
                        placeholder="Brief description of the organization..."
                        value={newOrg.description}
                        onChange={(e) => setNewOrg({ ...newOrg, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateOrganization}>
                      Create Organization
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">
              {organizations.filter((o) => o.status === ORG_STATUS.APPROVED).length}
            </p>
            <p className="text-sm text-muted-foreground">Active Organizations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {organizations.filter((o) => o.status === ORG_STATUS.PENDING).length}
            </p>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">
              {users.filter((u) => u.organization_role === ORG_ROLES.leader).length}
            </p>
            <p className="text-sm text-muted-foreground">Org Leaders</p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading organizations...
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No organizations yet. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Denomination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.denomination || "-"}</TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell>{getOrgLeader(org.id)}</TableCell>
                    <TableCell>
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {org.status === ORG_STATUS.PENDING && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleApproveOrg(org.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleRejectOrg(org.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {org.status === ORG_STATUS.APPROVED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrg(org);
                              setAssignLeaderDialogOpen(true);
                            }}
                          >
                            <UserCog className="h-4 w-4 mr-1" />
                            Assign Leader
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Assign Leader Dialog */}
      <Dialog open={assignLeaderDialogOpen} onOpenChange={setAssignLeaderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Organization Leader</DialogTitle>
            <DialogDescription>
              Select a user to be the leader of {selectedOrg?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="leader-select">Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {getAvailableUsers().map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || "Unnamed User"}
                    {user.organization_role === ORG_ROLES.leader && " (Current Leader)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignLeaderDialogOpen(false);
                setSelectedOrg(null);
                setSelectedUserId("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignLeader}>Assign Leader</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
