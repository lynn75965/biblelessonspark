import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, Mail } from "lucide-react";
import { SITE } from "@/config/site";

const Docs = () => {

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container max-w-3xl py-16">
        <div className="text-center space-y-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold gradient-text">Documentation</h1>
          
          <p className="text-xl text-muted-foreground">
            Coming soon! Comprehensive documentation to help you make the most of LessonSpark USA.
          </p>

          <Button asChild variant="secondary" size="sm">
            <Link to="/">Back to Home</Link>
          </Button>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button variant="outline" size="lg" asChild>
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

export default Docs;
