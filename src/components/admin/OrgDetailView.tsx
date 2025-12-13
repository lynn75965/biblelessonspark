// OrgDetailView - Admin drill-down into organization details
// SSOT: Uses ORG_DETAIL_TABS from orgManagerConfig.ts

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Rocket, Power } from "lucide-react";
import { Organization } from "@/constants/contracts";
import { OrgMemberManagement } from "@/components/org/OrgMemberManagement";
import { OrgLessonsPanel } from "@/components/org/OrgLessonsPanel";
import { OrgAnalyticsPanel } from "@/components/org/OrgAnalyticsPanel";
import { ROLES } from "@/constants/accessControl";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  ORG_DETAIL_TABS,
  OrgDetailTabKey,
  getOrgDetailTabsArray
} from "@/constants/orgManagerConfig";

interface OrgDetailViewProps {
  organization: Organization;
  activeTab: OrgDetailTabKey;
  onTabChange: (tab: OrgDetailTabKey) => void;
  onBack: () => void;
  onOrganizationUpdate?: (org: Organization) => void;
}

export function OrgDetailView({
  organization,
  activeTab,
  onTabChange,
  onBack,
  onOrganizationUpdate
}: OrgDetailViewProps) {
  const tabs = getOrgDetailTabsArray();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBetaToggle = async () => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const newBetaMode = !organization.beta_mode;
      
      const updateData: Record<string, any> = {
        beta_mode: newBetaMode,
      };

      if (newBetaMode) {
        // Enabling beta
        updateData.beta_start_date = new Date().toISOString();
        updateData.beta_activated_by = user.id;
        updateData.beta_end_date = null;
      } else {
        // Disabling beta
        updateData.beta_end_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('organizations')
        .update(updateData)
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: newBetaMode ? "Beta Mode Enabled" : "Beta Mode Disabled",
        description: newBetaMode 
          ? `${organization.name} is now in beta mode. New members will be marked as beta testers.`
          : `${organization.name} beta period has ended.`,
      });

      // Update parent state
      if (onOrganizationUpdate) {
        onOrganizationUpdate({
          ...organization,
          ...updateData
        });
      }
    } catch (error) {
      console.error('Error toggling beta mode:', error);
      toast({
        title: "Error",
        description: "Failed to update beta mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {organization.name}
          </CardTitle>
          {organization.beta_mode && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <Rocket className="h-3 w-3 mr-1" />
              Beta Mode
            </Badge>
          )}
        </div>
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
            <div className="space-y-6">
              {/* Organization Info */}
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

              {/* Beta Mode Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Organization Beta Program
                </h3>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Beta Mode</p>
                      <p className="text-sm text-muted-foreground">
                        {organization.beta_mode 
                          ? "New members joining will be marked as beta testers"
                          : "Enable to start an organization beta program"}
                      </p>
                    </div>
                    <Badge variant={organization.beta_mode ? "default" : "outline"}>
                      {organization.beta_mode ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {organization.beta_mode && organization.beta_start_date && (
                    <div className="text-sm text-muted-foreground">
                      Started: {new Date(organization.beta_start_date).toLocaleDateString()}
                    </div>
                  )}

                  {!organization.beta_mode && organization.beta_end_date && (
                    <div className="text-sm text-muted-foreground">
                      Ended: {new Date(organization.beta_end_date).toLocaleDateString()}
                    </div>
                  )}

                  <Button
                    onClick={handleBetaToggle}
                    disabled={isUpdating}
                    variant={organization.beta_mode ? "destructive" : "default"}
                    className="w-full sm:w-auto"
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {isUpdating 
                      ? "Updating..." 
                      : organization.beta_mode 
                        ? "End Beta Mode" 
                        : "Enable Beta Mode"}
                  </Button>
                </div>
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
              betaMode={organization.beta_mode}
              betaStartDate={organization.beta_start_date}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

