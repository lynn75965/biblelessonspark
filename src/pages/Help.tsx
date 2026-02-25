import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { BRANDING } from "@/config/branding";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  HelpCircle, 
  Mail, 
  BookOpen, 
  Sparkles, 
  Receipt, 
  Download,
  Settings,
  AlertCircle,
  CheckCircle,
  MessageSquare,
  Church
} from "lucide-react";
import { BRANDING } from "@/config/branding";
import { ROUTES } from "@/constants/routes";

const Help = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Scroll to section via ?scrollTo= query parameter, React Router state, or #hash
  useEffect(() => {
    const scrollTarget = searchParams.get('scrollTo') ||
      (location.state as any)?.scrollTo || 
      (location.hash ? location.hash.substring(1) : null);
    
    if (scrollTarget) {
      const scrollToElement = () => {
        const element = document.getElementById(scrollTarget);
        if (element) {
          // Use both methods for maximum compatibility
          const yOffset = element.getBoundingClientRect().top + window.pageYOffset - 20;
          window.scrollTo({ top: yOffset, behavior: 'smooth' });
        }
      };
      
      // Retry aggressively -- page must fully render before scroll works
      const attempts = [200, 500, 1000, 1500, 2500];
      const timers = attempts.map((delay) => setTimeout(scrollToElement, delay));
      return () => timers.forEach(clearTimeout);
    }
  }, [searchParams, location.state, location.hash]);
  const quickLinks = [
    {
      title: "Getting Started",
      description: "New to BibleLessonSpark? Start here",
      icon: BookOpen,
      href: "/docs"
    },
    {
      title: "Generate Lessons",
      description: "How to create your first lesson",
      icon: Sparkles,
      href: "/docs#generate"
    },
    {
      title: "Subscription Plans",
      description: "Understanding your lesson allowance",
      icon: Receipt,
      href: "/docs#subscription"
    },
    {
      title: "Export Options",
      description: "Download and print your lessons",
      icon: Download,
      href: "/docs#export"
    }
  ];

  const faqs = [
    {
      category: "Account & Access",
      slug: "account-access",
      icon: CheckCircle,
      questions: [
        {
          q: "How do I create an account?",
          a: "Click 'Get Started' on the homepage, then sign up with your email address. You'll receive a verification email to confirm your account. Once verified, you can access your dashboard and start generating lessons."
        },
        {
          q: "I forgot my password. How do I reset it?",
          a: "On the sign-in page, click 'Forgot Password' and enter your email address. You'll receive a password reset link within a few minutes. Check your spam folder if you don't see it."
        },
        {
          q: "Can multiple teachers share one account?",
          a: "We recommend each teacher have their own account to track individual lesson history and preferences. Organizations can set up team accounts - contact us for details."
        }
      ]
    },
    {
      category: "Generating Lessons",
      slug: "generating-lessons",
      icon: CheckCircle,
      questions: [
        {
          q: "How long does it take to generate a lesson?",
          a: "Most lessons are generated in approximately 76 seconds. Complex lessons with extensive customization may take slightly longer. You'll see a progress indicator while your lesson is being created."
        },
        {
          q: "What information do I need to provide?",
          a: "At minimum, you need a Bible passage or topic. For best results, also select your target age group and theological lens. You can optionally upload existing curriculum materials to enhance."
        },
        {
          q: "Can I use my own curriculum materials?",
          a: "Yes! You can upload PDF, DOCX, TXT, or image files (up to 10MB) of your existing curriculum. BibleLessonSpark will enhance and expand your materials while maintaining theological consistency."
        },
        {
          q: "What Bible translations are supported?",
          a: "BibleLessonSpark supports all major Bible translations including KJV, NIV, ESV, NASB, NLT, and CSB. Select your preferred translation in your account settings."
        }
      ]
    },
    {
      category: "Lesson Content",
      slug: "lesson-content",
      icon: CheckCircle,
      questions: [
        {
          q: "What is included in each lesson?",
          a: "Every lesson includes 8 sections: Theological Lens & Overview, Objectives & Key Scriptures, Theological Background, Opening Activities, Teaching Transcript, Interactive Activities, Discussion & Assessment, and a Student Handout."
        },
        {
          q: "Can I edit the generated lessons?",
          a: "Absolutely! Export your lesson as a Word document (.docx) and edit freely. You retain full ownership of all content you create or modify."
        },
        {
          q: "What if I find a theological error?",
          a: "Please report it immediately using the feedback button or email us at " + BRANDING.contact.supportEmail + ". We take theological accuracy seriously and will review and address any concerns promptly."
        },
        {
          q: "Are lessons available in Spanish or French?",
          a: "Yes! Set your preferred language in Account Settings. Lessons will be generated in your selected language while maintaining theological accuracy."
        }
      ]
    },
    // --- Organizations & Shepherds (Self-Service Shepherd Entry) ---
    {
      category: "Organizations & Shepherds",
      slug: "organizations-shepherds",
      icon: Church,
      questions: [
        {
          q: "What is a Shepherd subscription?",
          a: "A Shepherd subscription lets pastors and ministry leaders create an organization on BibleLessonSpark. Your organization gets a shared lesson pool that all your teachers can draw from, plus tools to set a Shared Focus and monitor lesson activity across your teaching ministry."
        },
        {
          q: "How do I set up an organization?",
          a: "Visit biblelessonspark.com/org or click 'Set Up Your Ministry Organization' on your dashboard. You'll enter your organization name and type, choose a Shepherd tier, and complete payment through Stripe. Your organization is live within seconds of checkout."
        },
        {
          q: "What are the Shepherd tiers?",
          a: "There are five tiers based on your ministry's lesson needs: Single Staff, Starter, Growth, Develop, and Expansion. Every tier includes unlimited teachers -- you're paying for lesson pool capacity, not per-seat fees. Visit biblelessonspark.com/org to compare tiers and pricing."
        },
        {
          q: "How does the shared lesson pool work?",
          a: "Your Shepherd tier provides a monthly pool of lessons (for example, Growth includes 100 lessons/month). Any teacher in your organization can generate lessons from this pool. The pool resets each month, and you can purchase Lesson Packs if you need more mid-month."
        },
        {
          q: "How do I invite teachers to my organization?",
          a: "From your Org Manager Dashboard, use the Invite Members feature to send email invitations. Teachers accept the invitation and are automatically linked to your organization. They'll see your Shared Focus and draw from your lesson pool when generating lessons."
        },
        {
          q: "What is a Shared Focus?",
          a: "A Shared Focus is a suggested Bible passage, topic, or theme you set for your teaching team. When your teachers open the lesson builder, they'll see your suggestion and can choose to follow it or teach their own calling. It's a gentle shepherd's nudge -- not a mandate."
        },
        {
          q: "Do my teachers also need Personal subscriptions?",
          a: "Teachers need their own BibleLessonSpark account (free to create). When they generate lessons through your organization's pool, those lessons count against your Shepherd pool -- not a personal allowance. If a teacher also wants to generate personal lessons outside your org, they would need their own Personal subscription."
        },
        {
          q: "Do I need a Personal subscription as the Shepherd?",
          a: "Yes. The Shepherd tier covers your organization's shared pool and management tools. For your own lesson preparation and devotionals, you also need a Personal subscription ($9/month or $90/year). If you don't already have one, it's automatically added at checkout when you set up your organization."
        },
        {
          q: "Can I have more than one organization?",
          a: "Currently, each account can manage one organization. If you lead multiple ministries, contact us at support@biblelessonspark.com and we'll work with you to find the best arrangement."
        },
        {
          q: "What happens if I cancel my Shepherd subscription?",
          a: "If you cancel, your organization's lesson pool will stop renewing at the end of your current billing period. Your teachers' accounts and any lessons already generated remain accessible. You can resubscribe at any time to reactivate your pool."
        }
      ]
    },
    {
      category: "Subscription & Billing",
      slug: "subscription-billing",
      icon: CheckCircle,
      questions: [
        {
          q: "How do subscriptions work?",
          a: "A Personal subscription provides 20 lessons monthly. Additional subscription options are available. Contact support@biblelessonspark.com for details."
        },
        {
          q: "What happens if I reach my monthly lesson limit?",
          a: "You'll be notified when approaching your limit. You can purchase Lesson Packs or upgrade your plan for additional lessons. Your existing lessons remain accessible regardless of your current allowance."
        },
        {
          q: "Can I get a refund?",
          a: "Subscription fees are generally non-refundable. However, if you experience technical issues preventing lesson generation, contact us and we'll make it right."
        }
      ]
    },
    {
      category: "Technical Issues",
      slug: "technical-issues",
      icon: CheckCircle,
      questions: [
        {
          q: "My lesson is taking too long to generate. What should I do?",
          a: "If generation exceeds 2 minutes, try refreshing the page and starting again. If the problem persists, your lesson will not be counted against your allowance. Contact support if issues continue."
        },
        {
          q: "The exported PDF looks different than the preview.",
          a: "This can happen with certain browsers. Try using Chrome for best results, or export as DOCX instead. Clear your browser cache if formatting issues persist."
        },
        {
          q: "I can't upload my curriculum file.",
          a: "Ensure your file is under 10MB and in a supported format (PDF, DOCX, TXT, JPG, PNG). If the file is too large, try compressing it or splitting into smaller sections."
        }
      ]
    }
  ];

  const troubleshooting = [
    {
      issue: "Page won't load",
      solution: "Clear your browser cache, disable extensions, or try a different browser. Chrome works best with BibleLessonSpark."
    },
    {
      issue: "Can't sign in",
      solution: "Verify your email is correct, check caps lock, and try the password reset option. Contact support if problems persist."
    },
    {
      issue: "Lesson generation fails",
      solution: "Check your internet connection, verify your subscription is active, and try with a simpler passage first."
    },
    {
      issue: "Export not downloading",
      solution: "Check your browser's download settings and ensure pop-ups aren't blocked. Try right-clicking and 'Save As'."
    }
  ];

  return (
    <div className={BRANDING.layout.pageWrapper}>
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container max-w-5xl py-12">
          <div className="text-center space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text">Help Center</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions and get the support you need to create effective Bible study lessons.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-5xl py-12 space-y-12 flex-1">
        {/* Quick Links */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map((link, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{link.description}</CardDescription>
                  <Button asChild variant="link" className="px-0 mt-2">
                    <Link to={link.href}>Learn more ?</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQs by Category */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-8">
            {faqs.map((category, catIndex) => {
              const CategoryIcon = category.icon;
              return (
                <div key={catIndex} id={category.slug}>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                    {category.category}
                  </h3>
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((faq, faqIndex) => (
                      <AccordionItem key={faqIndex} value={`${catIndex}-${faqIndex}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="hover:no-underline text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </div>
        </section>

        {/* Troubleshooting */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-warning" />
            Quick Troubleshooting
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {troubleshooting.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-destructive">{item.issue}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.solution}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="text-center pt-8 border-t">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Still Need Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to assist you with any questions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <a href={`mailto:${BRANDING.contact.supportEmail}`} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Support
              </a>
            </Button>
            <Button asChild size="lg">
              <Link to={ROUTES.DASHBOARD}>Go to Dashboard</Link>
            </Button>
          </div>
        </section>
      </div>

      {/* Footer - SSOT Component */}
      <Footer />
    </div>
  );
};

export default Help;

