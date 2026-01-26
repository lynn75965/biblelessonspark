/**
 * FeaturesSection Component
 * Landing page features showcase
 * 
 * SSOT Compliance (January 2026):
 * - Doctrinal Alignment card dynamically pulls from theologyProfiles.ts
 * - Multi-Age Support card dynamically pulls from ageGroups.ts
 * - Personalized card pulls from teacherPreferences.ts, bibleVersions.ts, lessonStructure.ts
 * - All items have HOVER-activated descriptions (HoverCard)
 * - Founder quote banner replaces stats banner
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Sparkles, Users, BookOpen, Settings2 } from "lucide-react";
import { getTheologyProfileOptions } from "@/constants/theologyProfiles";
import { AGE_GROUPS } from "@/constants/ageGroups";
import { BIBLE_VERSIONS } from "@/constants/bibleVersions";
import { LESSON_SECTIONS, getRequiredSections } from "@/constants/lessonStructure";
import { 
  TEACHING_STYLES, 
  LESSON_LENGTHS, 
  GROUP_SIZES,
  LEARNING_ENVIRONMENTS 
} from "@/constants/teacherPreferences";

export function FeaturesSection() {
  // SSOT: Get all data dynamically
  const theologyProfiles = getTheologyProfileOptions();
  const displayAgeGroups = AGE_GROUPS.filter(ag => ag.id !== 'mixed');
  const bibleVersions = BIBLE_VERSIONS;
  const lessonSections = getRequiredSections();
  const teachingStyles = TEACHING_STYLES;
  const lessonLengths = LESSON_LENGTHS;
  const groupSizes = GROUP_SIZES;
  const environments = LEARNING_ENVIRONMENTS;

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
      description: `Tailored content for ${displayAgeGroups.length} specific age groups, each with customized vocabulary, activities, and teaching considerations.`,
      benefits: [],
      gradient: "bg-gradient-secondary",
      isAgeGroups: true
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Doctrinal Alignment",
      description: `Choose from ${theologyProfiles.length} Baptist theological perspectives, each with specific guardrails to ensure doctrinally appropriate content.`,
      benefits: [],
      gradient: "bg-gradient-primary",
      isTheology: true
    },
    {
      icon: <Settings2 className="h-6 w-6" />,
      title: "Personalized to Your Class",
      description: "Customize every aspect of your lesson to match how you teach and who you're teaching.",
      benefits: [],
      gradient: "bg-gradient-secondary",
      isCapabilities: true
    }
  ];

  // SSOT: Capability stats with hover content for Card 4
  const capabilityStats = [
    { 
      label: "Bible versions", 
      count: bibleVersions.length,
      hoverTitle: "Supported Bible Versions",
      hoverItems: bibleVersions.map(v => v.abbreviation)
    },
    { 
      label: "lesson sections", 
      count: lessonSections.length,
      hoverTitle: "Lesson Sections",
      hoverItems: lessonSections.map(s => s.name.split(' (')[0])
    },
    { 
      label: "teaching styles", 
      count: teachingStyles.length,
      hoverTitle: "Teaching Styles",
      hoverItems: teachingStyles.map(s => s.label)
    },
    { 
      label: "lesson lengths", 
      count: lessonLengths.length,
      hoverTitle: "Lesson Lengths",
      hoverItems: lessonLengths.map(l => l.label)
    },
    { 
      label: "group sizes", 
      count: groupSizes.length,
      hoverTitle: "Group Sizes",
      hoverItems: groupSizes.map(g => g.label)
    },
    { 
      label: "environments", 
      count: environments.length,
      hoverTitle: "Learning Environments",
      hoverItems: environments.map(e => e.label)
    },
  ];

  return (
    <section className="py-8 sm:py-12 lg:py-12 bg-muted/30">
      <div className="container px-4 sm:px-6">
        <div className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8">
          <Badge variant="outline" className="px-3 py-1 text-xs sm:text-sm">
            Features
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold px-2">
            Everything You Need for{" "}
            <span className="gradient-text">Exceptional Bible Studies</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            BibleLessonSpark equips any teacher to make every lesson specifically applicable
            to the class, honoring God's Word and engaging every age group.
          </p>
        </div>

        {/* Founder Quote Banner */}
        <div className="text-center mb-6 sm:mb-8 px-4">
          <blockquote className="text-sm sm:text-base italic text-muted-foreground max-w-2xl mx-auto">
            "BibleLessonSpark creates lessons for your class—timely, personal, relevant, and never one-size-fits-all."
            <footer className="mt-1 text-xs sm:text-sm font-medium text-primary not-italic">
              — Founder, BibleLessonSpark
            </footer>
          </blockquote>
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
                  // SSOT: Theology profiles with HOVER cards
                  <ul className="flex flex-wrap gap-2">
                    {theologyProfiles.map((profile) => (
                      <HoverCard key={profile.id} openDelay={100} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <li 
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                            <span>{profile.shortName}</span>
                          </li>
                        </HoverCardTrigger>
                        <HoverCardContent 
                          side="top" 
                          className="w-72 sm:w-80 p-3"
                          align="center"
                        >
                          <p className="font-semibold text-sm mb-1.5">{profile.name}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{profile.summary}</p>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </ul>
                ) : feature.isAgeGroups ? (
                  // SSOT: Age groups with HOVER cards
                  <ul className="flex flex-wrap gap-2">
                    {displayAgeGroups.map((ageGroup) => (
                      <HoverCard key={ageGroup.id} openDelay={100} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <li 
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <div className="h-1.5 w-1.5 rounded-full bg-secondary shrink-0" />
                            <span>{ageGroup.label.split(' (')[0]}</span>
                          </li>
                        </HoverCardTrigger>
                        <HoverCardContent 
                          side="top" 
                          className="w-72 sm:w-80 p-3"
                          align="center"
                        >
                          <p className="font-semibold text-sm mb-1.5">{ageGroup.label}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{ageGroup.description}</p>
                          <div className="text-xs text-muted-foreground/80">
                            <span className="font-medium">Attention span:</span> ~{ageGroup.teachingProfile.attentionSpan} min
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </ul>
                ) : feature.isCapabilities ? (
                  // SSOT: Platform capabilities with HOVER cards
                  <ul className="flex flex-wrap gap-2">
                    {capabilityStats.map((stat, idx) => (
                      <HoverCard key={idx} openDelay={100} closeDelay={100}>
                        <HoverCardTrigger asChild>
                          <li 
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-md cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <span className="font-semibold text-primary">{stat.count}</span>
                            <span>{stat.label}</span>
                          </li>
                        </HoverCardTrigger>
                        <HoverCardContent 
                          side="top" 
                          className="w-56 sm:w-64 p-3"
                          align="center"
                        >
                          <p className="font-semibold text-sm mb-2">{stat.hoverTitle}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {stat.hoverItems.map((item, i) => (
                              <span 
                                key={i} 
                                className="text-xs bg-muted px-1.5 py-0.5 rounded"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ))}
                  </ul>
                ) : (
                  // Standard benefits list (no hover needed)
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
