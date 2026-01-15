import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Sparkles, Users, Clock, Star } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { shouldShowPublicBetaEnrollment } from "@/constants/betaEnrollmentConfig";
import { useTenant } from "@/contexts/TenantContext";
import { joinWithBullet } from "@/constants/uiSymbols";

interface HeroSectionProps {
  onRequestAccess?: () => void;
  onSignIn?: () => void;
}

export function HeroSection({ onRequestAccess, onSignIn }: HeroSectionProps) {
  const { settings } = useSystemSettings();
  const tenant = useTenant();
  const platformMode = settings.current_phase as string;
  const isPublicBeta = shouldShowPublicBetaEnrollment(platformMode);
  
  // SSOT: Get TEXT from tenant_config (database), BEHAVIOR from betaEnrollmentConfig
  // Beta mode: reads from tenant.beta.landingPage
  // Production mode: reads from tenant.production.landingPage
  const ctaButtonText = isPublicBeta 
    ? tenant.beta.landingPage.ctaButton 
    : tenant.production.landingPage.ctaButton;
  
  const badgeText = isPublicBeta
    ? tenant.beta.landingPage.badgeText
    : tenant.production.landingPage.badgeText;
  
  const trustText = isPublicBeta
    ? tenant.beta.landingPage.trustText
    : tenant.production.landingPage.trustText;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary-light/20">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container relative px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 py-6 sm:py-8 lg:py-10">
          {/* Left side - Content */}
          <div className="flex-1 space-y-4 sm:space-y-6 lg:space-y-8 text-center lg:text-left w-full">
            {/* Beta badge */}
            <Badge className="bg-gradient-to-r from-secondary to-warning text-white px-3 py-1 text-xs sm:text-sm font-semibold inline-block">
              {badgeText}
            </Badge>
            
            {/* Main headline */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight" style={{ fontFamily: 'var(--font-secondary)' }}>
                <span className="gradient-text">Use 3 Simple Steps</span>{" "}
                <span className="block sm:inline">To Transform Your Lesson Prep</span>
              </h1>
              
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Teach the way God equipped you to teach. Start with any curriculum or Bible passage and produce unique lessons rooted in Baptist distinctives and shaped for your teaching personality and your class's learning style.
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                <span className="font-semibold">3 Steps, 3 Minutes, and a personal ready-to-teach lesson appears</span>, focused on your class making real-life application.
              </p>
              <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 font-semibold">
                God called you to teach people, not lessons.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center lg:justify-start gap-2 sm:gap-3 lg:gap-4">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-secondary shrink-0" />
                <span>Enhancement</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-secondary shrink-0" />
                <span>Multi-Age</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-secondary shrink-0" />
                <span>Doctrine Aligned</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-secondary shrink-0" />
                <span>Save Time</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <Button 
                variant="hero" 
                size="lg"
                onClick={onSignIn}
                className="text-base sm:text-lg w-full sm:w-auto min-h-[44px]"
              >
                <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                {ctaButtonText}
              </Button>
            </div>

            {/* Social proof */}
            <div className="pt-4 sm:pt-6 lg:pt-8 space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground">
                {trustText}
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-0.5 sm:gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3 w-3 sm:h-4 sm:w-4 fill-secondary text-secondary" />
                ))}
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm text-muted-foreground">
                  Early feedback from pilot program
                </span>
              </div>
            </div>
          </div>

          {/* Right side - Hero image */}
          <div className="flex-1 relative w-full mt-4 sm:mt-6 lg:mt-0">
            <div className="relative px-4 sm:px-0">
              <img
                src={heroImage}
                alt="Baptist teachers and students in modern Bible study classroom"
                className="rounded-lg sm:rounded-2xl shadow-xl sm:shadow-2xl w-full max-w-sm sm:max-w-lg mx-auto lg:max-w-none"
              />
              
              {/* Floating feature cards - hidden on smallest screens */}
              <Card className="hidden xs:block absolute -top-2 -left-2 sm:-top-4 sm:-left-4 bg-gradient-card border-white/20 shadow-glow">
                <CardContent className="p-2 sm:p-3 lg:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                      <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">Smart Enhanced</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Custom activities</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="hidden xs:block absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 bg-gradient-card border-white/20 shadow-glow">
                <CardContent className="p-2 sm:p-3 lg:p-4">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-lg bg-gradient-secondary flex items-center justify-center shrink-0">
                      <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">Baptist Aligned</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{joinWithBullet(["SBC", "RB", "IND"])}</p>
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



