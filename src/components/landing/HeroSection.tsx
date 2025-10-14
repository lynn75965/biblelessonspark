import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, Users, Clock, Star } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

interface HeroSectionProps {
  onRequestAccess?: () => void;
  onSignIn?: () => void;
}

export function HeroSection({ onRequestAccess, onSignIn }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary-light/20">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container relative">
        <div className="flex flex-col lg:flex-row items-center gap-8 section-lg">
          {/* Left side - Content */}
          <div className="flex-1 space-y-8 text-center lg:text-left">
            {/* Beta badge */}
            <Badge className="bg-gradient-to-r from-secondary to-warning text-white px-4 py-1 text-sm font-semibold">
              Welcome to the Beta • Exclusive for Baptist Teachers
            </Badge>
            
            {/* Main headline */}
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                <span className="gradient-text">In Less Than 8 Minutes</span>{" "}
                Transform Any Curriculum Into Just What Your Class Needs This Week
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl lg:max-w-none">
                Curriculum writers know the material. You know your class. Upload your purchased lesson. 
                Make it speak to the needs of your people everytime. God called you to teach people, not lessons.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-secondary" />
                Enhancement, Not Plagiarism
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 text-secondary" />
                Multi-Age Support
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4 text-secondary" />
                Baptist Doctrine Aligned
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-secondary" />
                Save Money & Time
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button 
                variant="hero" 
                size="xl" 
                onClick={onSignIn}
                className="text-lg"
              >
                <Star className="h-5 w-5" />
                Get Started
              </Button>
            </div>

            {/* Social proof */}
            <div className="pt-8 space-y-2">
              <p className="text-sm text-muted-foreground">
                Trusted by Baptist teachers across the country
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  Early feedback from pilot program
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Hero image */}
          <div className="flex-1 relative">
            <div className="relative">
              <img
                src={heroImage}
                alt="Baptist teachers and students in modern Bible study classroom"
                className="rounded-2xl shadow-2xl w-full max-w-lg mx-auto lg:max-w-none"
              />
              
              {/* Floating feature cards */}
              <Card className="absolute -top-4 -left-4 bg-gradient-card border-white/20 shadow-glow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Smart Enhanced</p>
                      <p className="text-xs text-muted-foreground">Custom activities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="absolute -bottom-4 -right-4 bg-gradient-card border-white/20 shadow-glow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-secondary flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Baptist Aligned</p>
                      <p className="text-xs text-muted-foreground">SBC • RB • IND</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}