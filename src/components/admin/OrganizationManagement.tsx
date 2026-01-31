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
import { Building2, Plus, Check, X, UserCog, RefreshCw, Pencil, Eye, ArrowLeft, Download, Network, Search, ChevronRight } from "lucide-react";

// SSOT Imports - Frontend Drives Backend
import { ORG_ROLES } from "@/constants/accessControl";
import { ORGANIZATION_VALIDATION, DENOMINATION_OPTIONS } from "@/constants/validation";
import { Organization } from "@/constants/contracts";
import { ORG_DETAIL_TABS, OrgDetailTabKey, DEFAULT_ORG_DETAIL_TAB } from "@/constants/orgManagerConfig";
import { ORG_TYPES, isWithinMaxDepth, getLevelName } from "@/constants/organizationConfig";
import { OrgDetailView } from "./OrgDetailView";
import { TransferRequestQueue } from "./TransferRequestQueue";
import { CreateChildOrgDialog } from "../org/CreateChildOrgDialog";

// Organization type imported from @/constants/contracts

interface UserProfile {
  id: string;
  full_name: string | null;
  organization_id: string | null;
  organization_role: string | null;
}

// Extended profile for export
interface ExportUserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  organization_id: string | null;
  organization_role: string | null;
  subscription_tier: string | null;
  created_at: string | null;
}

// Status constants derived from SSOT
const ORG_STATUS = {
  PENDING: ORGANIZATION_VALIDATION.STATUS_VALUES[0],
  APPROVED: ORGANIZATION_VALIDATION.STATUS_VALUES[1],
  REJECTED: ORGANIZATION_VALIDATION.STATUS_VALUES[2],
} as const;

export function OrganizationManagement() {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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

  // Drill-down state (Phase 13.9)
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<OrgDetailTabKey>(DEFAULT_ORG_DETAIL_TAB);

  // Phase N4: Create Child Org state
  const [createChildDialogOpen, setCreateChildDialogOpen] = useState(false);
  const [createChildParentOrg, setCreateChildParentOrg] = useState<Organization | null>(null);

  // Phase N5: Hierarchy filter and search state
  const [hierarchyFilter, setHierarchyFilter] = useState<'all' | 'top-level' | 'children'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

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

  // ============================================================
  // Export Functions
  // ============================================================

  const downloadCSV = (data: string, filename: string) => {
    const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const escapeCSV = (value: string | null | undefined): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const handleExportAllUsers = async () => {
    setExporting(true);
    try {
      // Fetch all users with extended fields
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, organization_id, organization_role, subscription_tier, created_at")
        .order("full_name");

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "No Data",
          description: "No users found to export.",
        });
        return;
      }

      // Create org lookup map
      const orgMap = new Map(organizations.map(o => [o.id, o.name]));

      // Build CSV
      const headers = ["Name", "Email", "Organization", "Org Role", "Subscription Tier", "Joined Date"];
      const rows = profiles.map((p: ExportUserProfile) => [
        escapeCSV(p.full_name),
        escapeCSV(p.email),
        escapeCSV(p.organization_id ? orgMap.get(p.organization_id) || "Unknown" : "None"),
        escapeCSV(p.organization_role || "None"),
        escapeCSV(p.subscription_tier || "None"),
        escapeCSV(p.created_at ? new Date(p.created_at).toLocaleDateString() : ""),
      ]);

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const filename = `biblelessonspark-all-users-${new Date().toISOString().split("T")[0]}.csv`;
      
      downloadCSV(csv, filename);

      toast({
        title: "Export Complete",
        description: `Exported ${profiles.length} users to ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting users:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportOrgMembers = async (org: Organization) => {
    setExporting(true);
    try {
      // Fetch members of this organization
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, organization_role, subscription_tier, created_at")
        .eq("organization_id", org.id)
        .order("full_name");

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "No Members",
          description: `${org.name} has no members to export.`,
        });
        return;
      }

      // Build CSV
      const headers = ["Name", "Email", "Role", "Subscription Tier", "Joined Date"];
      const rows = profiles.map((p: any) => [
        escapeCSV(p.full_name),
        escapeCSV(p.email),
        escapeCSV(p.organization_role || "Member"),
        escapeCSV(p.subscription_tier || "None"),
        escapeCSV(p.created_at ? new Date(p.created_at).toLocaleDateString() : ""),
      ]);

      const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
      const safeOrgName = org.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      const filename = `${safeOrgName}-members-${new Date().toISOString().split("T")[0]}.csv`;
      
      downloadCSV(csv, filename);

      toast({
        title: "Export Complete",
        description: `Exported ${profiles.length} members from ${org.name}`,
      });
    } catch (error) {
      console.error("Error exporting org members:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export members. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  // ============================================================
  // Organization CRUD Functions
  // ============================================================

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
        return <Badge className="bg-primary">Approved</Badge>;
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

  const getMemberCount = (orgId: string) => {
    return users.filter((u) => u.organization_id === orgId).length;
  };

  // Phase N4: Get parent org name for hierarchy display
  const getParentOrgName = (parentId: string | null) => {
    if (!parentId) return null;
    const parent = organizations.find((o) => o.id === parentId);
    return parent?.name || "Unknown";
  };

  // Phase N5: Hierarchy helpers
  const getChildCount = (orgId: string) => {
    return organizations.filter((o) => (o as any).parent_org_id === orgId).length;
  };

  const toggleParentExpanded = (orgId: string) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  };

  // Build tree-ordered list for display:
  // Top-level orgs first, then their children indented beneath them
  const buildTreeOrder = (orgs: Organization[]): Organization[] => {
    const topLevel = orgs.filter((o) => !(o as any).parent_org_id);
    const childMap = new Map<string, Organization[]>();
    
    orgs.forEach((o) => {
      const parentId = (o as any).parent_org_id;
      if (parentId) {
        const siblings = childMap.get(parentId) || [];
        siblings.push(o);
        childMap.set(parentId, siblings);
      }
    });

    const result: Organization[] = [];
    const addWithChildren = (org: Organization, depth: number) => {
      result.push(org);
      if (expandedParents.has(org.id) || searchQuery) {
        const children = childMap.get(org.id) || [];
        children
          .sort((a, b) => a.name.localeCompare(b.name))
          .forEach((child) => addWithChildren(child, depth + 1));
      }
    };

    topLevel
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((org) => addWithChildren(org, 0));

    // Include any orphaned children (parent not in current list)
    const resultIds = new Set(result.map(r => r.id));
    orgs.forEach((o) => {
      if (!resultIds.has(o.id)) result.push(o);
    });

    return result;
  };

  // Apply filters and search
  const filteredOrganizations = (() => {
    let filtered = [...organizations];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((o) =>
        o.name.toLowerCase().includes(q) ||
        (o.denomination || '').toLowerCase().includes(q) ||
        ((o as any).org_type || '').toLowerCase().includes(q)
      );
    }

    // Hierarchy filter
    if (hierarchyFilter === 'top-level') {
      filtered = filtered.filter((o) => !(o as any).parent_org_id);
    } else if (hierarchyFilter === 'children') {
      filtered = filtered.filter((o) => !!(o as any).parent_org_id);
    }

    return buildTreeOrder(filtered);
  })();

  // Stats computed from all orgs (unfiltered)
  const topLevelCount = organizations.filter((o) => !(o as any).parent_org_id && o.status === ORG_STATUS.APPROVED).length;
  const childOrgCount = organizations.filter((o) => !!(o as any).parent_org_id && o.status === ORG_STATUS.APPROVED).length;
  const maxDepthUsed = Math.max(...organizations.map((o) => (o as any).org_level || 1), 0);

  return (
    <div className="space-y-6">
      {viewingOrg ? (
        <OrgDetailView
          organization={viewingOrg}
          activeTab={activeDetailTab}
          onTabChange={setActiveDetailTab}
          onBack={() => {
            setViewingOrg(null);
            setActiveDetailTab(DEFAULT_ORG_DETAIL_TAB);
          }}
          onOrganizationUpdate={(updatedOrg) => {
            setViewingOrg(updatedOrg);
            // Also update in the main list
            setOrganizations(prev => 
              prev.map(org => org.id === updatedOrg.id ? updatedOrg : org)
            );
          }}
        />
      ) : (
        <>
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportAllUsers}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? "Exporting..." : "Export All Users"}
              </Button>
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
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="create-org-name">Organization Name *</Label>
                      <Input
                        id="create-org-name"
                        placeholder="First Baptist Church of..."
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        maxLength={ORGANIZATION_VALIDATION.NAME_MAX_LENGTH}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-org-denom">Denomination *</Label>
                      <select
                        id="create-org-denom"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={formData.denomination}
                        onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                      >
                        <option value="">Select denomination...</option>
                        {DENOMINATION_OPTIONS.map((denom) => (
                          <option key={denom} value={denom}>{denom}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create-org-desc">Description</Label>
                      <Textarea
                        id="create-org-desc"
                        placeholder="Brief description of the organization..."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              {topLevelCount}
              {childOrgCount > 0 && (
                <span className="text-lg font-normal text-muted-foreground ml-1">
                  + {childOrgCount}
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {childOrgCount > 0 ? 'Top-level + Children' : 'Top-level Orgs'}
            </p>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle>All Organizations</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {/* Phase N5: Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orgs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 w-[180px]"
                />
              </div>
              {/* Phase N5: Hierarchy Filter */}
              <div className="flex items-center gap-1 border rounded-md p-0.5">
                <Button
                  size="sm"
                  variant={hierarchyFilter === 'all' ? 'default' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setHierarchyFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={hierarchyFilter === 'top-level' ? 'default' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setHierarchyFilter('top-level')}
                >
                  Top-level
                </Button>
                <Button
                  size="sm"
                  variant={hierarchyFilter === 'children' ? 'default' : 'ghost'}
                  className="h-7 px-2.5 text-xs"
                  onClick={() => setHierarchyFilter('children')}
                >
                  Children
                </Button>
              </div>
            </div>
          </div>
          {/* Active filter indicator */}
          {(searchQuery || hierarchyFilter !== 'all') && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing {filteredOrganizations.length} of {organizations.length} organizations
              {searchQuery && ` matching "${searchQuery}"`}
              {hierarchyFilter !== 'all' && ` (${hierarchyFilter})`}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading organizations...
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {organizations.length === 0
                ? "No organizations yet. Create one to get started."
                : "No organizations match your filter."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Denomination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => {
                  const orgLevel = (org as any).org_level || 1;
                  const parentId = (org as any).parent_org_id;
                  const childCount = getChildCount(org.id);
                  const isExpanded = expandedParents.has(org.id);
                  // Indent based on level (level 1 = 0px, level 2 = 20px, etc.)
                  const indentPx = parentId ? (orgLevel - 1) * 20 : 0;

                  return (
                  <TableRow key={org.id} className={parentId ? "bg-muted/30" : ""}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1" style={{ paddingLeft: `${indentPx}px` }}>
                        {/* Expand/collapse toggle for orgs with children */}
                        {childCount > 0 ? (
                          <button
                            onClick={() => toggleParentExpanded(org.id)}
                            className="p-0.5 hover:bg-muted rounded transition-transform"
                            title={isExpanded ? "Collapse children" : `Expand ${childCount} children`}
                          >
                            <ChevronRight
                              className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </button>
                        ) : (
                          <span className="w-5" /> 
                        )}
                        <span>{org.name}</span>
                        {childCount > 0 && (
                          <Badge variant="outline" className="text-[10px] ml-1">
                            {childCount}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(org as any).parent_org_id ? (
                        <Badge variant="outline" className="text-xs">
                          {getParentOrgName((org as any).parent_org_id)}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">Top-level</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        L{orgLevel} · {getLevelName(orgLevel)}
                      </Badge>
                    </TableCell>
                    <TableCell>{org.denomination || "-"}</TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell>{getOrgLeader(org.id)}</TableCell>
                    <TableCell>{getMemberCount(org.id)}</TableCell>
                    <TableCell>
                      {new Date(org.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Phase N4: Create Child Org (if depth allows) */}
                        {isWithinMaxDepth(orgLevel) && org.status === ORG_STATUS.APPROVED && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCreateChildParentOrg(org);
                              setCreateChildDialogOpen(true);
                            }}
                            title="Create Child Organization"
                          >
                            <Network className="h-4 w-4 mr-1" />
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportOrgMembers(org)}
                          disabled={exporting}
                          title="Export Members"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewingOrg(org);
                            setActiveDetailTab(DEFAULT_ORG_DETAIL_TAB);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
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
                              className="text-primary"
                              onClick={() => handleApproveOrg(org.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive"
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
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transfer Request Queue - Admin approves/denies transfer requests */}
      <TransferRequestQueue />

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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-org-name">Organization Name *</Label>
              <Input
                id="edit-org-name"
                placeholder="First Baptist Church of..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={ORGANIZATION_VALIDATION.NAME_MAX_LENGTH}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-denom">Denomination *</Label>
              <select
                id="edit-org-denom"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={formData.denomination}
                onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
              >
                <option value="">Select denomination...</option>
                {DENOMINATION_OPTIONS.map((denom) => (
                  <option key={denom} value={denom}>{denom}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-desc">Description</Label>
              <Textarea
                id="edit-org-desc"
                placeholder="Brief description of the organization..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
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
            <select
              id="leader-select"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring mt-2"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Choose a user...</option>
              {getAvailableUsers().map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || "Unnamed User"}
                  {user.organization_role === ORG_ROLES.leader ? " (Current Leader)" : ""}
                </option>
              ))}
            </select>
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

      {/* Phase N4: Create Child Org Dialog (Admin) */}
      {createChildParentOrg && (
        <CreateChildOrgDialog
          open={createChildDialogOpen}
          onOpenChange={(open) => {
            setCreateChildDialogOpen(open);
            if (!open) setCreateChildParentOrg(null);
          }}
          parentOrgId={createChildParentOrg.id}
          parentOrgName={createChildParentOrg.name}
          parentOrgLevel={(createChildParentOrg as any).org_level || 1}
          onCreated={fetchOrganizations}
        />
      )}
        </>
      )}
    </div>
  );
}
