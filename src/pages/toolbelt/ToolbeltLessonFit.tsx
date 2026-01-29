/**
 * ToolbeltLessonFit.tsx
 * 
 * Tool 1: Does This Lesson Fit My Class?
 * Helps teachers name why a lesson feels mismatched before they start rewriting.
 * 
 * SSOT Compliance:
 * - Form inputs from toolbeltConfig.ts
 * - Voice guardrails enforced by Edge Function
 * 
 * @version 1.0.1 - Fixed property names to match SSOT
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Mail, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import {
  TOOLBELT_TOOLS,
  LESSON_FIT_OPTIONS,
  TOOLBELT_ROUTES,
  type LessonFitFormData,
} from "@/constants/toolbeltConfig";

export default function ToolbeltLessonFit() {
  const tool = TOOLBELT_TOOLS['lesson-fit'];
  const { toast } = useToast();

  // Form state - uses SSOT property names from toolbeltConfig.ts
  const [formData, setFormData] = useState<LessonFitFormData>({
    bibleFamiliarity: '',
    engagementLevel: '',
    timeAvailable: '',
    teachingEnvironment: '',
    concernsAboutLesson: [],
    primaryWorry: '',
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Generate unique session ID for this tool use
  const [sessionId] = useState(() => crypto.randomUUID());

  const handleSelectChange = (field: keyof LessonFitFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConcernToggle = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      concernsAboutLesson: prev.concernsAboutLesson.includes(concern)
        ? prev.concernsAboutLesson.filter(c => c !== concern)
        : [...prev.concernsAboutLesson, concern],
    }));
  };

  const isFormValid = () => {
    return (
      formData.bibleFamiliarity &&
      formData.engagementLevel &&
      formData.timeAvailable &&
      formData.teachingEnvironment &&
      formData.concernsAboutLesson.length > 0 &&
      formData.primaryWorry.trim().length > 0
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      toast({
        title: "Please complete all fields",
        description: "All questions help create a more helpful reflection.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setReflection(null);

    try {
      const { data, error } = await supabase.functions.invoke('toolbelt-reflect', {
        body: {
          tool_id: 'lesson-fit',
          session_id: sessionId,
          form_data: formData,
        },
      });

      if (error) throw error;

      if (data?.success && data?.reflection) {
        setReflection(data.reflection);
      } else {
        throw new Error(data?.error || 'Failed to generate reflection');
      }
    } catch (err) {
      console.error('Reflection error:', err);
      toast({
        title: "Something went wrong",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!email || !reflection) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-toolbelt-reflection', {
        body: {
          email,
          tool_id: 'lesson-fit',
          reflection,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setEmailSent(true);
        toast({
          title: "Reflection sent",
          description: "Check your inbox for a copy of your reflection.",
        });
      } else {
        throw new Error(data?.error || 'Failed to send email');
      }
    } catch (err) {
      console.error('Email error:', err);
      toast({
        title: "Couldn't send email",
        description: "Please try again or copy the reflection manually.",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleStartOver = () => {
    setReflection(null);
    setEmail('');
    setEmailSent(false);
    setFormData({
      bibleFamiliarity: '',
      engagementLevel: '',
      timeAvailable: '',
      teachingEnvironment: '',
      concernsAboutLesson: [],
      primaryWorry: '',
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Back Link */}
          <Link 
            to={TOOLBELT_ROUTES.landing}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Toolbelt
          </Link>

          {/* Tool Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
              {tool.name}
            </h1>
            <p className="text-muted-foreground">
              {tool.description}
            </p>
          </div>

          {/* Form or Reflection */}
          {!reflection ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tell us about your class and lesson</CardTitle>
                <CardDescription>
                  Your answers help create a reflection that honors your discernment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bible Familiarity */}
                <div className="space-y-2">
                  <Label htmlFor="bibleFamiliarity">
                    Class familiarity with the Bible
                  </Label>
                  <Select
                    value={formData.bibleFamiliarity}
                    onValueChange={(value) => handleSelectChange('bibleFamiliarity', value)}
                  >
                    <SelectTrigger id="bibleFamiliarity">
                      <SelectValue placeholder="Select familiarity level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_FIT_OPTIONS.bibleFamiliarity.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Engagement Level */}
                <div className="space-y-2">
                  <Label htmlFor="engagementLevel">
                    Typical engagement level
                  </Label>
                  <Select
                    value={formData.engagementLevel}
                    onValueChange={(value) => handleSelectChange('engagementLevel', value)}
                  >
                    <SelectTrigger id="engagementLevel">
                      <SelectValue placeholder="Select engagement level" />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_FIT_OPTIONS.engagementLevel.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Time Available */}
                <div className="space-y-2">
                  <Label htmlFor="timeAvailable">
                    Time available for this lesson
                  </Label>
                  <Select
                    value={formData.timeAvailable}
                    onValueChange={(value) => handleSelectChange('timeAvailable', value)}
                  >
                    <SelectTrigger id="timeAvailable">
                      <SelectValue placeholder="Select time available" />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_FIT_OPTIONS.timeAvailable.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Teaching Environment */}
                <div className="space-y-2">
                  <Label htmlFor="teachingEnvironment">
                    Teaching environment
                  </Label>
                  <Select
                    value={formData.teachingEnvironment}
                    onValueChange={(value) => handleSelectChange('teachingEnvironment', value)}
                  >
                    <SelectTrigger id="teachingEnvironment">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent>
                      {LESSON_FIT_OPTIONS.teachingEnvironment.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Concerns (Multi-select) */}
                <div className="space-y-3">
                  <Label>What concerns you about this lesson? (Select all that apply)</Label>
                  <div className="space-y-2">
                    {LESSON_FIT_OPTIONS.concernsAboutLesson.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={formData.concernsAboutLesson.includes(option.value)}
                          onCheckedChange={() => handleConcernToggle(option.value)}
                        />
                        <Label htmlFor={option.value} className="font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Worry */}
                <div className="space-y-2">
                  <Label htmlFor="primaryWorry">
                    What's your primary worry about this lesson?
                  </Label>
                  <Textarea
                    id="primaryWorry"
                    placeholder="Describe what's weighing on you most..."
                    value={formData.primaryWorry}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryWorry: e.target.value }))}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.primaryWorry.length}/500
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleSubmit}
                  disabled={!isFormValid() || isGenerating}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating your reflection...
                    </>
                  ) : (
                    'Get Reflection'
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Reflection Display */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-primary">{tool.headline}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground">
                    {reflection.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Email Capture */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Save this reflection
                  </CardTitle>
                  <CardDescription>
                    Email yourself a copy to reference later. We'll also send occasional 
                    encouragements for your teaching—unsubscribe anytime.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!emailSent ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        type="email"
                        placeholder="Your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendEmail}
                        disabled={!email || isSendingEmail}
                        variant="secondary"
                      >
                        {isSendingEmail ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Send to me'
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-primary">
                      <Check className="h-4 w-4 mr-2" />
                      Sent! Check your inbox.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleStartOver}
                  className="flex-1"
                >
                  Start Over
                </Button>
                <Button asChild variant="default" className="flex-1">
                  <Link to={TOOLBELT_ROUTES.landing}>
                    Back to Toolbelt
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
