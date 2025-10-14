import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Sparkles, Shield, Clock, Heart, Brain, Target, FileText } from "lucide-react";
export function FeaturesSection() {
  const features = [{
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI-Powered Enhancement",
    description: "Generate age-appropriate activities, discussion questions, and modern applications with Baptist-aligned AI.",
    benefits: ["Custom activities", "Discussion prompts", "Modern applications"],
    category: "Core Feature"
  }, {
    icon: <Users className="h-6 w-6" />,
    title: "Multi-Age Support",
    description: "Tailored content for Children, Youth, Adults, and Seniors with appropriate language and concepts.",
    benefits: ["Age-specific tone", "Appropriate complexity", "Developmental focus"],
    category: "Flexibility"
  }, {
    icon: <BookOpen className="h-6 w-6" />,
    title: "Doctrinal Alignment",
    description: "Choose from SBC, Reformed Baptist, or Independent Baptist theological perspectives.",
    benefits: ["SBC alignment", "Reformed Baptist", "Independent Baptist"],
    category: "Theology"
  }, {
    icon: <Shield className="h-6 w-6" />,
    title: "Multi-Tenant Security",
    description: "Each church organization has secure, isolated access to their own lessons and data.",
    benefits: ["Data isolation", "Secure access", "Organization control"],
    category: "Security"
  }, {
    icon: <Clock className="h-6 w-6" />,
    title: "Time-Saving Workflow",
    description: "Transform hours of lesson prep into minutes while maintaining quality and biblical accuracy.",
    benefits: ["Quick generation", "Easy editing", "Print-ready format"],
    category: "Efficiency"
  }, {
    icon: <Heart className="h-6 w-6" />,
    title: "Baptist Heritage",
    description: "Built specifically for Baptist churches with understanding of our unique traditions and practices.",
    benefits: ["Baptist terminology", "Traditional practices", "Heritage respect"],
    category: "Cultural Fit"
  }, {
    icon: <Brain className="h-6 w-6" />,
    title: "Intelligent Prompts",
    description: "Discussion questions that encourage deep thinking and personal application of scripture.",
    benefits: ["Thought-provoking", "Personal application", "Group discussion"],
    category: "Pedagogy"
  }, {
    icon: <Target className="h-6 w-6" />,
    title: "Modern Applications",
    description: "Connect ancient truths to contemporary life with relevant, practical applications.",
    benefits: ["Current relevance", "Practical examples", "Life application"],
    category: "Relevance"
  }, {
    icon: <FileText className="h-6 w-6" />,
    title: "Export & Print",
    description: "Beautiful, print-ready lesson formats that work great on paper or digital devices.",
    benefits: ["PDF export", "Print optimized", "Digital friendly"],
    category: "Output"
  }];
  const getCategoryColor = (category: string) => {
    const colors = {
      "Core Feature": "bg-primary text-primary-foreground",
      "Flexibility": "bg-secondary text-secondary-foreground",
      "Theology": "bg-success text-success-foreground",
      "Security": "bg-warning text-warning-foreground",
      "Efficiency": "bg-purple-500 text-white",
      "Cultural Fit": "bg-pink-500 text-white",
      "Pedagogy": "bg-blue-500 text-white",
      "Relevance": "bg-green-500 text-white",
      "Output": "bg-orange-500 text-white"
    };
    return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground";
  };
  return <section className="section bg-muted/30">
      <div className="container">
        <div className="text-center space-y-4 mb-8">
          <Badge variant="outline" className="px-4 py-1">
            Features
          </Badge>
          <h2 className="text-3xl lg:text-4xl font-bold">
            Everything You Need for{" "}
            <span className="gradient-text">Exceptional Bible Studies</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">LessonSpark USA equips any teacher to make every lesson specifically applicable to the class, assuring Baptist theology honoring God's Word will engage 
every age group.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => <Card key={index} className="group hover:shadow-glow transition-all duration-normal border-border/50 hover:border-primary/20 bg-gradient-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary text-white group-hover:scale-110 transition-transform duration-normal">
                    {feature.icon}
                  </div>
                  <Badge className={getCategoryColor(feature.category)} variant="secondary">
                    {feature.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Key Benefits:</p>
                  <ul className="space-y-1">
                    {feature.benefits.map((benefit, idx) => <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-secondary" />
                        {benefit}
                      </li>)}
                  </ul>
                </div>
              </CardContent>
            </Card>)}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-8 space-y-4">
          <h3 className="text-2xl font-bold">Ready to Transform Your Lesson Prep?</h3>
          <p className="text-muted-foreground">
            Join the private beta and see how LessonSpark USA can revolutionize your Bible study preparation.
          </p>
        </div>
      </div>
    </section>;
}