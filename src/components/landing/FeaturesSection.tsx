/**
 * FeaturesSection Component
 * Landing page features showcase
 * 
 * SSOT Compliance (December 2025):
 * - Doctrinal Alignment card dynamically pulls from theologyProfiles.ts
 * - Shows all 10 Baptist theology profiles with tap/click popovers
 * - Uses Popover (not Tooltip) for mobile compatibility
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sparkles, Users, BookOpen, Clock } from "lucide-react";
import { getTheologyProfileOptions } from "@/constants/theologyProfiles";

export function FeaturesSection() {
  // SSOT: Get all theology profiles dynamically
  const theologyProfiles = getTheologyProfileOptions();

  const features = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      title: "Smart Enhancement",
      description: "Generate age-appropriate activities, discussion questions, and modern applications with Baptist-aligned content.",
      benefits: ["Custom activities", "Discussion prompts", "Modern applications"],
      gradient: "bg-gradient-primary"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Multi-Age Support",
      description: "Tailored content for Children, Youth, Adults, and Seniors with appropriate language and concepts.",
      benefits: ["Age-specific tone", "Appropriate complexity", "Developmental focus"],
      gradient: "bg-gradient-secondary"
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Doctrinal Alignment",
      description: `Choose from ${theologyProfiles.length} Baptist theological perspectives, each with specific guardrails to ensure doctrinally appropriate content.`,
      benefits: [], // Rendered separately with tooltips
      gradient: "bg-gradient-primary",
      isTheology: true
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Time-Saving Workflow",
      description: "Transform hours of lesson prep into minutes while maintaining quality and biblical accuracy.",
      benefits: ["Under 3 minutes", "Print-ready format", "Easy editing"],
      gradient: "bg-gradient-secondary"
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-10">
          <Badge variant="outline" className="px-3 py-1 text-xs sm:text-sm">
            Features
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-2">
            Everything You Need for{" "}
            <span className="gradient-text">Exceptional Bible Studies</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            BibleLessonSpark equips any teacher to make every lesson specifically applicable to the class, 
            honoring God's Word and engaging every age group.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/20 bg-gradient-card"
            >
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-lg ${feature.gradient} text-white group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                    {feature.icon}
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base sm:text-lg mb-1">{feature.title}</CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                      {feature.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-2 sm:pt-3">
                {feature.isTheology ? (
                  // SSOT: Theology profiles with tap/click popovers (works on mobile)
                  <ul className="flex flex-wrap gap-2">
                    {theologyProfiles.map((profile) => (
                      <Popover key={profile.id}>
                        <PopoverTrigger asChild>
                          <li 
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                            <span>{profile.shortName}</span>
                          </li>
                        </PopoverTrigger>
                        <PopoverContent 
                          side="top" 
                          className="w-72 sm:w-80 p-3"
                          align="center"
                        >
                          <p className="font-semibold text-sm mb-1.5">{profile.name}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{profile.summary}</p>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </ul>
                ) : (
                  // Standard benefits list
                  <ul className="flex flex-wrap gap-2">
                    {feature.benefits.map((benefit, idx) => (
                      <li 
                        key={idx} 
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
