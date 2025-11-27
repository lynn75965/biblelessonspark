import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Mail, 
  PlayCircle,
  BookOpen,
  Clock,
  CheckCircle,
  Sparkles,
  Users,
  FileText,
  Lightbulb,
  Target,
  ArrowRight
} from "lucide-react";
import { SITE } from "@/config/site";

const Training = () => {
  const quickStartSteps = [
    {
      step: 1,
      title: "Sign In to Your Dashboard",
      description: "Access your account at lessonsparkusa.com and navigate to the Dashboard. Your credits and recent lessons will be displayed.",
      time: "1 minute"
    },
    {
      step: 2,
      title: "Enter Your Bible Passage",
      description: "Type a Scripture reference (e.g., 'John 3:16-21') or a topic (e.g., 'The Parable of the Good Samaritan'). Be specific for best results.",
      time: "30 seconds"
    },
    {
      step: 3,
      title: "Select Your Age Group",
      description: "Choose from 11 age-specific profiles, from Preschoolers to Senior Adults. Each profile adjusts vocabulary, activities, and complexity.",
      time: "10 seconds"
    },
    {
      step: 4,
      title: "Choose Your Theological Lens",
      description: "Select SBC (BF&M 2000 or 1963), Reformed Baptist, or Independent Baptist. This ensures doctrinal alignment with your church tradition.",
      time: "10 seconds"
    },
    {
      step: 5,
      title: "Generate and Review",
      description: "Click 'Generate Lesson' and wait approximately 76 seconds. Review the 8-section lesson plan, then export as PDF or Word document.",
      time: "2 minutes"
    }
  ];

  const tutorials = [
    {
      title: "Creating Your First Lesson",
      description: "A complete walkthrough of generating a lesson from scratch, including tips for best results.",
      duration: "5 min read",
      level: "Beginner",
      icon: Sparkles
    },
    {
      title: "Understanding Age Group Profiles",
      description: "Learn how each age group profile adapts content, vocabulary, and activities for maximum engagement.",
      duration: "7 min read",
      level: "Beginner",
      icon: Users
    },
    {
      title: "Using the 8-Section Format",
      description: "Deep dive into each lesson section and how to use them effectively in your teaching.",
      duration: "10 min read",
      level: "Intermediate",
      icon: FileText
    },
    {
      title: "Uploading Your Own Curriculum",
      description: "How to enhance existing curriculum materials with AI-powered insights and activities.",
      duration: "6 min read",
      level: "Intermediate",
      icon: BookOpen
    },
    {
      title: "Theological Lens Deep Dive",
      description: "Understanding how each theological tradition shapes lesson content and applications.",
      duration: "8 min read",
      level: "Advanced",
      icon: Target
    },
    {
      title: "Tips for Volunteer Teachers",
      description: "Practical advice for busy volunteers preparing lessons with limited time.",
      duration: "5 min read",
      level: "All Levels",
      icon: Lightbulb
    }
  ];

  const bestPractices = [
    {
      title: "Be Specific with Scripture",
      description: "Instead of 'Psalms', try 'Psalm 23:1-6'. Specific passages produce more focused, actionable lessons."
    },
    {
      title: "Match Age to Audience",
      description: "A mixed adult class? Try 'Mid-Life Adults' as a balanced starting point. Adjust based on your specific group dynamics."
    },
    {
      title: "Review Before You Teach",
      description: "Always read through the entire lesson beforehand. Add personal illustrations and adjust activities to fit your space and time."
    },
    {
      title: "Use the Student Handout",
      description: "The printable handout reinforces learning. Print copies for your class or email it ahead for preparation."
    },
    {
      title: "Save Lessons to Your Library",
      description: "Generated lessons are automatically saved. Build a library of resources you can reuse and adapt for future classes."
    },
    {
      title: "Provide Feedback",
      description: "Use the feedback button to help us improve. Your insights shape the future of LessonSpark for all Baptist teachers."
    }
  ];

  const videoPlaceholders = [
    {
      title: "Platform Overview",
      description: "A 3-minute tour of LessonSpark USA features and navigation.",
      thumbnail: "overview"
    },
    {
      title: "Generating Your First Lesson",
      description: "Watch a complete lesson being created from start to finish.",
      thumbnail: "generate"
    },
    {
      title: "Customization Options",
      description: "Learn about teacher notes, student teasers, and advanced settings.",
      thumbnail: "customize"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container max-w-5xl py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Training Resources</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to master LessonSpark USA and create impactful Bible study lessons for your class.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-5xl py-12 space-y-16 flex-1">
        {/* Quick Start Guide */}
        <section>
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4">5-Minute Quick Start</Badge>
            <h2 className="text-2xl font-bold">Get Started in 5 Steps</h2>
            <p className="text-muted-foreground mt-2">From sign-in to printed lesson in under 5 minutes</p>
          </div>
          
          <div className="space-y-4">
            {quickStartSteps.map((step, index) => (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-primary" />
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                      <Clock className="h-4 w-4" />
                      {step.time}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg">
              <Link to="/dashboard" className="flex items-center gap-2">
                Start Creating Lessons
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Video Tutorials */}
        <section>
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4">Coming Soon</Badge>
            <h2 className="text-2xl font-bold">Video Tutorials</h2>
            <p className="text-muted-foreground mt-2">Visual guides to help you get the most from LessonSpark</p>
          </div>
          
          <div className="grid sm:grid-cols-3 gap-6">
            {videoPlaceholders.map((video, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <PlayCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Coming Soon</span>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-base">{video.title}</CardTitle>
                  <CardDescription>{video.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Written Tutorials */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Written Guides</h2>
            <p className="text-muted-foreground mt-2">In-depth tutorials for every skill level</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tutorials.map((tutorial, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <tutorial.icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant={
                      tutorial.level === "Beginner" ? "secondary" :
                      tutorial.level === "Intermediate" ? "outline" :
                      tutorial.level === "Advanced" ? "default" : "secondary"
                    }>
                      {tutorial.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{tutorial.title}</CardTitle>
                  <CardDescription>{tutorial.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tutorial.duration}
                    </span>
                    <Button asChild variant="link" className="px-0">
                      <Link to="/docs">Read Guide ?</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Best Practices */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Lightbulb className="h-6 w-6 text-warning" />
              Best Practices
            </h2>
            <p className="text-muted-foreground mt-2">Tips from experienced Baptist teachers</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {bestPractices.map((practice, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{practice.title}</h3>
                      <p className="text-sm text-muted-foreground">{practice.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="text-center pt-8 border-t">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
            <GraduationCap className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Need Personal Training?</h2>
          <p className="text-muted-foreground mb-6">
            Contact us for one-on-one assistance or group training sessions for your church.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <a href={`mailto:${SITE.supportEmail}`} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Request Training
              </a>
            </Button>
            <Button asChild size="lg">
              <Link to="/docs">View Documentation</Link>
            </Button>
          </div>
        </section>
      </div>

      {/* Footer - SSOT Component */}
      <Footer />
    </div>
  );
};

export default Training;
