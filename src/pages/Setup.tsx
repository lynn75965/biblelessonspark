import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Mail,
  CheckCircle,
  Circle,
  ArrowRight,
  User,
  Settings,
  Sparkles,
  Download,
  Clock,
  Lightbulb,
  Shield,
  Globe
} from "lucide-react";
import { SITE } from "@/config/site";
import { ROUTES } from "@/constants/routes";

const Setup = () => {
  const setupSteps = [
    {
      step: 1,
      title: "Create Your Account",
      description: "Sign up with your email address and verify your account.",
      details: [
        "Click 'Get Started' on the homepage",
        "Enter your email and create a secure password",
        "Check your inbox for the verification email",
        "Click the verification link to activate your account"
      ],
      icon: User,
      time: "2 minutes"
    },
    {
      step: 2,
      title: "Set Your Preferences",
      description: "Configure your default settings for lesson generation.",
      details: [
        "Select your preferred theological lens (SBC BF&M 2000/1963, Reformed Baptist, or Independent Baptist)",
        "Choose your default age group for lessons",
        "Set your preferred language (English, Spanish, or French)",
        "Optionally add your church/organization name"
      ],
      icon: Settings,
      time: "3 minutes"
    },
    {
      step: 3,
      title: "Explore the Dashboard",
      description: "Familiarize yourself with the main features.",
      details: [
        "View your credit balance in the top-right corner",
        "Access the 'Build Lesson' tab to create lessons",
        "Check 'My Lessons' to view saved lessons",
        "Visit 'Settings' to update preferences anytime"
      ],
      icon: BookOpen,
      time: "2 minutes"
    },
    {
      step: 4,
      title: "Generate Your First Lesson",
      description: "Create a complete Bible study lesson in about 76 seconds.",
      details: [
        "Enter a Bible passage (e.g., 'John 3:16-21') or topic",
        "Select the appropriate age group for your class",
        "Confirm your theological lens selection",
        "Click 'Generate Lesson' and wait for completion"
      ],
      icon: Sparkles,
      time: "2 minutes"
    },
    {
      step: 5,
      title: "Review and Export",
      description: "Review your lesson and download for teaching.",
      details: [
        "Read through all 8 sections of your generated lesson",
        "Make note of any personal illustrations to add",
        "Export as PDF for printing or DOCX for editing",
        "Print the Student Handout for your class members"
      ],
      icon: Download,
      time: "5 minutes"
    }
  ];

  const configurationOptions = [
    {
      title: "Theological Lens",
      description: "Choose the doctrinal framework that guides lesson content",
      options: [
        { name: "SBC (BF&M 2000)", desc: "Current Southern Baptist Convention statement" },
        { name: "SBC (BF&M 1963)", desc: "Previous SBC doctrinal statement" },
        { name: "Reformed Baptist", desc: "Emphasizes doctrines of grace, 1689 Confession" },
        { name: "Independent Baptist", desc: "Local church autonomy, traditional approach" }
      ]
    },
    {
      title: "Age Group Profiles",
      description: "Select your primary teaching audience",
      options: [
        { name: "Preschoolers (3-5)", desc: "Simple concepts, short attention spans" },
        { name: "Elementary (6-10)", desc: "Concrete thinking, interactive learning" },
        { name: "Youth (11-18)", desc: "Abstract reasoning, real-world application" },
        { name: "Adults (19+)", desc: "Deep study, discussion-focused" }
      ]
    },
    {
      title: "Language",
      description: "Set your preferred language for generated lessons",
      options: [
        { name: "English", desc: "Default language" },
        { name: "Spanish", desc: "Full lesson generation in Spanish" },
        { name: "French", desc: "Full lesson generation in French" }
      ]
    }
  ];

  const tips = [
    {
      icon: Lightbulb,
      title: "Start Simple",
      description: "Begin with a familiar passage to see how BibleLessonSpark enhances your existing knowledge."
    },
    {
      icon: Clock,
      title: "Plan Ahead",
      description: "Generate lessons earlier in the week to allow time for personal preparation and customization."
    },
    {
      icon: Shield,
      title: "Review Theology",
      description: "Always review generated content against Scripture. Report any concerns immediately."
    },
    {
      icon: Globe,
      title: "Try Different Ages",
      description: "Generate the same passage for different age groups to see how content adapts."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container max-w-5xl py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Setup Guide</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get started with BibleLessonSpark in just a few minutes. Follow this guide to set up your account and create your first lesson.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild variant="secondary" size="sm">
                <Link to="/">Back to Home</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/setup/checklist">Interactive Checklist</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-5xl py-12 space-y-16 flex-1">
        {/* Time Estimate */}
        <section className="text-center">
          <Badge variant="secondary" className="mb-4">
            <Clock className="h-3 w-3 mr-1" />
            Total Setup Time: ~15 minutes
          </Badge>
          <p className="text-muted-foreground">
            From account creation to your first printed lesson
          </p>
        </section>

        {/* Step-by-Step Guide */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center">Step-by-Step Setup</h2>
          
          <div className="space-y-6">
            {setupSteps.map((step, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  {/* Step Number & Icon */}
                  <div className="bg-primary/5 p-6 lg:w-48 flex flex-col items-center justify-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xl mb-2">
                      {step.step}
                    </div>
                    <step.icon className="h-6 w-6 text-primary mb-2" />
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {step.time}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 flex-1">
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild size="lg">
              <Link to="/auth" className="flex items-center gap-2">
                Start Setup Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Configuration Options */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center">Configuration Options</h2>
          
          <div className="space-y-8">
            {configurationOptions.map((config, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{config.title}</CardTitle>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {config.options.map((option, optIndex) => (
                      <div key={optIndex} className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                        <Circle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{option.name}</p>
                          <p className="text-xs text-muted-foreground">{option.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pro Tips */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-center flex items-center justify-center gap-2">
            <Lightbulb className="h-6 w-6 text-warning" />
            Pro Tips for New Users
          </h2>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {tips.map((tip, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                      <tip.icon className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{tip.title}</h3>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="bg-muted rounded-lg p-8">
          <h2 className="text-xl font-bold mb-6 text-center">Helpful Resources</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <Button asChild variant="outline" className="h-auto py-4">
              <Link to="/docs" className="flex flex-col items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <span>Full Documentation</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link to="/training" className="flex flex-col items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>Training Videos</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link to="/help" className="flex flex-col items-center gap-2">
                <Mail className="h-5 w-5" />
                <span>Get Help</span>
              </Link>
            </Button>
          </div>
        </section>

        {/* Contact Support */}
        <section className="text-center pt-8 border-t">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Need Setup Assistance?</h2>
          <p className="text-muted-foreground mb-6">
            Our team is happy to help you get started with BibleLessonSpark.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <a href={`mailto:${SITE.supportEmail}`} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Support
              </a>
            </Button>
            <Button asChild size="lg">
              <Link to={ROUTES.DASHBOARD}>Go to Dashboard</Link>
            </Button>
          </div>
        </section>
      </div>

      {/* Footer - SSOT Component */}
      <Footer />
    </div>
  );
};

export default Setup;

