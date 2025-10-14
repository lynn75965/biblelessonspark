import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Cookie as CookieIcon, Mail } from "lucide-react";

const Cookie = () => {

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container max-w-4xl py-16">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
              <CookieIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Cookie Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: October 14, 2025</p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-lg">
              This Cookie Policy explains how LessonSpark USA uses cookies and similar technologies to recognize you when you visit our platform.
            </p>

            <h2 className="text-2xl font-semibold mt-8">What Are Cookies</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the site owners.
            </p>

            <h2 className="text-2xl font-semibold mt-8">How We Use Cookies</h2>
            <p>
              We use cookies to authenticate users, remember user preferences, analyze how our service is used, and improve user experience. Essential cookies are necessary for the platform to function properly, while analytics cookies help us understand how visitors interact with our site.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Your Choices</h2>
            <p>
              You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust preferences every time you visit our site.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us at support@lessonspark.com.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t">
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

export default Cookie;
