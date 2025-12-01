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
import { Building2, Plus, Check, X, UserCog, RefreshCw, Pencil } from "lucide-react";

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
  PENDING: ORGANIZATION_VALIDATION.STATUS_VALUES[0],
  APPROVED: ORGANIZATION_VALIDATION.STATUS_VALUES[1],
  REJECTED: ORGANIZATION_VALIDATION.STATUS_VALUES[2],
} as const;

// Denomination options (SSOT)
const DENOMINATION_OPTIONS = [
  "Southern Baptist Convention",
  "Independent Baptist",
  "Reformed Baptist",
  "General Baptist",
  "Missionary Baptist",
  "Primitive Baptist",
  "Other Baptist",
] as const;

export function OrganizationManagement() {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignLeaderDialogOpen, setAssignLeaderDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  
  // Create/Edit form state
  const [formData, setFormData] = useState({
    name: "",
    denomination: "",
    description: "",
  });

  // Assign leader state
  const [selectedUserId, setSelectedUserId] = useState("");

  const resetForm = () => {
    setFormData({ name: "", denomination: "", description: "" });
  };

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
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.name.length < ORGANIZATION_VALIDATION.NAME_MIN_LENGTH) {
      toast({
        title: "Validation Error",
        description: `Name must be at least ${ORGANIZATION_VALIDATION.NAME_MIN_LENGTH} characters`,
        variant: "destructive",
      });
      return;
    }

    if (!formData.denomination) {
      toast({
        title: "Validation Error",
        description: "Please select a denomination",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("organizations").insert({
        name: formData.name.trim(),
        denomination: formData.denomination,
        description: formData.description.trim() || null,
        status: ORG_STATUS.APPROVED,
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
      resetForm();
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

  const handleEditOrganization = async () => {
    if (!selectedOrg) return;

    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Organization name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: formData.name.trim(),
          denomination: formData.denomination || null,
          description: formData.description.trim() || null,
        })
        .eq("id", selectedOrg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization updated successfully",
      });

      setEditDialogOpen(false);
      setSelectedOrg(null);
      resetForm();
      fetchOrganizations();
    } catch (error) {
      console.error("Error updating organization:", error);
      toast({
        title: "Error",
        description: "Failed to update organization",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      denomination: org.denomination || "",
      description: org.description || "",
    });
    setEditDialogOpen(true);
  };

  const handleApproveOrg = async (orgId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("organizations")
        .update({
          status: ORG_STATUS.APPROVED,
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
        .update({ status: ORG_STATUS.REJECTED })
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
          organization_role: ORG_ROLES.leader,
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
      (u) => u.organization_id === orgId && u.organization_role === ORG_ROLES.leader
    );
    return leader?.full_name || "Not assigned";
  };

  const getAvailableUsers = () => {
    return users.filter(
      (u) => !u.organization_id || u.organization_id === selectedOrg?.id
    );
  };

  // Shared form fields component
  const OrgFormFields = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="org-name">Organization Name *</Label>
        <Input
          id="org-name"
          placeholder="First Baptist Church of..."
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          maxLength={ORGANIZATION_VALIDATION.NAME_MAX_LENGTH}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-denomination">Denomination *</Label>
        <Select
          value={formData.denomination}
          onValueChange={(value) => setFormData({ ...formData, denomination: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select denomination..." />
          </SelectTrigger>
          <SelectContent className="z-[200]" position="popper" sideOffset={5}>
            {DENOMINATION_OPTIONS.map((denom) => (
              <SelectItem key={denom} value={denom}>
                {denom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="org-description">Description</Label>
        <Textarea
          id="org-description"
          placeholder="Brief description of the organization..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
    </div>
  );

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
              <Dialog open={createDialogOpen} onOpenChange={(open) => {
                setCreateDialogOpen(open);
                if (!open) resetForm();
              }}>
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
                  <OrgFormFields />
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
                        {/* Edit button - always available */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(org)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        
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

      {/* Edit Organization Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setSelectedOrg(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
            <DialogDescription>
              Update organization details
            </DialogDescription>
          </DialogHeader>
          <OrgFormFields />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditOrganization}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <SelectContent className="z-[200]" position="popper" sideOffset={5}>
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
