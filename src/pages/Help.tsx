import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { HelpCircle, Mail } from "lucide-react";

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container max-w-3xl py-16">
        <div className="text-center space-y-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
            <HelpCircle className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold gradient-text">Help Center</h1>
          
          <p className="text-xl text-muted-foreground">
            Coming soon! Our help center will provide FAQs and support resources for all your questions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button variant="hero" size="lg" onClick={() => navigate("/")}>
              Back to Home
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="mailto:support@lessonspark.com" className="flex items-center gap-2">
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

export default Help;
