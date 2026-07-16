import { BRANDING } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft } from "lucide-react";

export default function Cookie() {
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

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last Updated: July 16, 2026</p>

        <div className="prose prose-blue max-w-none space-y-6">
          <section aria-labelledby="overview">
            <h2 id="overview" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">1. Overview</h2>
            <p className="text-foreground">
              This Cookie Policy explains what cookies and similar storage technologies BibleLessonSpark actually uses, and how they differ from the browser storage the Service also relies on.
            </p>
          </section>

          <section aria-labelledby="cookies-we-set">
            <h2 id="cookies-we-set" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">2. Cookies We Set</h2>
            <p className="text-foreground">
              BibleLessonSpark{'\u2019'}s own code sets one cookie: a preference cookie that remembers whether your sidebar navigation is open or collapsed between visits. This cookie is purely functional -- it does not identify you personally and is not used for analytics or advertising.
            </p>
          </section>

          <section aria-labelledby="storage-instead-of-cookies">
            <h2 id="storage-instead-of-cookies" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">3. What We Use Instead of Cookies</h2>
            <p className="text-foreground">
              For almost everything else, BibleLessonSpark uses browser storage technologies that are not cookies. Local storage keeps you signed in between visits -- your session is not stored in a cookie. Session storage holds a short-lived, randomly generated identifier used only to connect your own actions (such as viewing then clicking an upgrade prompt) within a single visit; see our Privacy Policy for more detail.
            </p>
            <p className="text-foreground mt-3">
              These technologies are not sent to third parties and are not used to track you across other websites.
            </p>
          </section>

          <section aria-labelledby="provider-cookies">
            <h2 id="provider-cookies" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">4. Cookies Set by Our Service Providers</h2>
            <p className="text-foreground">
              Some of the outside providers we rely on to operate BibleLessonSpark -- including Stripe for payments and the infrastructure that delivers our site securely -- may set their own cookies as part of providing their services. These are governed by those providers{'\u2019'} own policies, not this one, and we do not control them directly.
            </p>
          </section>

          <section aria-labelledby="no-analytics-cookies">
            <h2 id="no-analytics-cookies" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">5. We Do Not Use Analytics or Advertising Cookies</h2>
            <p className="text-foreground">
              BibleLessonSpark does not currently use analytics cookies, advertising cookies, or cross-site tracking technologies of any kind. If that changes in the future, we will update this Policy, and our Privacy Policy, before any such technology is enabled.
            </p>
          </section>

          <section aria-labelledby="your-choices">
            <h2 id="your-choices" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">6. Your Choices</h2>
            <p className="text-foreground">
              You can control or delete cookies through your browser settings. Because BibleLessonSpark{'\u2019'}s own use of cookies is limited to a single preference cookie, clearing it will simply reset your sidebar to its default state -- it will not sign you out or affect your account.
            </p>
          </section>

          <section aria-labelledby="contact-us">
            <h2 id="contact-us" className="text-xl sm:text-2xl font-semibold text-foreground mb-3">7. Contact Us</h2>
            <p className="text-foreground">
              If you have questions about this Cookie Policy, contact us at <strong>{BRANDING.contact.supportEmail}</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
