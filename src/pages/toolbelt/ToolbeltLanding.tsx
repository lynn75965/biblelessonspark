/**
 * ToolbeltLanding.tsx
 * 
 * Landing page for the Teacher Toolbelt.
 * Displays all three tools with descriptions and links.
 * 
 * SSOT Compliance:
 * - Imports from toolbeltConfig.ts
 * - Uses branding.ts for colors
 * 
 * @version 1.1.0
 * 
 * CHANGELOG:
 * - v1.1.0 (Jan 29, 2026): Tightened spacing for more professional appearance
 */

import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, BookOpen } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  getAllTools,
  TOOLBELT_LANDING_CONFIG,
  TOOLBELT_ROUTES,
} from "@/constants/toolbeltConfig";

export default function ToolbeltLanding() {
  const tools = getAllTools();
  const config = TOOLBELT_LANDING_CONFIG;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section - Compact */}
        <section className="py-8 sm:py-10 px-4 sm:px-6 bg-gradient-to-b from-primary/5 to-background border-b border-border/50">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-3">
              {config.headline}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-3">
              {config.subheadline}
            </p>
            <p className="text-sm text-muted-foreground whitespace-pre-line max-w-xl mx-auto">
              {config.supportText}
            </p>
          </div>
        </section>

        {/* Introduction + Tools Combined Section */}
        <section className="py-6 sm:py-8 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            {/* Introduction */}
            <div className="mb-8">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {config.introHeading}
              </h2>
              <div className="text-sm sm:text-base text-muted-foreground whitespace-pre-line leading-relaxed pl-7">
                {config.introText}
              </div>
            </div>

            {/* Tools */}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 text-center">
                Available Tools
              </h2>
              
              <div className="grid gap-4">
                {tools.map((tool) => (
                  <Card key={tool.id} className="border-border hover:shadow-md transition-shadow hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base sm:text-lg text-primary">
                        {tool.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          <span>Takes about {tool.estimatedMinutes} minutes</span>
                        </div>
                        <Button asChild variant="default" size="sm" className="w-full sm:w-auto">
                          <Link to={tool.route}>
                            Use this tool
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Theological Reassurance - Compact */}
        <section className="py-6 px-4 sm:px-6 bg-muted/30 border-y border-border/50">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {config.theologicalReassurance}
            </p>
          </div>
        </section>

        {/* Soft Bridge - Compact */}
        <section className="py-6 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed italic">
              {config.softBridge}
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
