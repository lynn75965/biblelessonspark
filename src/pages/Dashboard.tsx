import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { EnhanceLessonForm } from "@/components/dashboard/EnhanceLessonForm";
import { LessonLibrary } from "@/components/dashboard/LessonLibrary";
import { BetaFeedbackForm } from "@/components/feedback/BetaFeedbackForm";
import { BetaAnalyticsDashboard } from "@/components/analytics/BetaAnalyticsDashboard";
import { OrganizationSettingsModal } from "@/components/dashboard/OrganizationSettingsModal";
import { UserProfileModal } from "@/components/dashboard/UserProfileModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Sparkles, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Settings,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLessons } from "@/hooks/useLessons";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { useOrganization } from "@/hooks/useOrganization";
import { OrganizationSetup } from "@/components/organization/OrganizationSetup";

interface DashboardProps {
  organizationName?: string;
  setupComplete?: boolean;
}

export default function Dashboard({ 
  organizationName = "Demo Baptist Church",
  setupComplete = true
}: DashboardProps) {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [showOrgSettingsModal, setShowOrgSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState("enhance");
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAccess();
  const { lessons, loading: lessonsLoading } = useLessons();
  const { trackEvent, trackFeatureUsed, trackLessonViewed } = useAnalytics();
  const { organization, loading: orgLoading, hasOrganization } = useOrganization();

  // Calculate real stats from data
  const stats = {
    lessonsCreated: lessons.length,
    aiGenerations: lessons.length * 3, // Approximate based on lessons
    membersActive: 8, // This would come from members table
    setupProgress: 6
  };

  const handleCreateLesson = () => {
    trackFeatureUsed('create_lesson_clicked');
    setActiveTab("enhance");
  };

  const handleViewLesson = (lesson: any) => {
    trackLessonViewed(lesson.id);
    toast({
      title: "Opening lesson",
      description: `Opening "${lesson.title}" for viewing.`,
    });
  };

  const handleFeedback = () => {
    trackFeatureUsed('feedback_button_clicked');
    setShowFeedbackDialog(true);
  };

  const handleOrgSetupComplete = () => {
    // Organization setup completed, will automatically refresh organization data
  };

  const handleProfileUpdated = () => {
    // Force refresh of user data if needed
    window.location.reload();
  };

  // Get user's name from auth
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  
  // Get organization name - use actual organization data if available
  const currentOrgName = organization?.name || organizationName;

  // Show organization setup if user doesn't have an organization
  if (!orgLoading && !hasOrganization) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated organizationName="LessonSpark" />
        <OrganizationSetup 
          open={true} 
          onComplete={handleOrgSetupComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isAuthenticated 
        organizationName={currentOrgName}
      />

      <main className="container py-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back, <span className="gradient-text">{userName}!</span>
            </h1>
            <p className="text-muted-foreground">
              Bible Study Enhancement Platform for {currentOrgName}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.lessonsCreated}</p>
                  <p className="text-xs text-muted-foreground">Lessons Created</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-secondary">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.aiGenerations}</p>
                  <p className="text-xs text-muted-foreground">AI Enhancements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.membersActive}</p>
                  <p className="text-xs text-muted-foreground">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Private Beta</p>
                  <p className="text-xs text-muted-foreground">Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="enhance">
              <Sparkles className="h-4 w-4" />
              Enhance Lesson
            </TabsTrigger>
            <TabsTrigger value="library">
              <BookOpen className="h-4 w-4" />
              My Lessons
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="members">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="h-4 w-4" />
              Beta Analytics
            </TabsTrigger>
              </>
            )}
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="enhance" className="mt-6">
            <EnhanceLessonForm 
              organizationId={organization?.id || "demo-org-id"}
              defaultAgeGroup={organization?.default_age_group || "Adults"}
              defaultDoctrine={organization?.default_doctrine || "SBC"}
            />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <LessonLibrary 
              onCreateNew={handleCreateLesson}
              onViewLesson={handleViewLesson}
            />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="members" className="mt-6">
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Organization Members</CardTitle>
                    <CardDescription>
                      Manage teachers and administrators for {currentOrgName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Member Management Coming Soon</h3>
                      <p className="text-muted-foreground mb-4">
                        Invite teachers, manage roles, and view member activity.
                      </p>
                      <Button variant="outline">
                        Preview Member Features
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="mt-6">
                <BetaAnalyticsDashboard />
              </TabsContent>
            </>
          )}

          <TabsContent value="settings" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gradient-card">
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                  <CardDescription>
                    Configure default doctrine and age group preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Default Doctrine</span>
                      <Badge variant="outline">
                        {organization?.default_doctrine || "SBC"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Default Age Group</span>
                      <Badge variant="outline">{organization?.default_age_group || "Adults"}</Badge>
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
                  <CardTitle>User Profile</CardTitle>
                  <CardDescription>
                    Manage your account and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Role</span>
                      <Badge variant="outline">{isAdmin ? 'Administrator' : 'Teacher'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Organization</span>
                      <Badge variant="outline">{currentOrgName}</Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setShowProfileModal(true)}
                    >
                      Update Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Feedback Button */}
      <Button
        variant="hero"
        size="lg"
        className="fixed bottom-6 right-6 shadow-glow z-40"
        onClick={handleFeedback}
      >
        <MessageSquare className="h-4 w-4" />
        Give Feedback
      </Button>


      {/* Beta Feedback Dialog */}
      <BetaFeedbackForm 
        open={showFeedbackDialog} 
        onOpenChange={setShowFeedbackDialog}
      />

      {/* Organization Settings Modal */}
      <OrganizationSettingsModal
        open={showOrgSettingsModal}
        onOpenChange={setShowOrgSettingsModal}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
}