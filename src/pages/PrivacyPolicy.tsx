import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className={BRANDING.layout.legalPageWrapper}>
      <div className={BRANDING.layout.legalPageCard}>
        <Button
          variant="ghost"
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate(ROUTES.HOME)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: November 25, 2025</p>

        <div className="prose prose-blue max-w-none space-y-6">
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Introduction</h2>
            <p className="text-gray-700">
              BibleLessonSpark ("we", "our", or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your 
              information when you use our Baptist Bible study lesson generator platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Information We Collect</h2>
            
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">Account Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Email address (required for account creation)</li>
              <li>Password (encrypted and never stored in plain text)</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 mt-4">Generated Content</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Bible study lessons you generate</li>
              <li>Customization preferences (age group, theology profile, teaching style)</li>
              <li>Bible passages and topics you submit</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2 mt-4">Usage Information</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>Lesson generation timestamps</li>
              <li>Feature usage patterns</li>
              <li>Error logs (for debugging purposes only)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Service Delivery:</strong> Generate personalized Bible study lessons</li>
              <li><strong>Account Management:</strong> Maintain your account and preferences</li>
              <li><strong>Communication:</strong> Send important service updates (not marketing)</li>
              <li><strong>Improvement:</strong> Analyze usage patterns to improve our platform</li>
              <li><strong>Security:</strong> Detect and prevent abuse, fraud, and security threats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Data Storage and Security</h2>
            <p className="text-gray-700 mb-3">
              Your data is stored securely using industry-standard encryption:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1">
              <li>All data transmitted via HTTPS encryption</li>
              <li>Passwords hashed using bcrypt</li>
              <li>Database access restricted by row-level security policies</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Third-Party Services</h2>
            <p className="text-gray-700 mb-2">We use the following third-party services:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Supabase:</strong> Database and authentication services (hosted in US)</li>
              <li><strong>Anthropic Claude:</strong> lesson generation (content is not stored by Anthropic)</li>
              <li><strong>Netlify:</strong> Website hosting and delivery</li>
            </ul>
            <p className="text-gray-700 mt-3">
              These services have their own privacy policies. We do not sell or share your personal 
              information with third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Your Rights</h2>
            <p className="text-gray-700 mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
              <li><strong>Portability:</strong> Export your generated lessons</li>
              <li><strong>Opt-out:</strong> Unsubscribe from non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Data Retention</h2>
            <p className="text-gray-700">
              We retain your data for as long as your account is active. When you delete your account, 
              we permanently delete all your personal information and generated lessons within 30 days. 
              Some anonymized usage statistics may be retained for analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Children's Privacy</h2>
            <p className="text-gray-700">
              BibleLessonSpark is intended for use by adults (teachers, ministry leaders). We do not 
              knowingly collect personal information from children under 13. If you believe a child 
              has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of significant 
              changes by email or through a prominent notice on our platform. Your continued use of 
              BibleLessonSpark after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">Contact Us</h2>
            <p className="text-gray-700">
              If you have questions about this Privacy Policy or wish to exercise your rights, 
              please contact us at:
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Email:</strong> privacy@biblelessonspark.com<br />
              <strong>Address:</strong> BibleLessonSpark, EckBros Media LLC<br />
              Nacogdoches, Texas, USA
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

