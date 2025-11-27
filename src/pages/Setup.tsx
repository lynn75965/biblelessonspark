import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { BookOpen, Mail } from "lucide-react";
import { SITE } from "@/config/site";

const Setup = () => {

  return (
    <div className="min-h-screen bg-background flex flex-col">
      
      <div className="container max-w-3xl py-12 sm:py-16 px-4 flex-1">
        <div className="text-center space-y-6 sm:space-y-8">
          <div className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-lg bg-gradient-primary">
            <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Setup Guide</h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground px-4">
            Coming soon! Our comprehensive setup guide will help you get started with LessonSpark USA.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
              <Link to="/setup/checklist">Interactive Setup Checklist</Link>
            </Button>
            
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-6 sm:pt-8 px-4">
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <a href={`mailto:${SITE.supportEmail}`} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Support
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;

