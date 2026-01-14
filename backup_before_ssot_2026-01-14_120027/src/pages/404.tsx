import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container max-w-2xl">
        <div className="text-center space-y-8">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-primary">
            <AlertCircle className="h-10 w-10 text-white" />
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl font-bold gradient-text">404</h1>
            <h2 className="text-3xl font-semibold">Page Not Found</h2>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild variant="hero" size="lg">
              <Link to="/">Back to Home</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/#pricing">View Plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
