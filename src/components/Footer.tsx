import { Link } from "react-router-dom";
import { SITE } from '@/config/site';
import { FOOTER_LINKS } from '@/config/footerLinks';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} LessonSparkUSA. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link 
              to={FOOTER_LINKS.legal.privacy} 
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to={FOOTER_LINKS.legal.terms} 
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Terms of Service
            </Link>
            <a 
              href={`mailto:${SITE.supportEmail}`} 
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
