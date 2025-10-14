import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, Home, LayoutDashboard } from "lucide-react";

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  optional?: boolean;
  hasVerify?: boolean;
}

const STEPS: ChecklistStep[] = [
  {
    id: "account",
    title: "Create your LessonSpark USA account",
    description: "Sign up and create your teacher profile",
  },
  {
    id: "email",
    title: "Verify your email",
    description: "Check your inbox and confirm your email address",
    hasVerify: true,
  },
  {
    id: "lens",
    title: "Choose your Theological Lens",
    description: "Select your preferred Baptist theological perspective",
  },
  {
    id: "plan",
    title: "Select your Subscription Plan",
    description: "Choose the plan that fits your ministry needs",
  },
  {
    id: "stripe",
    title: "Connect Stripe (auto-checked if live)",
    description: "Payment processing setup for subscriptions",
    hasVerify: true,
  },
  {
    id: "lesson",
    title: "Generate your first lesson",
    description: "Try creating an enhanced Bible study lesson",
  },
  {
    id: "dashboard",
    title: "Review your dashboard and credit balance",
    description: "Familiarize yourself with your workspace",
  },
  {
    id: "invite",
    title: "Invite another teacher (optional)",
    description: "Share LessonSpark with your ministry team",
    optional: true,
  },
  {
    id: "complete",
    title: "Mark Setup Complete",
    description: "You're ready to start enhancing lessons!",
  },
];

const STORAGE_KEY = "lessonspark_setup_checklist";

const SetupChecklist = () => {
  const [checkedSteps, setCheckedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCheckedSteps(new Set(parsed));
      } catch (e) {
        console.error("Failed to parse saved checklist", e);
      }
    }
  }, []);

  const toggleStep = (stepId: string) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const markAllComplete = () => {
    const allIds = STEPS.map((s) => s.id);
    setCheckedSteps(new Set(allIds));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
  };

  const completedCount = checkedSteps.size;
  const totalCount = STEPS.length;
  const progress = (completedCount / totalCount) * 100;
  const isComplete = completedCount === totalCount;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-16">
        {/* Header */}
        <div className="text-center space-y-6 mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>

          <div>
            <h1 className="text-4xl font-bold gradient-text mb-3">
              Interactive Setup Checklist
            </h1>
            <p className="text-lg text-muted-foreground">
              Follow these steps to get started with LessonSpark USA
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3 max-w-md mx-auto">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-foreground">Setup Progress</span>
              <span className="text-primary">
                {completedCount} of {totalCount} complete
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-gradient-primary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Checklist Steps */}
        <div className="space-y-4 mb-8">
          {STEPS.map((step) => {
            const isChecked = checkedSteps.has(step.id);
            return (
              <Card
                key={step.id}
                className={`border-2 transition-all duration-300 ${
                  isChecked
                    ? "border-success bg-success-light/30"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id={step.id}
                      checked={isChecked}
                      onCheckedChange={() => toggleStep(step.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={step.id}
                        className="block cursor-pointer"
                      >
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {step.title}
                          {step.optional && (
                            <span className="ml-2 text-sm text-muted-foreground font-normal">
                              (optional)
                            </span>
                          )}
                        </h3>
                        <p className="text-muted-foreground">
                          {step.description}
                        </p>
                      </label>
                    </div>
                    {step.hasVerify && !isChecked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStep(step.id)}
                        className="ml-4 whitespace-nowrap"
                      >
                        Verify
                      </Button>
                    )}
                    {isChecked && (
                      <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 ml-4" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Completion Message */}
        {isComplete && (
          <Card className="border-success bg-gradient-to-r from-success-light/50 to-primary-light/50 mb-8">
            <CardContent className="p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Setup Complete!
              </h3>
              <p className="text-muted-foreground">
                You're all set to start creating enhanced Baptist Bible study lessons.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild variant="outline" size="lg">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg">
            <Link to="/dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              View Dashboard
            </Link>
          </Button>

          {!isComplete && (
            <Button
              onClick={markAllComplete}
              size="lg"
              className="bg-gradient-primary hover:opacity-90"
            >
              Mark All Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupChecklist;
