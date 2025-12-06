import { Sparkles, Mail } from "lucide-react";
import { FOOTER_LINKS } from "@/config/footerLinks";
import { SITE } from "@/config/site";

export function Footer() {
  return (
    <footer className="bg-muted py-8 sm:py-10 lg:py-12 mt-auto">
      <div className="container px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <span className="font-semibold text-base sm:text-lg">
                Lesson<span className="text-secondary">Spark</span> USA
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Baptist Bible Study Enhancement Platform
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <a href={FOOTER_LINKS.product.features} className="hover:text-primary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href={FOOTER_LINKS.product.pricing} className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href={FOOTER_LINKS.product.setup} className="hover:text-primary transition-colors">
                  Setup Guide
                </a>
              </li>
              <li>
                <a href={FOOTER_LINKS.product.docs} className="hover:text-primary transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Support</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <a href={FOOTER_LINKS.support.help} className="hover:text-primary transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href={FOOTER_LINKS.support.contact} className="hover:text-primary transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href={FOOTER_LINKS.support.training} className="hover:text-primary transition-colors">
                  Training
                </a>
              </li>
              <li>
                <a href={FOOTER_LINKS.support.community} className="hover:text-primary transition-colors">
                  Community
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li>
                <a href={FOOTER_LINKS.legal.privacy} className="hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href={FOOTER_LINKS.legal.terms} className="hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href={FOOTER_LINKS.legal.cookie} className="hover:text-primary transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-xs sm:text-sm text-muted-foreground gap-3 sm:gap-0">
          <p>&copy; {new Date().getFullYear()} LessonSpark USA. All rights reserved.</p>
          <a 
            href={`mailto:${SITE.supportEmail}`}
            className="flex items-center gap-1.5 hover:text-primary transition-colors"
          >
            <Mail className="h-3.5 w-3.5" />
            {SITE.supportEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
