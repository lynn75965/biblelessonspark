import { BRANDING } from "@/config/branding";
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

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: July 13, 2026</p>

        <div className="prose prose-blue max-w-none space-y-6">
          <section aria-labelledby="introduction">
            <h2 id="introduction" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">1. Introduction</h2>
            <p className="text-foreground">
              BibleLessonSpark ({'\u201C'}BibleLessonSpark,{'\u201D'} {'\u201C'}we,{'\u201D'} {'\u201C'}our,{'\u201D'} or {'\u201C'}us{'\u201D'}) is operated by EckBros Media LLC. We provide a Baptist Bible study platform for teachers, ministry leaders, churches, and ministry organizations.
            </p>
            <p className="text-foreground mt-3">
              This Privacy Policy explains how we collect, use, disclose, retain, and safeguard information when you use BibleLessonSpark, create or join a Teaching Team or Organization, purchase a subscription or other offering, or use one of our public tools.
            </p>
          </section>

          <section aria-labelledby="information-we-collect">
            <h2 id="information-we-collect" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">2. Information We Collect</h2>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">2.1 Account Information</h3>
            <p className="text-foreground mb-2">
              When you create or maintain an account, we may collect:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Your name and email address;</li>
              <li>Authentication and account-identification information;</li>
              <li>Account preferences and settings;</li>
              <li>Age-group, theological-tradition, teaching-style, lesson-shape, and other ministry-related preferences;</li>
              <li>Subscription, allowance, membership, and account-status information; and</li>
              <li>Communications you send to us.</li>
            </ul>
            <p className="text-foreground mt-3">
              Passwords are handled through our authentication provider. We do not store passwords in readable form.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">2.2 Content and Ministry Inputs</h3>
            <p className="text-foreground mb-2">
              We collect the information you submit to create or use BibleLessonSpark content and features, including:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Bible passages, lesson material, topics, questions, outlines, notes, and uploaded or pasted source material;</li>
              <li>Inputs used to generate lessons, devotionals, modern parables, lesson reshapes, series, and related resources;</li>
              <li>Generated content and revisions;</li>
              <li>Saved lessons and library information;</li>
              <li>Feedback, ratings, and correction requests; and</li>
              <li>Sharing and visibility choices.</li>
            </ul>
            <p className="text-foreground mt-3">
              Please avoid submitting confidential pastoral, counseling, health, financial, or other sensitive personal information about identifiable individuals unless you have a lawful and appropriate reason to do so.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">2.3 Teaching Team and Organization Information</h3>
            <p className="text-foreground mb-2">
              If you create, lead, or join a Teaching Team or an Organization plan, we may collect and process:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Your name, email address, membership, invitation status, and role;</li>
              <li>The Team or Organization with which you are associated;</li>
              <li>Shared lesson and library activity;</li>
              <li>Usage of individual or Organization-funded allowances;</li>
              <li>Information needed to manage invitations, memberships, permissions, and shared resources; and</li>
              <li>Administrative records needed by the Team manager or Organization leader to oversee membership and shared usage.</li>
            </ul>
            <p className="text-foreground mt-3">
              Your name, email address, role, and shared content may be visible to other authorized members of the Team or Organization. An Organization leader may see information reasonably necessary to administer memberships, funding, and shared lesson-pool usage.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">2.4 Information from Visitors Without Accounts</h3>
            <p className="text-foreground mb-2">
              Some public Teacher Toolbelt and similar tools may allow visitors to submit reflection inputs or request that results be delivered by email. When you use these tools, we may collect:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>The email address you provide;</li>
              <li>The information you submit to the tool;</li>
              <li>The result created for you;</li>
              <li>Consent, subscription, delivery, open, click, unsubscribe, and suppression information associated with email communications; and</li>
              <li>Technical information used to operate the tool and prevent abuse.</li>
            </ul>
            <p className="text-foreground mt-3">
              Public or anonymous tools may use browser or device identifiers, cookies or local storage, Internet Protocol addresses, request timestamps, and related technical information to enforce usage limits, prevent repeated abuse, and protect the Service. We may retain limited security and abuse-prevention records for a reasonable period.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">2.5 Usage and Technical Information</h3>
            <p className="text-foreground mb-2">
              We may automatically collect:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Log-in, feature-use, generation, and activity timestamps;</li>
              <li>Pages, tools, and features used;</li>
              <li>Generation status, quality, response-time, and reliability metrics;</li>
              <li>Device, browser, operating-system, referral, and approximate location information derived from an Internet Protocol address;</li>
              <li>Cookies, local storage, and similar technologies;</li>
              <li>Interactions with upgrade or plan-related messages -- for example, when one is shown to you, clicked, or dismissed -- linked to a randomly generated identifier used only to connect those interactions within your own visit, not to identify you across other websites;</li>
              <li>Your Internet Protocol (IP) address, retained for a limited time, used to enforce fair-use limits and protect the Service from automated abuse during periods of high demand, whether or not you are signed in;</li>
              <li>Error reports, diagnostic records, and security logs; and</li>
              <li>Information used to detect fraud, misuse, unauthorized access, and technical failures.</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">2.6 Payment and Transaction Information</h3>
            <p className="text-foreground mb-2">
              Payments are processed through Stripe. We may receive and store:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Subscription plan, billing interval, transaction, invoice, and payment-status information;</li>
              <li>Stripe customer, subscription, product, or transaction identifiers;</li>
              <li>Purchase and cancellation history; and</li>
              <li>Limited billing information supplied by Stripe.</li>
            </ul>
            <p className="text-foreground mt-3">
              Your card details go directly to Stripe and never touch our servers.
            </p>
          </section>

          <section aria-labelledby="how-we-use-information">
            <h2 id="how-we-use-information" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">3. How We Use Information</h2>
            <p className="text-foreground mb-2">
              We may use information to:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Provide, personalize, maintain, and improve BibleLessonSpark;</li>
              <li>Generate and save ministry content according to your inputs and preferences;</li>
              <li>Operate Teaching Teams, Organizations, shared lesson pools, invitations, permissions, and libraries;</li>
              <li>Authenticate users and maintain account security;</li>
              <li>Process subscriptions, purchases, allowances, billing, cancellations, and refunds;</li>
              <li>Send account, transaction, security, service, and support communications;</li>
              <li>Send ministry resources, feature announcements, educational messages, and offers where permitted;</li>
              <li>Measure performance, diagnose errors, improve generation quality, and understand feature use;</li>
              <li>Enforce usage limits and acceptable-use requirements;</li>
              <li>Detect, investigate, and prevent abuse, fraud, security threats, and unlawful activity;</li>
              <li>Comply with legal, tax, accounting, and regulatory obligations; and</li>
              <li>Protect the rights, safety, property, and integrity of users, churches, ministry organizations, BibleLessonSpark, and others.</li>
            </ul>
          </section>

          <section aria-labelledby="marketing-communications">
            <h2 id="marketing-communications" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">4. Marketing Communications</h2>
            <p className="text-foreground">
              When you request a public tool result by email, subscribe to updates, or otherwise provide appropriate consent, we may send you information about BibleLessonSpark features, ministry resources, educational material, and offers.
            </p>
            <p className="text-foreground mt-3">
              Marketing emails will include an unsubscribe method. You may unsubscribe at any time. Unsubscribing from marketing does not prevent us from sending transactional, security, billing, account, or other service-related communications.
            </p>
            <p className="text-foreground mt-3">
              We do not sell your email address, and we do not send third-party advertising on behalf of unrelated businesses.
            </p>
          </section>

          <section aria-labelledby="artificial-intelligence-processing">
            <h2 id="artificial-intelligence-processing" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">5. Artificial Intelligence Processing</h2>
            <p className="text-foreground">
              BibleLessonSpark uses artificial intelligence to create and transform content. Information you submit for generation may be sent to an artificial-intelligence service provider so the requested content can be produced.
            </p>
            <p className="text-foreground mt-3">
              BibleLessonSpark currently uses Anthropic{'\u2019'}s commercial API for AI-assisted content generation. Anthropic states that, by default, inputs and outputs from its commercial products are not used to train its models. Anthropic may retain API inputs and outputs for a limited period for purposes described in its commercial privacy and data-retention terms, unless a different retention arrangement applies.
            </p>
            <p className="text-foreground mt-3">
              Generated content may contain mistakes, incomplete information, or unintended wording. Users should review generated material before teaching, publishing, distributing, or relying on it.
            </p>
          </section>

          <section aria-labelledby="third-party-service-providers">
            <h2 id="third-party-service-providers" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">6. Third-Party Service Providers</h2>
            <p className="text-foreground mb-2">
              We use service providers to operate BibleLessonSpark. Depending on the feature used, providers may process account, content, technical, transaction, or communication information on our behalf.
            </p>
            <p className="text-foreground mb-2">
              Current providers include:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li><strong>Supabase</strong> {'\u2014'} database, authentication, storage, backend functions, and related infrastructure;</li>
              <li><strong>Anthropic</strong> {'\u2014'} artificial-intelligence content generation;</li>
              <li><strong>Stripe</strong> {'\u2014'} subscription, payment, invoice, and transaction processing;</li>
              <li><strong>Netlify</strong> {'\u2014'} application hosting and delivery services;</li>
              <li><strong>Resend</strong> {'\u2014'} transactional and marketing email delivery; and</li>
              <li>Other infrastructure, security, domain, support, or professional-service providers reasonably necessary to operate the Service.</li>
            </ul>
            <p className="text-foreground mt-3">
              These providers process information under their own terms, privacy policies, and contractual obligations. We do not authorize them to use your personal information for their own unrelated marketing.
            </p>
            <p className="text-foreground mt-3 mb-2">
              We may also disclose information:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>When required by law, subpoena, court order, or lawful government request;</li>
              <li>To investigate or prevent fraud, abuse, security threats, or violations of our Terms;</li>
              <li>To protect legal rights, safety, property, or the integrity of the Service;</li>
              <li>In connection with a merger, financing, sale, reorganization, or transfer of all or part of the business, subject to appropriate protections; or</li>
              <li>With your direction or consent.</li>
            </ul>
            <p className="text-foreground mt-3">
              We do not sell personal information.
            </p>
          </section>

          <section aria-labelledby="data-storage-and-security">
            <h2 id="data-storage-and-security" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">7. Data Storage and Security</h2>
            <p className="text-foreground mb-2">
              We use administrative, technical, and organizational safeguards designed to protect information, including:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Encryption in transit using HTTPS;</li>
              <li>Password hashing and authentication controls supplied by Supabase Auth;</li>
              <li>Database row-level security and role-based access restrictions;</li>
              <li>Limited administrative access;</li>
              <li>Logging, monitoring, and abuse-prevention measures; and</li>
              <li>Ongoing security, policy, and access-control review.</li>
            </ul>
            <p className="text-foreground mt-3">
              No electronic transmission or storage method is completely secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section aria-labelledby="cookies-and-similar-technologies">
            <h2 id="cookies-and-similar-technologies" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">8. Cookies and Similar Technologies</h2>
            <p className="text-foreground mb-2">
              BibleLessonSpark may use cookies, browser storage, and similar technologies to:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Authenticate users and maintain sessions;</li>
              <li>Remember preferences and setup progress;</li>
              <li>Operate security and abuse-prevention controls;</li>
              <li>Enforce public-tool and account usage limits;</li>
              <li>Measure reliability and basic feature usage; and</li>
              <li>Support payment, email, and other essential integrations.</li>
            </ul>
            <p className="text-foreground mt-3">
              We do not use cookies to sell personal information or serve unrelated third-party advertising.
            </p>
            <p className="text-foreground mt-3">
              You can control or delete cookies through your browser. Disabling essential cookies or storage may prevent sign-in or interfere with core features.
            </p>
            <p className="text-foreground mt-3">
              If BibleLessonSpark later adopts nonessential advertising, cross-site tracking, or analytics technologies that require consent, this Policy and any required consent controls should be updated before those technologies are enabled.
            </p>
          </section>

          <section aria-labelledby="data-retention">
            <h2 id="data-retention" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">9. Data Retention</h2>
            <p className="text-foreground mb-2">
              We retain information for as long as reasonably necessary to provide the Service, maintain security and business records, satisfy legal obligations, resolve disputes, and enforce agreements.
            </p>
            <p className="text-foreground mb-2">
              Retention periods depend on the type of information:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Account and private content information is generally retained while the account remains active;</li>
              <li>Security, diagnostic, and abuse-prevention records may be retained for a reasonable period;</li>
              <li>Transaction, invoice, tax, accounting, and legal records may be retained as required by law or legitimate business needs;</li>
              <li>Email consent, unsubscribe, and suppression records may be retained to honor communication preferences;</li>
              <li>Shared Team or Organization records may remain as described below; and</li>
              <li>Aggregated or de-identified information may be retained when it no longer reasonably identifies an individual.</li>
            </ul>
          </section>

          <section aria-labelledby="account-deletion-and-shared-content">
            <h2 id="account-deletion-and-shared-content" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">10. Account Deletion and Shared Content</h2>
            <p className="text-foreground">
              You may request deletion of your account and associated personal information by contacting <strong>{BRANDING.contact.supportEmail}</strong>.
            </p>
            <p className="text-foreground mt-3">
              Following a verified deletion request, we will take reasonable steps to delete or de-identify your account information and private generated content within 30 days, except for information we are permitted or required to retain.
            </p>
            <p className="text-foreground mt-3">
              Content that you deliberately shared with a Teaching Team or Organization may remain available to that Team or Organization after you leave or delete your account so that shared ministry work is not unexpectedly removed. Where reasonably feasible, your account identifiers will be removed, replaced, or separated from the retained shared content. Other members may also retain copies they previously exported, printed, downloaded, or otherwise received.
            </p>
            <p className="text-foreground mt-3">
              Historical Organization lesson-pool and administrative records may be retained when reasonably necessary for billing, accounting, security, stewardship, and usage reconciliation. Access to those records should be limited to authorized administrators and service personnel.
            </p>
            <p className="text-foreground mt-3">
              Deletion from active systems may not immediately remove information from disaster-recovery backups. Backup copies will be isolated from ordinary use and expire or be overwritten according to normal backup cycles unless retention is required by law.
            </p>
          </section>

          <section aria-labelledby="your-choices-and-rights">
            <h2 id="your-choices-and-rights" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">11. Your Choices and Rights</h2>
            <p className="text-foreground mb-2">
              Subject to applicable law, you may ask us to:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Provide access to personal information associated with you;</li>
              <li>Correct inaccurate information;</li>
              <li>Delete your account and eligible personal information;</li>
              <li>Provide an export of generated lessons or other portable content available through the Service;</li>
              <li>Explain or limit certain processing;</li>
              <li>Honor your withdrawal of marketing consent; or</li>
              <li>Address a privacy concern or complaint.</li>
            </ul>
            <p className="text-foreground mt-3">
              You may update certain account information through the Service. To make another request, contact <strong>{BRANDING.contact.supportEmail}</strong>. We may need to verify your identity before completing a request.
            </p>
          </section>

          <section aria-labelledby="childrens-privacy">
            <h2 id="childrens-privacy" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">12. Children{'\u2019'}s Privacy</h2>
            <p className="text-foreground">
              BibleLessonSpark is designed for adult teachers, ministry leaders, churches, and ministry organizations. You must be at least 18 years old to create an account.
            </p>
            <p className="text-foreground mt-3">
              We do not knowingly collect personal information directly from children under 13. We also do not knowingly permit a person under 18 to maintain a BibleLessonSpark account. If you believe a child has provided personal information to us, contact <strong>{BRANDING.contact.supportEmail}</strong> so we can investigate and take appropriate action.
            </p>
            <p className="text-foreground mt-3">
              Teachers should not submit identifiable personal information about children or students unless they have an appropriate lawful basis and the submission is necessary for a legitimate ministry purpose.
            </p>
          </section>

          <section aria-labelledby="united-states-operations">
            <h2 id="united-states-operations" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">13. United States Operations</h2>
            <p className="text-foreground">
              BibleLessonSpark is operated from the United States. Information may be processed and stored in the United States or in other countries where our service providers operate. Those locations may have data-protection laws different from those in your jurisdiction.
            </p>
          </section>

          <section aria-labelledby="changes-to-this-policy">
            <h2 id="changes-to-this-policy" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">14. Changes to This Policy</h2>
            <p className="text-foreground">
              We may update this Privacy Policy as the Service, our providers, or legal requirements change. We will post the revised Policy with a new {'\u201C'}Last Updated{'\u201D'} date.
            </p>
            <p className="text-foreground mt-3">
              When a change is material, we will provide reasonable notice through email, an in-product notice, or another prominent method before the change takes effect when practicable.
            </p>
          </section>

          <section aria-labelledby="contact-us">
            <h2 id="contact-us" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">15. Contact Us</h2>
            <p className="text-foreground">
              <strong>BibleLessonSpark</strong><br />
              EckBros Media LLC<br />
              Nacogdoches, Texas, USA<br />
              <strong>Email:</strong> {BRANDING.contact.supportEmail}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
