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
        <p className="text-sm text-muted-foreground mb-8">Last Updated: July 13, 2026</p>

        <div className="prose prose-blue max-w-none space-y-6">
          <section aria-labelledby="acceptance-of-terms">
            <h2 id="acceptance-of-terms" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-foreground">
              These Terms of Service ({'\u201C'}Terms{'\u201D'}) govern your access to and use of BibleLessonSpark, including its websites, applications, public tools, content-generation features, Teaching Teams, Organization plans, subscriptions, purchases, and related services (collectively, the {'\u201C'}Service{'\u201D'}).
            </p>
            <p className="text-foreground mt-3">
              The Service is operated by EckBros Media LLC, a Texas limited liability company doing business as BibleLessonSpark ({'\u201C'}BibleLessonSpark,{'\u201D'} {'\u201C'}we,{'\u201D'} {'\u201C'}our,{'\u201D'} or {'\u201C'}us{'\u201D'}).
            </p>
            <p className="text-foreground mt-3">
              By accessing or using the Service, creating an account, accepting an invitation, or purchasing a subscription or other offering, you agree to these Terms and our Privacy Policy. If you use the Service for a church, ministry, or other organization, you represent that you have authority to act for that organization to the extent applicable.
            </p>
            <p className="text-foreground mt-3">
              If you do not agree, do not use the Service.
            </p>
          </section>

          <section aria-labelledby="description-of-the-service">
            <h2 id="description-of-the-service" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">2. Description of the Service</h2>
            <p className="text-foreground">
              BibleLessonSpark is a personalized Baptist Bible study platform designed to assist volunteer teachers, ministry leaders, churches, and ministry organizations.
            </p>
            <p className="text-foreground mt-3 mb-2">
              Depending on your plan and available features, the Service may include:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>AI-assisted Bible study lesson generation;</li>
              <li>Personalization according to selected Baptist theological tradition, age group, teaching preferences, lesson shape, and class context;</li>
              <li>Devotional generation;</li>
              <li>Modern parable generation;</li>
              <li>Lesson reshaping and adaptation;</li>
              <li>Lesson-series planning and libraries;</li>
              <li>Saved lesson and resource libraries;</li>
              <li>Teaching Teams for collaboration among co-teachers;</li>
              <li>Organization or {'\u201C'}Shepherding{'\u201D'} plans through which a church or ministry may fund and administer lesson generation for members;</li>
              <li>Exporting, printing, copying, downloading, and sharing tools;</li>
              <li>Public Teacher Toolbelt and related ministry tools; and</li>
              <li>Other related features introduced over time.</li>
            </ul>
            <p className="text-foreground mt-3">
              Feature availability, prices, allowances, and limits vary by plan and are described on the applicable pricing, purchase, or in-product page.
            </p>
          </section>

          <section aria-labelledby="eligibility-and-accounts">
            <h2 id="eligibility-and-accounts" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">3. Eligibility and Accounts</h2>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">3.1 Age Requirement</h3>
            <p className="text-foreground">
              You must be at least 18 years old to create or maintain an account.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">3.2 Account Information</h3>
            <p className="text-foreground">
              You agree to provide accurate, current, and complete information and to keep it reasonably updated.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">3.3 Account Security</h3>
            <p className="text-foreground mb-2">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Protecting your credentials;</li>
              <li>Restricting access to your account and devices;</li>
              <li>Activities performed through your account; and</li>
              <li>Promptly notifying us at <strong>support@biblelessonspark.com</strong> if you suspect unauthorized access.</li>
            </ul>
            <p className="text-foreground mt-3">
              Your account is personal to you. You may not share credentials with another person. Collaboration should occur through Teaching Teams, Organization memberships, invitations, and sharing features supplied by the Service.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">3.4 Invitations and Memberships</h3>
            <p className="text-foreground">
              When you accept an invitation to a Teaching Team or Organization, authorized members may be able to see your name, email address, role, shared content, and related membership or usage information as described in our Privacy Policy.
            </p>
          </section>

          <section aria-labelledby="plans-allowances-and-feature-descriptions">
            <h2 id="plans-allowances-and-feature-descriptions" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">4. Plans, Allowances, and Feature Descriptions</h2>
            <p className="text-foreground">
              BibleLessonSpark may offer free access, paid individual subscriptions, annual or monthly billing, Organization plans, lesson packs, onboarding services, and other one-time or recurring offerings.
            </p>
            <p className="text-foreground mt-3 mb-2">
              The pricing or purchase page shown at the time of purchase identifies the applicable:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Price;</li>
              <li>Billing interval;</li>
              <li>Included features;</li>
              <li>Lesson, credit, generation, seat, or other allowance;</li>
              <li>Renewal terms;</li>
              <li>Trial or promotional conditions; and</li>
              <li>Any expiration or special restriction.</li>
            </ul>
            <p className="text-foreground mt-3">
              Those purchase-page terms form part of these Terms. In the event of a direct conflict, the specific terms clearly presented and accepted at checkout control for that purchase.
            </p>
          </section>

          <section aria-labelledby="billing-and-payments">
            <h2 id="billing-and-payments" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">5. Billing and Payments</h2>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">5.1 Payment Processing</h3>
            <p className="text-foreground">
              Payments are processed by Stripe. We do not store your full payment-card details. By making a purchase, you authorize us and Stripe to charge the payment method you provide for the applicable amounts, taxes, and renewals.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">5.2 Automatic Renewal</h3>
            <p className="text-foreground">
              Paid subscriptions renew automatically at the end of each monthly or annual billing period, as selected at purchase, unless canceled before the renewal date.
            </p>
            <p className="text-foreground mt-3">
              Your payment method will be charged the then-current renewal price. Applicable taxes may be added.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">5.3 Cancellation</h3>
            <p className="text-foreground">
              You may cancel a subscription at any time through the Stripe billing portal or subscription-management option made available through your BibleLessonSpark account. You may also request cancellation by contacting <strong>support@biblelessonspark.com</strong>.
            </p>
            <p className="text-foreground mt-3">
              Unless a different cancellation term was clearly disclosed at purchase, cancellation takes effect at the end of the current paid billing period. You will retain access to the paid features and remaining period-based benefits until that period ends. Cancellation prevents the next renewal charge but does not retroactively reverse charges already incurred.
            </p>
            <p className="text-foreground mt-3">
              Deleting an account does not necessarily cancel an active subscription. You should cancel the subscription before requesting account deletion or ask support to address both actions.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">5.4 Refunds</h3>
            <p className="text-foreground">
              Except where required by law or expressly stated at purchase, payments are non-refundable, including payments for partially used billing periods, unused subscription time, and completed one-time services.
            </p>
            <p className="text-foreground mt-3">
              If you believe a charge resulted from an error, duplicate transaction, unauthorized use, or other exceptional circumstance, contact <strong>support@biblelessonspark.com</strong> within 30 days of the charge. We will review the request in good faith. Any refund remains at our reasonable discretion unless the law requires otherwise.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">5.5 Lesson Packs and One-Time Purchases</h3>
            <p className="text-foreground">
              Lesson packs and other one-time purchases are charged when purchased and do not automatically renew.
            </p>
            <p className="text-foreground mt-3">
              Any expiration date or special use condition will be disclosed on the applicable purchase page. If no expiration is disclosed, an unused purchased allowance remains available while the associated account remains active and in good standing. Once any portion of a pack or allowance has been used, the purchase is non-refundable except where required by law or approved under Section 5.4.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">5.6 Free Access</h3>
            <p className="text-foreground">
              Free access may include limited features or allowances. Free offerings are intended for genuine individual evaluation and ministry use. They may not be multiplied, transferred, farmed, or circumvented through duplicate accounts, false identities, automated registrations, or other means.
            </p>
            <p className="text-foreground mt-3">
              We may modify or discontinue a free offering at our discretion. This does not permit us to remove benefits already purchased under a paid plan without regard to the other provisions of these Terms.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">5.7 Price Changes</h3>
            <p className="text-foreground">
              We may change subscription prices. For an existing paid subscriber, a price increase will take effect no earlier than the first renewal occurring at least 30 days after notice is provided, unless a longer period is required by law.
            </p>
            <p className="text-foreground mt-3">
              You may cancel before the new price takes effect.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">5.8 Taxes</h3>
            <p className="text-foreground">
              Prices may not include taxes. You are responsible for applicable sales, use, value-added, or similar taxes except taxes imposed on our income.
            </p>
          </section>

          <section aria-labelledby="teaching-teams-and-organization-plans">
            <h2 id="teaching-teams-and-organization-plans" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">6. Teaching Teams and Organization Plans</h2>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">6.1 Teaching Teams</h3>
            <p className="text-foreground">
              Teaching Teams allow invited teachers to collaborate and share selected lessons or resources. The Team manager is responsible for invitations, membership administration, and appropriate use of Team features.
            </p>
            <p className="text-foreground mt-3">
              A Teaching Team does not authorize members to use another person{'\u2019'}s credentials or access private content that has not been shared with the Team.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">6.2 Organization or Shepherding Plans</h3>
            <p className="text-foreground">
              An Organization plan may be purchased or administered by a church, ministry, or other eligible organization ({'\u201C'}Organization{'\u201D'}). The purchaser or administrator represents that they have authority to act for and bind the Organization with respect to the plan.
            </p>
            <p className="text-foreground mt-3 mb-2">
              Organization leaders may:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Invite and remove members;</li>
              <li>Assign or administer authorized roles;</li>
              <li>View information necessary to manage memberships and shared usage;</li>
              <li>Oversee the Organization{'\u2019'}s shared lesson pool or other purchased allowance; and</li>
              <li>Access content members deliberately share with the Organization, subject to available settings.</li>
            </ul>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">6.3 Funding Source Selected at Generation</h3>
            <p className="text-foreground">
              When the Service permits a user to choose whether a generation will use an individual allowance or an Organization-funded allowance, the selected funding source is fixed when the generation request is initiated.
            </p>
            <p className="text-foreground mt-3">
              If the selected allowance is unavailable or insufficient, the Service may reject the request rather than automatically charging or consuming a different allowance. A completed generation charged to a selected pool is final for allowance-accounting purposes, subject to correction of a documented technical or billing error.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">6.4 Organization Responsibility</h3>
            <p className="text-foreground mb-2">
              An Organization is responsible for:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Managing its authorized leaders and members;</li>
              <li>Ensuring that invitations are sent only to appropriate persons;</li>
              <li>Monitoring use of purchased allowances;</li>
              <li>Establishing any internal ministry policies for shared content; and</li>
              <li>Addressing disputes among its leaders and members.</li>
            </ul>
            <p className="text-foreground mt-3">
              BibleLessonSpark is not responsible for an Organization{'\u2019'}s internal decisions concerning membership, lesson selection, ministry assignment, or doctrinal review.
            </p>
          </section>

          <section aria-labelledby="acceptable-use">
            <h2 id="acceptable-use" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">7. Acceptable Use</h2>
            <p className="text-foreground mb-2">
              You may use BibleLessonSpark for lawful personal, church, ministry, and educational purposes consistent with these Terms.
            </p>
            <p className="text-foreground mb-2">
              You may:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Generate, review, revise, reshape, save, and organize ministry content;</li>
              <li>Use generated material in teaching, preaching support, discipleship, devotionals, classes, small groups, and ministry preparation;</li>
              <li>Print or distribute material without charge to your class, congregation, Teaching Team, or ministry participants;</li>
              <li>Share selected content through authorized Team and Organization features; and</li>
              <li>Export content for your own ministry records and lawful offline use.</li>
            </ul>
            <p className="text-foreground mt-3 mb-2">
              You may not:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Use the Service or generated content for unlawful, fraudulent, deceptive, abusive, harassing, exploitative, or malicious purposes;</li>
              <li>Use the Service to create content intended to encourage violence, sexual exploitation, hatred, or harm;</li>
              <li>Deliberately use the Service for purposes materially unrelated to its Christian ministry and educational purpose;</li>
              <li>Sell, sublicense, or commercially redistribute generated content except with our prior written permission;</li>
              <li>Share, sell, rent, or transfer account credentials;</li>
              <li>Create duplicate or false accounts to evade limits;</li>
              <li>Probe, scan, attack, reverse engineer, interfere with, or bypass security or access controls;</li>
              <li>Introduce malware or harmful code;</li>
              <li>Scrape, crawl, harvest, or access the Service through unauthorized automation;</li>
              <li>Use generated output or Service access to build or train a competing product, model, dataset, template system, or content-generation service without written permission;</li>
              <li>Remove proprietary notices from platform materials;</li>
              <li>Infringe another person{'\u2019'}s intellectual-property, privacy, publicity, contractual, or other rights; or</li>
              <li>Violate applicable law or these Terms.</li>
            </ul>
            <p className="text-foreground mt-3">
              We may investigate suspected violations and take reasonable protective action.
            </p>
          </section>

          <section aria-labelledby="inputs-generated-content-and-ownership">
            <h2 id="inputs-generated-content-and-ownership" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">8. Inputs, Generated Content, and Ownership</h2>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">8.1 Your Inputs</h3>
            <p className="text-foreground">
              As between you and BibleLessonSpark, you retain ownership of original material you submit, subject to rights held by others.
            </p>
            <p className="text-foreground mt-3">
              You represent that you have the rights and permissions needed to submit and use your inputs. Do not upload copyrighted curriculum, books, articles, confidential records, or other third-party material unless your use is authorized by law or permission.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">8.2 License Needed to Operate the Service</h3>
            <p className="text-foreground mb-2">
              You grant BibleLessonSpark and its service providers a limited, nonexclusive license to host, process, reproduce, transform, transmit, display, and otherwise use your inputs and content only as reasonably necessary to:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Provide requested features;</li>
              <li>Generate, save, export, and share content;</li>
              <li>Operate Teams and Organizations;</li>
              <li>Maintain security and reliability;</li>
              <li>Provide support; and</li>
              <li>Comply with law.</li>
            </ul>
            <p className="text-foreground mt-3">
              This operational license ends when the information is deleted from active systems, except for retained shared content, legal records, security records, and backup copies as described in our Privacy Policy.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">8.3 Generated Content</h3>
            <p className="text-foreground">
              As between you and BibleLessonSpark, you own the lessons and other content generated for your account, to the extent permitted by applicable law.
            </p>
            <p className="text-foreground mt-3">
              You may use, edit, print, copy, share, and distribute generated content without charge for personal, church, ministry, and educational purposes.
            </p>
            <p className="text-foreground mt-3">
              You may not sell, license for payment, publish as a commercial curriculum product, place behind a paid content subscription, or otherwise commercially redistribute generated content without our prior written permission.
            </p>
            <p className="text-foreground mt-3">
              Because artificial-intelligence output may not qualify for copyright protection in every circumstance or jurisdiction, we do not promise that generated content is legally protectable or exclusive to you. Similar content may be generated for other users.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">8.4 Shared Content</h3>
            <p className="text-foreground">
              When you deliberately share content with a Teaching Team or Organization, you grant authorized members of that group a nonexclusive right to view, copy, use, adapt, print, export, and distribute that content for the group{'\u2019'}s noncommercial church, ministry, and educational purposes.
            </p>
            <p className="text-foreground mt-3">
              Content deliberately shared with a Team or Organization may remain available to that group after you leave the group or delete your account so that shared ministry work is not unexpectedly removed. BibleLessonSpark may remove, replace, or separate your account identifiers from retained shared content where reasonably feasible.
            </p>
            <p className="text-foreground mt-3">
              Members may retain copies they previously exported, printed, downloaded, copied, or received. Account deletion cannot retrieve or delete those external copies.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">8.5 Platform Materials</h3>
            <p className="text-foreground">
              BibleLessonSpark and its licensors retain all rights in the Service, including its software, interface, designs, branding, workflows, prompts, theological guardrails, lesson shapes, selection systems, databases, documentation, and other platform materials.
            </p>
            <p className="text-foreground mt-3">
              These Terms do not transfer ownership of the Service or platform materials to you.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">8.6 Feedback</h3>
            <p className="text-foreground">
              If you provide suggestions, corrections, ideas, ratings, or other feedback, you permit us to use that feedback without restriction or compensation to improve the Service, provided that we do not publicly identify you without permission.
            </p>
          </section>

          <section aria-labelledby="artificial-intelligence-and-theological-responsibility">
            <h2 id="artificial-intelligence-and-theological-responsibility" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">9. Artificial Intelligence and Theological Responsibility</h2>
            <p className="text-foreground">
              BibleLessonSpark uses artificial intelligence. Generated content may contain errors, omissions, invented citations, inappropriate wording, or theological interpretations with which you or your church disagree.
            </p>
            <p className="text-foreground mt-3 mb-2">
              Although BibleLessonSpark is designed to support selected Baptist traditions and ministry preferences:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>We do not guarantee theological perfection, doctrinal completeness, factual accuracy, or fitness for a particular congregation;</li>
              <li>Generated content must be reviewed before use;</li>
              <li>Scripture references and quotations should be checked against a trusted Bible translation;</li>
              <li>Confessional, historical, and factual claims should be independently verified;</li>
              <li>The teacher, ministry leader, church, or Organization remains responsible for final content selection and use; and</li>
              <li>The Service assists but does not replace prayer, Bible study, pastoral oversight, teacher preparation, or human discernment.</li>
            </ul>
            <p className="text-foreground mt-3">
              BibleLessonSpark does not provide pastoral counseling, legal advice, medical advice, mental-health care, financial advice, or professional crisis services.
            </p>
          </section>

          <section aria-labelledby="usage-limits-allowances-and-fair-use">
            <h2 id="usage-limits-allowances-and-fair-use" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">10. Usage Limits, Allowances, and Fair Use</h2>
            <p className="text-foreground">
              Plan allowances and feature limits are shown on the applicable pricing or in-product page.
            </p>
            <p className="text-foreground mt-3">
              We may use technical rate limits, concurrency limits, abuse controls, and reasonable-use protections to preserve availability, prevent misuse, and manage service costs.
            </p>
            <p className="text-foreground mt-3 mb-2">
              We may delay, reject, throttle, or suspend requests that:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Exceed the applicable plan or purchased allowance;</li>
              <li>Appear automated or abusive;</li>
              <li>Threaten service reliability or security;</li>
              <li>Circumvent intended limits; or</li>
              <li>Violate these Terms.</li>
            </ul>
            <p className="text-foreground mt-3">
              We will provide reasonable advance notice before materially reducing a paid plan{'\u2019'}s stated recurring allowance, except when immediate action is necessary for security, legal compliance, third-party service failure, or prevention of abuse.
            </p>
          </section>

          <section aria-labelledby="service-availability-and-changes">
            <h2 id="service-availability-and-changes" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">11. Service Availability and Changes</h2>
            <p className="text-foreground">
              We work to provide a reliable Service, but the Service is provided over the Internet and depends on third-party infrastructure, payment, email, authentication, hosting, and artificial-intelligence providers.
            </p>
            <p className="text-foreground mt-3">
              We do not guarantee uninterrupted or error-free operation. Maintenance, outages, provider failures, model changes, security incidents, Internet conditions, and events outside our reasonable control may affect availability or output.
            </p>
            <p className="text-foreground mt-3">
              We may add, modify, replace, or discontinue features. If we discontinue the entire paid Service or materially remove a central feature from a paid plan, we will provide reasonable notice when practicable and address any legally required remedy.
            </p>
          </section>

          <section aria-labelledby="suspension-and-termination">
            <h2 id="suspension-and-termination" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">12. Suspension and Termination</h2>
            <p className="text-foreground mb-2">
              We may restrict, suspend, or terminate access when we reasonably believe that:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>You violated these Terms;</li>
              <li>Your use presents a security, legal, financial, reputational, or operational risk;</li>
              <li>Payment is overdue, disputed, reversed, or fraudulent;</li>
              <li>Your account is being used without authorization;</li>
              <li>Immediate action is necessary to protect users or the Service; or</li>
              <li>We are required to do so by law.</li>
            </ul>
            <p className="text-foreground mt-3">
              When practicable, we will provide notice and an opportunity to correct a remediable violation. We may act immediately when delay could cause harm.
            </p>
            <p className="text-foreground mt-3">
              You may stop using the Service at any time. Subscription cancellation and account deletion are separate actions and are governed by Section 5 and our Privacy Policy.
            </p>
            <p className="text-foreground mt-3 mb-2">
              Upon termination:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Your right to access the Service ends;</li>
              <li>Unpaid amounts remain due;</li>
              <li>Provisions that by their nature should survive will survive, including payment obligations, ownership provisions, disclaimers, limitations of liability, indemnification, and dispute provisions; and</li>
              <li>Content will be handled according to these Terms and our Privacy Policy.</li>
            </ul>
          </section>

          <section aria-labelledby="third-party-services-and-links">
            <h2 id="third-party-services-and-links" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">13. Third-Party Services and Links</h2>
            <p className="text-foreground">
              The Service relies on or may link to third-party services, including Supabase, Anthropic, Stripe, Netlify, and Resend.
            </p>
            <p className="text-foreground mt-3">
              Third-party services are governed by their own terms and privacy policies. We are not responsible for third-party websites, content, policies, outages, or acts, except to the extent responsibility cannot lawfully be excluded.
            </p>
          </section>

          <section aria-labelledby="disclaimer-of-warranties">
            <h2 id="disclaimer-of-warranties" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">14. Disclaimer of Warranties</h2>
            <p className="text-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE AND ALL GENERATED CONTENT ARE PROVIDED {'\u201C'}AS IS{'\u201D'} AND {'\u201C'}AS AVAILABLE.{'\u201D'}
            </p>
            <p className="text-foreground mt-3">
              ECKBROS MEDIA LLC DISCLAIMS ALL EXPRESS, IMPLIED, AND STATUTORY WARRANTIES, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, RELIABILITY, AVAILABILITY, AND THAT THE SERVICE WILL BE SECURE, ERROR-FREE, OR UNINTERRUPTED.
            </p>
            <p className="text-foreground mt-3">
              SOME JURISDICTIONS DO NOT ALLOW CERTAIN WARRANTY DISCLAIMERS, SO SOME OF THESE DISCLAIMERS MAY NOT APPLY TO YOU.
            </p>
          </section>

          <section aria-labelledby="limitation-of-liability">
            <h2 id="limitation-of-liability" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">15. Limitation of Liability</h2>
            <p className="text-foreground">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, ECKBROS MEDIA LLC, BIBLELESSONSPARK, AND THEIR OWNERS, OFFICERS, EMPLOYEES, CONTRACTORS, AND SERVICE PROVIDERS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, REVENUE, DATA, GOODWILL, USE, MINISTRY OPPORTUNITY, OR OTHER INTANGIBLE LOSS, ARISING FROM OR RELATED TO THE SERVICE OR THESE TERMS.
            </p>
            <p className="text-foreground mt-3 mb-2">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE TOTAL AGGREGATE LIABILITY OF ECKBROS MEDIA LLC AND BIBLELESSONSPARK FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE GREATER OF:
            </p>
            <ol className="list-decimal pl-6 text-foreground space-y-1">
              <li>THE AMOUNT YOU PAID TO BIBLELESSONSPARK DURING THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM; OR</li>
              <li>ONE HUNDRED U.S. DOLLARS ($100).</li>
            </ol>
            <p className="text-foreground mt-3">
              THESE LIMITATIONS APPLY REGARDLESS OF THE LEGAL THEORY AND EVEN IF A REMEDY FAILS OF ITS ESSENTIAL PURPOSE.
            </p>
            <p className="text-foreground mt-3">
              SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIABILITY LIMITATIONS, SO SOME LIMITATIONS MAY NOT APPLY TO YOU.
            </p>
          </section>

          <section aria-labelledby="indemnification">
            <h2 id="indemnification" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">16. Indemnification</h2>
            <p className="text-foreground mb-2">
              To the extent permitted by law, you agree to defend, indemnify, and hold harmless EckBros Media LLC, BibleLessonSpark, and their owners, officers, employees, and contractors from claims, liabilities, damages, judgments, losses, and reasonable expenses, including attorneys{'\u2019'} fees, arising from:
            </p>
            <ul className="list-disc pl-6 text-foreground space-y-1">
              <li>Your unlawful or unauthorized use of the Service;</li>
              <li>Your material violation of these Terms;</li>
              <li>Your inputs or use of generated content;</li>
              <li>Your infringement of another person{'\u2019'}s rights; or</li>
              <li>An Organization{'\u2019'}s or Team{'\u2019'}s internal membership, authorization, or content dispute for which you are responsible.</li>
            </ul>
            <p className="text-foreground mt-3">
              This section does not require indemnification for our own fraud, willful misconduct, or liability that cannot lawfully be shifted.
            </p>
          </section>

          <section aria-labelledby="changes-to-these-terms">
            <h2 id="changes-to-these-terms" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">17. Changes to These Terms</h2>
            <p className="text-foreground">
              We may update these Terms as the Service, law, or business practices change.
            </p>
            <p className="text-foreground mt-3">
              We will post revised Terms with a new {'\u201C'}Last Updated{'\u201D'} date. For a material change, we will provide notice by email, in-product message, or another prominent method at least 14 days before the change takes effect when practicable.
            </p>
            <p className="text-foreground mt-3">
              Changes addressing security, abuse, legal requirements, or newly introduced optional features may take effect sooner when reasonably necessary.
            </p>
            <p className="text-foreground mt-3">
              Your continued use after revised Terms take effect constitutes acceptance. If you do not agree to a material change, you must stop using the Service and cancel any subscription before the next renewal.
            </p>
          </section>

          <section aria-labelledby="governing-law-and-venue">
            <h2 id="governing-law-and-venue" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">18. Governing Law and Venue</h2>
            <p className="text-foreground">
              These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law rules.
            </p>
            <p className="text-foreground mt-3">
              Subject to any applicable small-claims right or law that requires otherwise, the state and federal courts serving Nacogdoches County, Texas, will have exclusive jurisdiction over disputes arising from or related to these Terms or the Service. You and EckBros Media LLC consent to personal jurisdiction and venue in those courts.
            </p>
            <p className="text-foreground mt-3">
              These Terms do not require arbitration.
            </p>
          </section>

          <section aria-labelledby="general-terms">
            <h2 id="general-terms" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">19. General Terms</h2>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">19.1 Entire Agreement</h3>
            <p className="text-foreground">
              These Terms, the Privacy Policy, and purchase-specific terms presented at checkout constitute the agreement between you and us concerning the Service.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">19.2 Severability</h3>
            <p className="text-foreground">
              If a provision is found unenforceable, it will be enforced to the maximum lawful extent, and the remaining provisions will remain in effect.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">19.3 No Waiver</h3>
            <p className="text-foreground">
              Failure to enforce a provision is not a waiver of the right to enforce it later.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">19.4 Assignment</h3>
            <p className="text-foreground">
              You may not assign these Terms without our written consent. We may assign these Terms in connection with a merger, reorganization, financing, sale of assets, or transfer of the Service.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">19.5 Force Majeure</h3>
            <p className="text-foreground">
              We are not responsible for delay or failure caused by events beyond our reasonable control, including natural disasters, utility or Internet failures, labor disruptions, government action, war, civil unrest, cyberattacks, or failures of third-party providers.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">19.6 Electronic Communications</h3>
            <p className="text-foreground">
              You consent to receive agreements, notices, disclosures, and other communications electronically. Electronic communications satisfy legal writing requirements to the extent permitted by law.
            </p>

            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 mt-4">19.7 Headings</h3>
            <p className="text-foreground">
              Headings are for convenience and do not limit interpretation.
            </p>
          </section>

          <section aria-labelledby="contact-information">
            <h2 id="contact-information" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">20. Contact Information</h2>
            <p className="text-foreground">
              <strong>BibleLessonSpark</strong><br />
              EckBros Media LLC<br />
              Nacogdoches, Texas, USA<br />
              <strong>Email:</strong> support@biblelessonspark.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
