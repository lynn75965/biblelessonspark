import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, MessageSquare, TrendingUp, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FeedbackQuestionsManager } from "@/components/admin/FeedbackQuestionsManager";

interface BetaTester {
  id: string;
  name: string;
  email: string;
  church_name: string;
  age_group_taught: string;
  status: string;
  lessons_generated: number;
  signed_up_at: string;
  last_lesson_at: string | null;
}

interface Feedback {
  id: string;
  rating: number;
  category: string;
  feedback_text: string;
  submitted_at: string;
  allow_followup: boolean;
}

const AdminBetaMetrics = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [testers, setTesters] = useState<BetaTester[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if user is Lynn (admin)
      if (!user || user.id !== "b8708e6b-eeef-4ff5-9f0b-57d808ef8762") {
        toast({
          title: "Access Denied",
          description: "This page is only accessible to administrators.",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setAuthorized(true);
      await loadData();
    } catch (error) {
      console.error("Authorization error:", error);
      navigate("/dashboard");
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load beta testers
      const { data: testersData, error: testersError } = await supabase
        .from("beta_testers")
        .select("*")
        .order("signed_up_at", { ascending: false });

      if (testersError) throw testersError;
      setTesters(testersData || []);

      // Load feedback
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("beta_feedback")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (feedbackError) throw feedbackError;
      setFeedback(feedbackData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error Loading Data",
        description: "Could not load beta metrics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!authorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const activeTesters = testers.filter((t) => t.status === "active").length;
  const totalLessons = testers.reduce((sum, t) => sum + (t.lessons_generated || 0), 0);
  const avgRating = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : "N/A";
  const followupCount = feedback.filter((f) => f.allow_followup).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900">Beta Testing Metrics</h1>
          <p className="text-gray-600 mt-2">LessonSparkUSA Beta Program Dashboard</p>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Beta Testers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{testers.length}</div>
              <p className="text-xs text-gray-600 mt-1">{activeTesters} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Lessons Generated</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalLessons}</div>
              <p className="text-xs text-gray-600 mt-1">
                {testers.length > 0 ? (totalLessons / testers.length).toFixed(1) : 0} per tester
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{avgRating}</div>
              <p className="text-xs text-gray-600 mt-1">out of 5 stars</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Feedback Received</CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{feedback.length}</div>
              <p className="text-xs text-gray-600 mt-1">{followupCount} want follow-up</p>
            </CardContent>
          </Card>
        </div>

        {/* Beta Testers Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Beta Testers</CardTitle>
            <CardDescription>All registered beta testers and their activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Church</th>
                    <th className="pb-3 font-medium">Age Group</th>
                    <th className="pb-3 font-medium">Lessons</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {testers.map((tester) => (
                    <tr key={tester.id} className="border-b">
                      <td className="py-3">{tester.name}</td>
                      <td className="py-3">
                        <a href={`mailto:${tester.email}`} className="text-blue-600 hover:underline">
                          {tester.email}
                        </a>
                      </td>
                      <td className="py-3">{tester.church_name}</td>
                      <td className="py-3 capitalize">{tester.age_group_taught}</td>
                      <td className="py-3 text-center">{tester.lessons_generated || 0}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            tester.status === "active"
                              ? "bg-green-100 text-green-800"
                              : tester.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tester.status}
                        </span>
                      </td>
                      <td className="py-3">
                        {new Date(tester.signed_up_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest feedback from beta testers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedback.map((item) => (
                <div key={item.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= item.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          item.category === "bug_report"
                            ? "bg-red-100 text-red-800"
                            : item.category === "feature_request"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.category.replace("_", " ")}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(item.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-700">{item.feedback_text}</p>
                  {item.allow_followup && (
                    <p className="text-xs text-green-600 mt-2">? Open to follow-up</p>
                  )}
                </div>
              ))}
              {feedback.length === 0 && (
                <p className="text-gray-500 text-center py-4">No feedback received yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Feedback Questions Manager */}
        <FeedbackQuestionsManager />
      </div>
    </div>
  );
};

export default AdminBetaMetrics;


