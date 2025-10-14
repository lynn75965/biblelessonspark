import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, Mail } from "lucide-react";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container max-w-4xl py-16">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: October 14, 2025</p>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <p className="text-lg">
              LessonSpark USA ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our Bible study enhancement platform.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including your name, email address, church/organization name, and any content you create using our platform. We also automatically collect certain information about your device and how you interact with our services.
            </p>

            <h2 className="text-2xl font-semibold mt-8">How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services; to process your transactions; to send you technical notices and support messages; and to respond to your comments and questions.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-semibold mt-8">Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at support@lessonspark.com.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t">
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

export default Privacy;
