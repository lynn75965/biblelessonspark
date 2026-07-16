import { BRANDING } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft } from "lucide-react";

const LEGAL_LINKS = [
  { label: "Privacy Policy", route: ROUTES.PRIVACY, description: "How we collect, use, and protect your information." },
  { label: "Terms of Service", route: ROUTES.TERMS, description: "The agreement governing your use of BibleLessonSpark." },
  { label: "Cookie Policy", route: ROUTES.COOKIE, description: "What cookies and storage technologies we use." },
];

export default function Legal() {
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

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 sm:mb-6">Legal</h1>
        <p className="text-foreground mb-8">
          Review our governing policies below.
        </p>

        <ul className="space-y-3 list-none pl-0">
          {LEGAL_LINKS.map((item) => (
            <li key={item.route}>
              <Link
                to={item.route}
                className="block rounded-md border border-border p-4 hover:bg-muted transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              >
                <span className="font-semibold text-foreground">{item.label}</span>
                <span className="block text-sm text-muted-foreground mt-1">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
