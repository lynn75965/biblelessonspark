// OrgDetailView - Admin drill-down into organization details
// SSOT: Uses ORG_DETAIL_TABS from orgManagerConfig.ts

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";
import { Organization } from "@/constants/contracts";
import { OrgMemberManagement } from "@/components/org/OrgMemberManagement";
import { OrgLessonsPanel } from "@/components/org/OrgLessonsPanel";
import { OrgAnalyticsPanel } from "@/components/org/OrgAnalyticsPanel";
import { ROLES } from "@/constants/accessControl";
import { 
  ORG_DETAIL_TABS, 
  OrgDetailTabKey, 
  DEFAULT_ORG_DETAIL_TAB,
  getOrgDetailTabsArray 
} from "@/constants/orgManagerConfig";

interface OrgDetailViewProps {
  organization: Organization;
  activeTab: OrgDetailTabKey;
  onTabChange: (tab: OrgDetailTabKey) => void;
  onBack: () => void;
}

export function OrgDetailView({ 
  organization, 
  activeTab, 
  onTabChange, 
  onBack 
}: OrgDetailViewProps) {
  const tabs = getOrgDetailTabsArray();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
        <CardTitle className="flex items-center gap-2 mt-2">
          <Building2 className="h-5 w-5 text-primary" />
          {organization.name}
        </CardTitle>
        <CardDescription>
          {organization.denomination || "No denomination specified"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as OrgDetailTabKey)}>
          <TabsList className="grid w-full grid-cols-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value={ORG_DETAIL_TABS.details.value} className="mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <p className="text-sm">{organization.status}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{organization.description || "No description"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-sm">{new Date(organization.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value={ORG_DETAIL_TABS.members.value} className="mt-4">
            <OrgMemberManagement
              organizationId={organization.id}
              organizationName={organization.name}
              userRole={ROLES.platformAdmin}
            />
          </TabsContent>

          {/* Lessons Tab */}
          <TabsContent value={ORG_DETAIL_TABS.lessons.value} className="mt-4">
            <OrgLessonsPanel
              organizationId={organization.id}
              organizationName={organization.name}
            />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value={ORG_DETAIL_TABS.analytics.value} className="mt-4">
            <OrgAnalyticsPanel
              organizationId={organization.id}
              organizationName={organization.name}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
