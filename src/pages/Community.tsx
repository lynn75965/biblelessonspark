import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Mail, 
  Heart,
  MessageSquare,
  Share2,
  BookOpen,
  Church,
  Handshake,
  Sparkles,
  Globe,
  Calendar,
  ArrowRight
} from "lucide-react";
import { SITE } from "@/config/site";

const Community = () => {
  const communityValues = [
    {
      icon: Heart,
      title: "Faith-Centered",
      description: "United by our commitment to teaching God's Word faithfully and effectively to every generation."
    },
    {
      icon: Handshake,
      title: "Mutually Supportive",
      description: "We lift each other up, share resources, and encourage one another in the ministry of teaching."
    },
    {
      icon: BookOpen,
      title: "Biblically Grounded",
      description: "Everything we do is rooted in Scripture and aligned with historic Baptist convictions."
    },
    {
      icon: Sparkles,
      title: "Innovation-Embracing",
      description: "We leverage modern tools to enhance—never replace—the timeless truths of God's Word."
    }
  ];

  const connectionOpportunities = [
    {
      title: "Share Your Experience",
      description: "Tell us how LessonSpark has impacted your teaching ministry. Your story could encourage other teachers.",
      action: "Share Your Story",
      href: `mailto:${SITE.supportEmail}?subject=My LessonSpark Story`
    },
    {
      title: "Suggest Features",
      description: "Have an idea that would help Baptist teachers? We actively incorporate user feedback into our roadmap.",
      action: "Submit Idea",
      href: `mailto:${SITE.supportEmail}?subject=Feature Suggestion`
    },
    {
      title: "Report Issues",
      description: "Found a bug or theological concern? Help us maintain the highest standards of quality and accuracy.",
      action: "Report Issue",
      href: `mailto:${SITE.supportEmail}?subject=Issue Report`
    },
    {
      title: "Partner With Us",
      description: "Associations, seminaries, and church networks—let's discuss how we can serve your teachers together.",
      action: "Explore Partnership",
      href: `mailto:${SITE.supportEmail}?subject=Partnership Inquiry`
    }
  ];

  const upcomingFeatures = [
    {
      title: "Teacher Discussion Forum",
      description: "Connect with other Baptist teachers, share lesson ideas, and discuss teaching strategies.",
      status: "Planning"
    },
    {
      title: "Lesson Sharing",
      description: "Share your best lessons with other teachers in your association or network.",
      status: "In Development"
    },
    {
      title: "Church Groups",
      description: "Collaborate with teachers at your church and share organizational resources.",
      status: "Coming Soon"
    },
    {
      title: "Association Networks",
      description: "Connect with teachers across your Baptist association for regional collaboration.",
      status: "Future"
    }
  ];

  const impactStats = [
    { number: "5,400+", label: "Baptist Churches in Texas", icon: Church },
    { number: "47,000+", label: "SBC Churches Nationwide", icon: Globe },
    { number: "Millions", label: "Students Learning Weekly", icon: Users },
    { number: "1", label: "Shared Mission", icon: Heart }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container max-w-5xl py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Community</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join a growing community of Baptist teachers committed to excellence in Bible study preparation.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-5xl py-12 space-y-16 flex-1">
        {/* Our Vision */}
        <section className="text-center">
          <Badge variant="secondary" className="mb-4">Our Vision</Badge>
          <h2 className="text-2xl font-bold mb-4">Strengthening Baptist Teaching Together</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            LessonSpark USA exists to serve the thousands of volunteer Sunday School teachers, 
            small group leaders, and Bible study facilitators who faithfully prepare lessons 
            week after week. We believe that when teachers are equipped with excellent resources, 
            students encounter God's Word more deeply.
          </p>
        </section>

        {/* Impact Stats */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {impactStats.map((stat, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mx-auto mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold gradient-text">{stat.number}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Community Values */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Our Community Values</h2>
            <p className="text-muted-foreground mt-2">What brings us together as Baptist teachers</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {communityValues.map((value, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Ways to Connect */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Share2 className="h-6 w-6 text-primary" />
              Ways to Connect
            </h2>
            <p className="text-muted-foreground mt-2">Get involved and help shape the future of LessonSpark</p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {connectionOpportunities.map((opportunity, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                  <CardDescription>{opportunity.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full">
                    <a href={opportunity.href} className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4" />
                      {opportunity.action}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Upcoming Community Features */}
        <section>
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4">Roadmap</Badge>
            <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Community Features Coming
            </h2>
            <p className="text-muted-foreground mt-2">What we're building for Baptist teachers</p>
          </div>
          
          <div className="space-y-3">
            {upcomingFeatures.map((feature, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                    <Badge variant={
                      feature.status === "Coming Soon" ? "default" :
                      feature.status === "In Development" ? "secondary" :
                      "outline"
                    }>
                      {feature.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Beta Testers Call */}
        <section className="bg-muted rounded-lg p-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary mb-4">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">Join Our Beta Testing Community</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            As a beta tester, you get early access to new features, direct input on development priorities, 
            and the opportunity to shape how LessonSpark serves Baptist teachers everywhere.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/beta-signup" className="flex items-center gap-2">
                Apply for Beta Access
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/dashboard">Current User? Go to Dashboard</Link>
            </Button>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center pt-8 border-t">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
            <Heart className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">We'd Love to Hear From You</h2>
          <p className="text-muted-foreground mb-6">
            Questions, ideas, or just want to say hello? Reach out anytime.
          </p>
          <Button variant="outline" size="lg" asChild>
            <a href={`mailto:${SITE.supportEmail}`} className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {SITE.supportEmail}
            </a>
          </Button>
        </section>
      </div>

      {/* Footer - SSOT Component */}
      <Footer />
    </div>
  );
};

export default Community;
