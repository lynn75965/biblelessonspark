import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Mail,
  Sparkles,
  Users,
  Clock,
  FileText,
  Download,
  HelpCircle,
  ChevronRight,
  CheckCircle,
  Target,
  MessageSquare,
  Lightbulb,
  GraduationCap,
  Heart,
  Shield
} from "lucide-react";
import { SITE } from "@/config/site";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const Docs = () => {
  const lessonSections = [
    {
      number: 1,
      name: "Lens + Lesson Overview",
      words: "150-250",
      purpose: "Frames the lesson theologically and provides context for the teacher"
    },
    {
      number: 2,
      name: "Objectives + Key Scriptures",
      words: "150-250",
      purpose: "What students will learn and the biblical foundation"
    },
    {
      number: 3,
      name: "Theological Background",
      words: "450-600",
      purpose: "Deep teaching content for teacher preparation - all theology concentrated here"
    },
    {
      number: 4,
      name: "Opening Activities",
      words: "120-200",
      purpose: "Attention-getting introduction and warm-up engagement"
    },
    {
      number: 5,
      name: "Teaching Transcript",
      words: "450-600",
      purpose: "Spoken delivery script - what the teacher actually says in class"
    },
    {
      number: 6,
      name: "Interactive Activities",
      words: "150-250",
      purpose: "Hands-on reinforcement activities during the lesson"
    },
    {
      number: 7,
      name: "Discussion & Assessment",
      words: "200-300",
      purpose: "Comprehension checks and spiritual application questions"
    },
    {
      number: 8,
      name: "Student Handout",
      words: "250-400",
      purpose: "Printable takeaway for students - distinct from teacher materials"
    }
  ];

  const ageGroups = [
    {
      name: "Preschoolers (Ages 3-5)",
      attention: "5-7 minutes per activity",
      approach: "Concrete, literal thinking. Use 3-4 word sentences, tangible objects, hands-on crafts, movement songs, and simple stories with repetition."
    },
    {
      name: "Elementary Kids (Ages 6-10)",
      attention: "10-15 minutes per segment",
      approach: "Beginning abstract thinking. Interactive games, creative arts, drama, simple Scripture memorization, and relatable stories from school/home life."
    },
    {
      name: "Preteens & Middle Schoolers (Ages 11-14)",
      attention: "15-20 minutes with engagement",
      approach: "Developing abstract reasoning. Small group discussions, technology integration, real-world issues, and questions about feelings and identity."
    },
    {
      name: "High School (Ages 15-18)",
      attention: "20-30 minutes if engaged",
      approach: "Full abstract thinking. Socratic seminars, apologetics discussions, worldview analysis, and challenging questions about faith validity."
    },
    {
      name: "College & Early Career (Ages 19-25)",
      attention: "30-45 minutes with breaks",
      approach: "Mature abstract thinking. Case studies, theological debates, mentorship, and existential questions about calling and purpose."
    },
    {
      name: "Young Adults (Ages 26-35)",
      attention: "45-60 minutes",
      approach: "Peak cognitive function. Workshop-style teaching, real-life case studies, marriage/parenting applications, and practical how-to questions."
    },
    {
      name: "Mid-Life Adults (Ages 36-50)",
      attention: "60+ minutes",
      approach: "Wisdom-building phase. In-depth Bible study, book discussions, ministry leadership training, and mentoring younger adults."
    },
    {
      name: "Empty Nesters (Ages 51-65)",
      attention: "60+ minutes",
      approach: "Reflective and legacy-focused. Deep theological study, mentorship programs, and questions about significance and legacy."
    },
    {
      name: "Active Seniors (Ages 66-75)",
      attention: "45-60 minutes",
      approach: "Deep spiritual wisdom. Hymn-based teaching, testimony sharing, prayer ministry, and emphasis on encouragement and hope."
    },
    {
      name: "Senior Adults (Ages 76+)",
      attention: "30-45 minutes",
      approach: "Prioritize comfort and accessibility. Reflective teaching, prayer circles, memory-sharing, and focus on God's faithfulness."
    },
    {
      name: "Mixed Groups",
      attention: "30-45 minutes with variety",
      approach: "Design for multiple engagement levels. Multi-generational activities, mentor pairings, and questions that invite diverse perspectives."
    }
  ];

  const theologyProfiles = [
    {
      name: "Southern Baptist (BF&M 2000)",
      description: "The Baptist Faith and Message 2000 - the current SBC doctrinal statement emphasizing biblical inerrancy, complementarian roles, and the exclusivity of salvation through Christ."
    },
    {
      name: "Southern Baptist (BF&M 1963)",
      description: "The Baptist Faith and Message 1963 - the previous SBC statement with similar core doctrines but different emphases on certain secondary issues."
    },
    {
      name: "Reformed Baptist",
      description: "Emphasizes the doctrines of grace (TULIP), covenant theology, and the 1689 London Baptist Confession while maintaining Baptist distinctives."
    },
    {
      name: "Independent Baptist",
      description: "Emphasizes local church autonomy, traditional worship, KJV preference, and separation from worldliness while maintaining fundamental Baptist beliefs."
    }
  ];

  const faqs = [
    {
      question: "How long does lesson generation take?",
      answer: "Approximately 76 seconds. LessonSparkUSA generates a complete 8-section lesson with 2,000-2,800 words of original content tailored to your specifications."
    },
    {
      question: "Can I edit the generated lessons?",
      answer: "Absolutely! Lessons are starting points designed to save you time. Export to PDF or DOCX and edit in your preferred word processor to add your personal touches."
    },
    {
      question: "What if I find a theological error?",
      answer: "While our lessons are reviewed for doctrinal accuracy, please report any concerns immediately. Use the feedback button on your dashboard or email us directly. Your input helps us improve."
    },
    {
      question: "Can I use my own curriculum as a starting point?",
      answer: "Yes! You can upload existing curriculum (PDF, DOCX, TXT, or JPG up to 10MB) and BibleLessonSpark will enhance it with age-appropriate activities, discussion questions, and applications."
    },
    {
      question: "What Bible translations are supported?",
      answer: "We support all major translations. LessonSparkUSA will use Scripture references appropriate for your selected age group and theological tradition."
    },
    {
      question: "Can I generate lessons in Spanish or French?",
      answer: "Yes! BibleLessonSpark supports English, Spanish, and French. Set your preferred language in your account settings."
    },
    {
      question: "What is the Student Teaser feature?",
      answer: "When enabled, the Student Teaser generates a 50-100 word preview you can send to students before class. It builds anticipation without revealing lesson content - perfect for group texts or emails."
    },
    {
      question: "How do the theological lenses work?",
      answer: "Your selected theological lens invisibly guides LessonSparkUSA to align all content with your tradition's distinctives. The theology is woven naturally into the lesson rather than stated explicitly."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container max-w-5xl py-12">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <span>Documentation</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-primary">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Documentation</h1>
              <p className="text-muted-foreground">Everything you need to create exceptional Bible studies</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl py-12 space-y-16 flex-1">

        {/* Getting Started */}
        <section id="getting-started">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Getting Started</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-white">Step 1</Badge>
                </div>
                <CardTitle className="text-lg mt-2">Create Your Account</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Sign up with your email address. You will receive a confirmation email to verify your account.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-white">Step 2</Badge>
                </div>
                <CardTitle className="text-lg mt-2">Set Your Preferences</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Choose your theological lens (SBC, Reformed Baptist, etc.), preferred language, and default age group.
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-white">Step 3</Badge>
                </div>
                <CardTitle className="text-lg mt-2">Generate Your First Lesson</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Enter a Bible passage or topic, select your age group, and click Generate. Your lesson will be ready in about 76 seconds.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How to Generate a Lesson */}
        <section id="generate-lesson">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold">How to Generate a Lesson</h2>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h3 className="font-semibold">Enter Your Content</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enter a Bible passage (e.g., "John 3:16-21" or "Psalm 23") OR a topic (e.g., "God's Love" or "Forgiveness"). You can also upload existing curriculum to enhance.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h3 className="font-semibold">Select Your Age Group</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose from 11 age groups ranging from Preschoolers to Senior Adults. Each generates content with appropriate vocabulary, activities, and applications.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h3 className="font-semibold">Add Optional Customizations</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add teacher notes for specific class needs, enable the Student Teaser for pre-class engagement, or expand the Lesson Customization section for more options.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">4</div>
                  <div>
                    <h3 className="font-semibold">Generate and Export</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Click "Generate Lesson" and wait approximately 76 seconds. Review your lesson, then export as PDF or DOCX for printing or further editing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 8-Section Lesson Format */}
        <section id="lesson-format">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold">The 8-Section Lesson Format</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Every lesson follows our proven 8-section structure, designed to give teachers everything they need while eliminating redundancy. Total lesson length: 2,000-2,800 words.
          </p>

          <div className="grid gap-3">
            {lessonSections.map((section) => (
              <Card key={section.number} className="overflow-hidden">
                <div className="flex">
                  <div className="flex-shrink-0 w-16 bg-gradient-primary flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{section.number}</span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold">{section.name}</h3>
                      <Badge variant="outline" className="text-xs">{section.words} words</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{section.purpose}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Age Group Profiles */}
        <section id="age-groups">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold">Age Group Profiles</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Each age group generates content tailored to cognitive development, attention span, vocabulary level, and appropriate activities.
          </p>

          <Accordion type="single" collapsible className="w-full">
            {ageGroups.map((group, index) => (
              <AccordionItem key={index} value={`age-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span>{group.name}</span>
                    <Badge variant="secondary" className="text-xs ml-2">{group.attention}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {group.approach}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Theological Lenses */}
        <section id="theology">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold">Theological Lenses</h2>
          </div>

          <p className="text-muted-foreground mb-6">
            Your theological lens invisibly guides every lesson to align with your tradition's distinctives. The theology is woven naturally into the content.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {theologyProfiles.map((profile, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary" />
                    {profile.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{profile.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Exporting Lessons */}
        <section id="export">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Download className="h-5 w-5 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold">Exporting Your Lessons</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">PDF Export</CardTitle>
                <CardDescription>Best for printing and sharing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Print-ready formatting</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Consistent appearance on all devices</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Easy to email or share</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DOCX Export</CardTitle>
                <CardDescription>Best for editing and customization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Editable in Microsoft Word or Google Docs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Add your own notes and modifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Reformat to match your church's style</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <HelpCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="hover:no-underline text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Contact Support */}
        <section className="text-center pt-8 border-t">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted mb-4">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            We are here to help you succeed in your teaching ministry.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg" asChild>
              <a href={`mailto:${SITE.supportEmail}`} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Support
              </a>
            </Button>
            <Button asChild size="lg">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </section>

      </div>

      {/* Footer - SSOT Component */}
      <Footer />
    </div>
  );
};

export default Docs;

