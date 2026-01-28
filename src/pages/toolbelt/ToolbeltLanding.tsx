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
 * @version 1.0.0
 */

import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";
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
        {/* Hero Section */}
        <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-primary/5 to-background">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
              {config.headline}
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-6">
              {config.subheadline}
            </p>
            <p className="text-base text-muted-foreground whitespace-pre-line max-w-2xl mx-auto">
              {config.supportText}
            </p>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">
              {config.introHeading}
            </h2>
            <div className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {config.introText}
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section className="py-10 sm:py-12 px-4 sm:px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-8 text-center">
              Available Tools
            </h2>
            
            <div className="grid gap-6">
              {tools.map((tool) => (
                <Card key={tool.id} className="border-border hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl text-primary">
                      {tool.name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Takes about {tool.estimatedMinutes} minutes</span>
                      </div>
                      <Button asChild variant="default" className="w-full sm:w-auto">
                        <Link to={tool.route}>
                          Use this tool
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Theological Reassurance Section */}
        <section className="py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed">
              {config.theologicalReassurance}
            </p>
          </div>
        </section>

        {/* Soft Bridge Section */}
        <section className="py-10 sm:py-12 px-4 sm:px-6 bg-secondary/10">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-base text-muted-foreground whitespace-pre-line leading-relaxed italic">
              {config.softBridge}
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
