import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { EnhanceLessonForm } from "@/components/dashboard/EnhanceLessonForm";
import { LessonLibrary } from "@/components/dashboard/LessonLibrary";
import { SetupChecklist } from "@/components/setup/SetupChecklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  BookOpen, 
  Sparkles, 
  Users, 
  BarChart3, 
  MessageSquare, 
  Settings,
  CheckCircle2,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardProps {
  organizationName?: string;
  userRole?: 'admin' | 'teacher';
  setupComplete?: boolean;
}

export default function Dashboard({ 
  organizationName = "Demo Baptist Church",
  userRole = "admin",
  setupComplete = false
}: DashboardProps) {
  const [showSetupDialog, setShowSetupDialog] = useState(!setupComplete);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("enhance");
  const { toast } = useToast();

  // Mock data - replace with actual API calls
  const stats = {
    lessonsCreated: 12,
    aiGenerations: 47,
    membersActive: 8,
    setupProgress: 6
  };

  const handleCreateLesson = () => {
    setActiveTab("enhance");
  };

  const handleViewLesson = (lesson: any) => {
    toast({
      title: "Opening lesson",
      description: `Opening "${lesson.title}" for viewing.`,
    });
  };

  const handleFeedback = () => {
    setShowFeedbackDialog(true);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Feedback submitted!",
      description: "Thank you for helping us improve LessonSpark.",
    });
    setShowFeedbackDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isAuthenticated 
        organizationName={organizationName}
      />

      <main className="container py-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome to <span className="gradient-text">LessonSpark</span>
            </h1>
            <p className="text-muted-foreground">
              Baptist Bible Study Enhancement Platform for {organizationName}
            </p>
          </div>
          
          {/* Setup Status */}
          {!setupComplete && (
            <Button 
              variant="warning" 
              onClick={() => setShowSetupDialog(true)}
            >
              <AlertTriangle className="h-4 w-4" />
              Complete Setup ({stats.setupProgress}/9)
            </Button>
          )}
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
            {userRole === 'admin' && (
              <>
                <TabsTrigger value="members">
                  <Users className="h-4 w-4" />
                  Members
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
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
              organizationId="demo-org-id"
              defaultAgeGroup="Adults"
              defaultDoctrine="SBC"
            />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <LessonLibrary 
              onCreateNew={handleCreateLesson}
              onViewLesson={handleViewLesson}
            />
          </TabsContent>

          {userRole === 'admin' && (
            <>
              <TabsContent value="members" className="mt-6">
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Organization Members</CardTitle>
                    <CardDescription>
                      Manage teachers and administrators for {organizationName}
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
                <Card className="bg-gradient-card">
                  <CardHeader>
                    <CardTitle>Usage Analytics</CardTitle>
                    <CardDescription>
                      Track lesson creation, AI usage, and member engagement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Analytics Dashboard Coming Soon</h3>
                      <p className="text-muted-foreground mb-4">
                        View detailed insights about lesson creation and member activity.
                      </p>
                      <Button variant="outline">
                        Preview Analytics Features
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                      <Badge variant="outline">Southern Baptist Convention</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Default Age Group</span>
                      <Badge variant="outline">Adults</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
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
                      <Badge variant="outline">{userRole === 'admin' ? 'Administrator' : 'Teacher'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Organization</span>
                      <Badge variant="outline">{organizationName}</Badge>
                    </div>
                    <Button variant="outline" className="w-full">
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

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your LessonSpark Setup</DialogTitle>
            <DialogDescription>
              Follow these steps to get your Baptist Bible study platform ready
            </DialogDescription>
          </DialogHeader>
          <SetupChecklist isModal onClose={() => setShowSetupDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Feedback</DialogTitle>
            <DialogDescription>
              Help us improve LessonSpark for Baptist teachers everywhere
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitFeedback} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">What's working well?</label>
              <textarea 
                className="w-full min-h-[80px] p-3 border rounded text-sm"
                placeholder="Tell us what you love about LessonSpark..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">What could be improved?</label>
              <textarea 
                className="w-full min-h-[80px] p-3 border rounded text-sm"
                placeholder="Suggestions for making LessonSpark even better..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowFeedbackDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" variant="hero" className="flex-1">
                Submit Feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}