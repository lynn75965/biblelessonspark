/**
 * ToolbeltOneTruth.tsx
 * 
 * Tool 3: One-Truth Focus Finder
 * Helps teachers clarify the central truth their lesson is meant to anchor.
 * 
 * SSOT Compliance:
 * - Form inputs from toolbeltConfig.ts
 * - Voice guardrails enforced by Edge Function
 * 
 * @version 1.0.0
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  ONE_TRUTH_OPTIONS,
  TOOLBELT_ROUTES,
  type OneTruthFormData,
} from "@/constants/toolbeltConfig";

export default function ToolbeltOneTruth() {
  const tool = TOOLBELT_TOOLS['one-truth'];
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<OneTruthFormData>({
    scriptureScope: '',
    seemsMostCentral: '',
    wantLearnersToUnderstand: '',
    lessonFeels: '',
    closestSummary: '',
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Generate unique session ID for this tool use
  const [sessionId] = useState(() => crypto.randomUUID());

  const handleSelectChange = (field: keyof OneTruthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (field: keyof OneTruthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      formData.scriptureScope.trim().length > 0 &&
      formData.seemsMostCentral.trim().length > 0 &&
      formData.wantLearnersToUnderstand.trim().length > 0 &&
      formData.lessonFeels &&
      formData.closestSummary.trim().length > 0
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
          tool_id: 'one-truth',
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
          tool_id: 'one-truth',
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
      scriptureScope: '',
      seemsMostCentral: '',
      wantLearnersToUnderstand: '',
      lessonFeels: '',
      closestSummary: '',
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
                <CardTitle className="text-lg">Tell us about your lesson</CardTitle>
                <CardDescription>
                  Your answers help create a reflection that names the anchor you're already finding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scripture Scope */}
                <div className="space-y-2">
                  <Label htmlFor="scriptureScope">
                    Scripture scope
                  </Label>
                  <Textarea
                    id="scriptureScope"
                    placeholder="The passage or passages being taught (e.g., John 3:16-21)..."
                    value={formData.scriptureScope}
                    onChange={(e) => handleTextChange('scriptureScope', e.target.value)}
                    rows={2}
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.scriptureScope.length}/300
                  </p>
                </div>

                {/* Seems Most Central */}
                <div className="space-y-2">
                  <Label htmlFor="seemsMostCentral">
                    What seems most central?
                  </Label>
                  <Textarea
                    id="seemsMostCentral"
                    placeholder="What stands out to you as the main point..."
                    value={formData.seemsMostCentral}
                    onChange={(e) => handleTextChange('seemsMostCentral', e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.seemsMostCentral.length}/500
                  </p>
                </div>

                {/* Want Learners to Understand */}
                <div className="space-y-2">
                  <Label htmlFor="wantLearnersToUnderstand">
                    What do you want learners to understand?
                  </Label>
                  <Textarea
                    id="wantLearnersToUnderstand"
                    placeholder='The "aha" you&apos;re hoping for...'
                    value={formData.wantLearnersToUnderstand}
                    onChange={(e) => handleTextChange('wantLearnersToUnderstand', e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.wantLearnersToUnderstand.length}/500
                  </p>
                </div>

                {/* Lesson Feels */}
                <div className="space-y-2">
                  <Label htmlFor="lessonFeels">
                    How does the lesson currently feel?
                  </Label>
                  <Select
                    value={formData.lessonFeels}
                    onValueChange={(value) => handleSelectChange('lessonFeels', value)}
                  >
                    <SelectTrigger id="lessonFeels">
                      <SelectValue placeholder="Select how it feels" />
                    </SelectTrigger>
                    <SelectContent>
                      {ONE_TRUTH_OPTIONS.lessonFeels.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Closest Summary */}
                <div className="space-y-2">
                  <Label htmlFor="closestSummary">
                    Your closest one-sentence summary
                  </Label>
                  <Textarea
                    id="closestSummary"
                    placeholder="Your best attempt at the anchor statement..."
                    value={formData.closestSummary}
                    onChange={(e) => handleTextChange('closestSummary', e.target.value)}
                    rows={2}
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.closestSummary.length}/300
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
