import { BRANDING } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
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

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: November 25, 2025</p>

        <div className="prose prose-blue max-w-none space-y-6">
          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Acceptance of Terms</h2>
            <p className="text-foreground">
              By accessing and using BibleLessonSpark ("Service", "Platform"), you accept and agree to 
              be bound by these Terms of Service. If you do not agree to these terms, please do not 
              use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Description of Service</h2>
            <p className="text-foreground">
              BibleLessonSpark is an Personalized Baptist Bible study lesson generator designed to help 
              volunteer teachers and ministry leaders create educational content. The Service generates 
              lessons based on your inputs and preferences, aligned with Baptist theological traditions.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">User Accounts</h2>
            
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Account Creation</h3>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>You must provide accurate and complete information</li>
              <li>You must be at least 18 years old to create an account</li>
              <li>You are responsible for maintaining account security</li>
              <li>You must not share your account credentials</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">Account Termination</h3>
            <p className="text-foreground">
              We reserve the right to suspend or terminate accounts that violate these terms or 
              engage in abusive behavior.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Acceptable Use</h2>
            
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">You May:</h3>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Generate lessons for personal or ministry use</li>
              <li>Edit and customize generated content</li>
              <li>Share lessons within your church or ministry</li>
              <li>Export lessons for offline use</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">You May Not:</h3>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Resell or commercially redistribute generated lessons</li>
              <li>Use the Service to generate content contrary to Christian values</li>
              <li>Attempt to reverse engineer or exploit the Service</li>
              <li>Generate excessive content to abuse API resources</li>
              <li>Share your account with others</li>
              <li>Use automated tools to access the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Content Ownership and License</h2>
            
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Your Content</h3>
            <p className="text-foreground">
              You retain ownership of any inputs you provide (Bible passages, teaching notes, preferences). 
              Generated lessons are created for your use and remain your property.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">Platform Content</h3>
            <p className="text-foreground">
              The BibleLessonSpark platform, including its design, code, and technology, is owned by 
              EckBros Media LLC and protected by copyright and intellectual property laws.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">License to Use Generated Content</h3>
            <p className="text-foreground">
              We grant you a non-exclusive license to use, modify, and distribute lessons you generate 
              for ministry and educational purposes. You may not sell or commercially redistribute 
              generated content without prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Content Disclaimer</h2>
            <p className="text-foreground mb-3">
              BibleLessonSpark generates content using advanced technology. While we strive for theological 
              accuracy aligned with Baptist traditions:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Generated content should be reviewed before use</li>
              <li>We do not guarantee theological perfection</li>
              <li>Teachers are responsible for verifying content accuracy</li>
              <li>The Service is a tool to assist, not replace, human judgment</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Usage Limits</h2>
            <p className="text-foreground">
              To ensure fair use and control costs, we enforce the following limits:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Maximum 10 lessons per hour per account</li>
              <li>Maximum 50 lessons per day per account</li>
            </ul>
            <p className="text-foreground mt-2">
              We may adjust these limits or implement tiered pricing in the future with advance notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Limitation of Liability</h2>
            <p className="text-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, BibleLessonSpark AND ITS OPERATORS SHALL NOT BE 
              LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, 
              INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, OR OTHER INTANGIBLE LOSSES 
              RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Disclaimer of Warranties</h2>
            <p className="text-foreground">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Indemnification</h2>
            <p className="text-foreground">
              You agree to indemnify and hold harmless BibleLessonSpark and EckBros Media LLC from any 
              claims, damages, liabilities, and expenses arising from your use of the Service or 
              violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Modifications to Service</h2>
            <p className="text-foreground">
              We reserve the right to modify, suspend, or discontinue the Service at any time with 
              or without notice. We will not be liable to you or any third party for any modification, 
              suspension, or discontinuance of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Changes to Terms</h2>
            <p className="text-foreground">
              We may update these Terms of Service from time to time. Significant changes will be 
              communicated via email or a prominent notice on the Platform. Your continued use after 
              changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Governing Law</h2>
            <p className="text-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the 
              State of Texas, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-3">Contact Information</h2>
            <p className="text-foreground">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-foreground mt-2">
              <strong>Email:</strong> support@biblelessonspark.com<br />
              <strong>Address:</strong> BibleLessonSpark, EckBros Media LLC<br />
              Nacogdoches, Texas, USA
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}


