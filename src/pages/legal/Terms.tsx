import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { FileText, Mail } from "lucide-react";
import { SITE } from "@/config/site";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container max-w-4xl py-16 flex-1">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Terms of Service</h1>
            <p className="text-sm text-muted-foreground">Last updated: October 14, 2025</p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-lg">
              Welcome to LessonSpark USA. By accessing or using our services, you agree to be bound by these Terms of Service.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Use of Services</h2>
            <p>
              You may use our services only in compliance with these Terms and all applicable laws. You are responsible for maintaining the security of your account and for all activities that occur under your account.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Content Ownership</h2>
            <p>
              You retain all rights to the content you create using LessonSpark USA. We claim no intellectual property rights over the material you provide to the service. However, by using our service, you grant us the right to store and process your content.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Subscription and Payment</h2>
            <p>
              Some aspects of the service are provided on a subscription basis. You will be billed in advance on a recurring basis according to your chosen subscription plan. Subscription fees are non-refundable except as required by law.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Termination</h2>
            <p>
              We may terminate or suspend your access to our services immediately, without prior notice, for any reason, including breach of these Terms.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Contact</h2>
            <p>
              Questions about the Terms of Service should be sent to {SITE.supportEmail}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t">
            <Button variant="outline" size="lg" asChild>
              <a href={`mailto:${SITE.supportEmail}`} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Support
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer - SSOT Component */}
      <Footer />
    </div>
  );
};

export default Terms;
