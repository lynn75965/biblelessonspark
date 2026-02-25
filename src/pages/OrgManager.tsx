import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  ArrowLeft,
  Target,
  Layers,
  Network,
  Plus,
  Unlink
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useChildOrgSummaries } from "@/hooks/useChildOrgSummaries";
import { useFocusAdoptionMap } from "@/hooks/useFocusAdoptionMap";
import { OrgMemberManagement } from "@/components/org/OrgMemberManagement";
import { OrgLessonsPanel } from "@/components/org/OrgLessonsPanel";
import { OrgAnalyticsPanel } from "@/components/org/OrgAnalyticsPanel";
import { OrgSharedFocusPanel } from "@/components/org/OrgSharedFocusPanel";
import { OrgPoolStatusCard } from "@/components/org/OrgPoolStatusCard";
import { ChildOrgDashboard } from "@/components/org/ChildOrgDashboard";
import { CreateChildOrgDialog } from "@/components/org/CreateChildOrgDialog";
import { ParentFocusBanner } from "@/components/org/ParentFocusBanner";
import { DisconnectNetworkDialog } from "@/components/org/DisconnectNetworkDialog";
import { OrganizationSettingsModal } from "@/components/dashboard/OrganizationSettingsModal";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ORG_ROLES, ROLES, getEffectiveRole } from "@/constants/accessControl";
import { isWithinMaxDepth } from "@/constants/organizationConfig";
import { useDisconnectFromNetwork } from "@/hooks/useDisconnectFromNetwork";
import { useToast } from "@/hooks/use-toast";
import { ROUTES } from "@/constants/routes";

export default function OrgManager() {
  const { user } = useAuth();
  const { organization, userRole, loading: orgLoading, hasOrganization } = useOrganization();
  const { isAdmin } = useAdminAccess();
  const [activeTab, setActiveTab] = useState("members");
  const [showOrgSettingsModal, setShowOrgSettingsModal] = useState(false);
  const [showCreateChildDialog, setShowCreateChildDialog] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [focusRefreshKey, setFocusRefreshKey] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { disconnect, disconnecting } = useDisconnectFromNetwork();
  const [orgStats, setOrgStats] = useState({
    memberCount: 0,
    lessonCount: 0
  });

  // Phase N3: Fetch child org summaries for Network tab
  const {
    children: childOrgs,
    loading: childrenLoading,
    error: childrenError,
    hasChildren,
    refresh: refreshChildren
  } = useChildOrgSummaries(organization?.id);

  // Get effective frontend role for SSOT permission checks
  const effectiveRole = getEffectiveRole(isAdmin, hasOrganization, userRole);
  const hasAccess = effectiveRole === ROLES.platformAdmin || effectiveRole === ROLES.orgLeader;

  // Phase N4: Can this org create children? (level < maxDepth)
  const currentOrgLevel = (organization as any)?.org_level ?? 1;
  const canCreateChild = hasAccess && isWithinMaxDepth(currentOrgLevel);

  // Phase N6: Detect if this org is a child (has parent_org_id)
  const parentOrgId = (organization as any)?.parent_org_id as string | null;
  const isChildOrg = !!parentOrgId;

  // Phase N6: Focus adoption map for Network tab (parent sees adoption status)
  const {
    adoptionMap,
    hasActiveFocus: parentHasActiveFocus,
    adoptedCount,
    totalChildren: adoptionTotalChildren,
    refresh: refreshAdoptions
  } = useFocusAdoptionMap(organization?.id);

  // Phase N6: Enrich children with adoption data for ChildOrgCard badges
  const enrichedChildren = useMemo(() => {
    if (!parentHasActiveFocus) return childOrgs;
    return childOrgs.map(child => ({
      ...child,
      has_adopted_focus: adoptionMap[child.org_id] ?? false
    }));
  }, [childOrgs, adoptionMap, parentHasActiveFocus]);

  // Fetch org stats
  useEffect(() => {
    const fetchOrgStats = async () => {
      if (!organization?.id) return;

      try {
        // Count org members
        const { count: memberCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organization.id);

        // Count org lessons (by member user_ids for accuracy)
        const { data: members } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', organization.id);
        
        const memberIds = members?.map(m => m.id) || [];
        let lessonCount = 0;
        if (memberIds.length > 0) {
          const { count } = await supabase
            .from('lessons')
            .select('*', { count: 'exact', head: true })
            .in('user_id', memberIds);
          lessonCount = count || 0;
        }

        setOrgStats({
          memberCount: memberCount || 0,
          lessonCount: lessonCount
        });
      } catch (error) {
        console.error('Error fetching org stats:', error);
      }
    };

    fetchOrgStats();
  }, [organization?.id]);

  // Redirect if no org access
  if (!orgLoading && !hasAccess) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Redirect if no organization
  if (!orgLoading && !hasOrganization && !isAdmin) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading organization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated organizationName={organization?.name} />

      <main className="container py-4 sm:py-6 px-4 sm:px-6 flex-1">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <Link to={ROUTES.DASHBOARD}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workspace
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  <span className="gradient-text">Organization Manager</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  {organization?.name || "No organization"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Badge variant="outline" className="text-sm">
              {isAdmin ? 'Manager' : 'Organization Manager'}
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="bg-gradient-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-primary shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{orgStats.memberCount}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Organization Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-secondary shrink-0">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">{orgStats.lessonCount}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Organization Lessons</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-success shrink-0">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold truncate">Active</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Organization Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto bg-muted p-1 rounded-lg mb-2">
            <TabsTrigger value="members" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Members</span>
            </TabsTrigger>
            <TabsTrigger value="pool" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Layers className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Lesson Pool</span>
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Target className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Shared Focus</span>
            </TabsTrigger>
            <TabsTrigger value="lessons" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <BookOpen className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Org Lessons</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <BarChart3 className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            {/* Phase N3/N4: Network tab -- visible when org has children OR can create them */}
            {(hasChildren || canCreateChild) && (
              <TabsTrigger value="network" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
                <Network className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Network</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="settings" className="flex-1 min-w-fit flex items-center justify-center gap-1 px-2 sm:px-3 whitespace-nowrap">
              <Settings className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-6">
            {organization?.id ? (
              <OrgMemberManagement
                organizationId={organization.id}
                organizationName={organization.name || "Organization"}
                userRole={effectiveRole}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No organization found.
              </div>
            )}
          </TabsContent>

          {/* Lesson Pool Tab - Phase 13.7 */}
          <TabsContent value="pool" className="mt-6">
            {organization?.id ? (
              <OrgPoolStatusCard
                organizationId={organization.id}
                organizationName={organization.name || "Organization"}
                showPurchaseOptions={true}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No organization found.
              </div>
            )}
          </TabsContent>

          {/* Shared Focus Tab -- Phase N6: ParentFocusBanner added for child orgs */}
          <TabsContent value="focus" className="mt-6">
            {/* Phase N6: Parent Focus Banner -- visible only for child orgs with parent focus */}
            {organization?.id && isChildOrg && (
              <ParentFocusBanner
                childOrgId={organization.id}
                onAdopted={() => setFocusRefreshKey(k => k + 1)}
              />
            )}
            {organization?.id ? (
              <OrgSharedFocusPanel
                key={focusRefreshKey}
                organizationId={organization.id}
                organizationName={organization.name || "Organization"}
                canEdit={effectiveRole === ROLES.platformAdmin || effectiveRole === ROLES.orgLeader}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No organization found.
              </div>
            )}
          </TabsContent>

          {/* Org Lessons Tab */}
          <TabsContent value="lessons" className="mt-6">
            {organization?.id ? (
              <OrgLessonsPanel
                organizationId={organization.id}
                organizationName={organization.name || "Organization"}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No organization found.
              </div>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            {organization?.id ? (
              <OrgAnalyticsPanel
                organizationId={organization.id}
                organizationName={organization.name || "Organization"}
                betaMode={organization.beta_mode}
                betaStartDate={organization.beta_start_date}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No organization found.
              </div>
            )}
          </TabsContent>

          {/* Phase N3/N4/N6: Network Tab -- Child Org Dashboard + Adoption Status */}
          {(hasChildren || canCreateChild) && (
            <TabsContent value="network" className="mt-6">
              {/* Phase N6: Focus adoption summary -- visible when parent has active focus */}
              {parentHasActiveFocus && enrichedChildren.length > 0 && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
                  <Target className="h-4 w-4 shrink-0" />
                  <span>
                    Shared Focus Adoption:{' '}
                    <strong className="text-foreground">{adoptedCount}</strong> of{' '}
                    {adoptionTotalChildren} organizations
                  </span>
                </div>
              )}
              <ChildOrgDashboard
                children={enrichedChildren}
                loading={childrenLoading}
                error={childrenError}
                organizationName={organization?.name || "Organization"}
                onRefresh={() => { refreshChildren(); refreshAdoptions(); }}
              />
              {/* Phase N4: Create Child Org button */}
              {canCreateChild && organization?.id && (
                <div className="mt-4">
                  <Button
                    onClick={() => setShowCreateChildDialog(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Child Organization
                  </Button>
                </div>
              )}
            </TabsContent>
          )}

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>
                    Configure default doctrine and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Organization Name</span>
                      <Badge variant="outline">{organization?.name}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Denomination</span>
                      <Badge variant="outline">{organization?.denomination || "Not set"}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Default Doctrine</span>
                      <Badge variant="outline">{organization?.default_doctrine || "SBC"}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowOrgSettingsModal(true)}
                    >
                      Modify Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>Member Management</CardTitle>
                  <CardDescription>
                    Add teachers to your organization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-4">
                    Use the <strong>Members</strong> tab to invite new members or add existing users to your organization.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Phase N7: Disconnect from Network -- visible only for child orgs */}
            {isChildOrg && (
              <Card className="mt-6 border-destructive/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Unlink className="h-5 w-5" />
                    Network Connection
                  </CardTitle>
                  <CardDescription>
                    This organization is connected to a parent network. Disconnecting will make it independent while preserving all data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDisconnectDialog(true)}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect from Network
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <OrganizationSettingsModal
        open={showOrgSettingsModal}
        onOpenChange={setShowOrgSettingsModal}
      />

      {/* Phase N4: Create Child Org Dialog */}
      {organization?.id && (
        <CreateChildOrgDialog
          open={showCreateChildDialog}
          onOpenChange={setShowCreateChildDialog}
          parentOrgId={organization.id}
          parentOrgName={organization.name || "Organization"}
          parentOrgLevel={currentOrgLevel}
          onCreated={refreshChildren}
        />
      )}

      {/* Phase N7: Disconnect from Network Dialog */}
      {isChildOrg && organization?.id && (
        <DisconnectNetworkDialog
          open={showDisconnectDialog}
          onOpenChange={setShowDisconnectDialog}
          orgName={organization.name || "Organization"}
          parentOrgName="the parent network"
          initiator="child"
          loading={disconnecting}
          onConfirm={async () => {
            const result = await disconnect(organization.id);
            if (result?.success) {
              toast({
                title: "Disconnected",
                description: result.message
              });
              setShowDisconnectDialog(false);
              // Refresh the page to reflect new independent status
              navigate(0);
            } else {
              toast({
                title: "Error",
                description: "Could not disconnect. Please try again.",
                variant: "destructive"
              });
            }
          }}
        />
      )}
    </div>
  );
}

