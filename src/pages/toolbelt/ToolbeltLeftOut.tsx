/**
 * ToolbeltLeftOut.tsx
 * 
 * Tool 2: What Can Be Left Out Safely?
 * Helps teachers identify what is essential in a lesson and what can be set aside.
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
  LEFT_OUT_OPTIONS,
  TOOLBELT_ROUTES,
  type LeftOutFormData,
} from "@/constants/toolbeltConfig";

export default function ToolbeltLeftOut() {
  const tool = TOOLBELT_TOOLS['left-out'];
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<LeftOutFormData>({
    mustBeUnderstood: '',
    staysNextWeek: '',
    feelsHeavy: [],
    usuallyHappens: '',
    simplifyingConcern: '',
  });

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [reflection, setReflection] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Generate unique session ID for this tool use
  const [sessionId] = useState(() => crypto.randomUUID());

  const handleSelectChange = (field: keyof LeftOutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (field: keyof LeftOutFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFeelsHeavyToggle = (item: string) => {
    setFormData(prev => ({
      ...prev,
      feelsHeavy: prev.feelsHeavy.includes(item)
        ? prev.feelsHeavy.filter(i => i !== item)
        : [...prev.feelsHeavy, item],
    }));
  };

  const isFormValid = () => {
    return (
      formData.mustBeUnderstood.trim().length > 0 &&
      formData.staysNextWeek.trim().length > 0 &&
      formData.feelsHeavy.length > 0 &&
      formData.usuallyHappens &&
      formData.simplifyingConcern.trim().length > 0
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
          tool_id: 'left-out',
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
          tool_id: 'left-out',
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
      mustBeUnderstood: '',
      staysNextWeek: '',
      feelsHeavy: [],
      usuallyHappens: '',
      simplifyingConcern: '',
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
                  Your answers help create a reflection that honors what matters most.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Must Be Understood */}
                <div className="space-y-2">
                  <Label htmlFor="mustBeUnderstood">
                    What must be understood today?
                  </Label>
                  <Textarea
                    id="mustBeUnderstood"
                    placeholder="The non-negotiable truth your class needs to grasp..."
                    value={formData.mustBeUnderstood}
                    onChange={(e) => handleTextChange('mustBeUnderstood', e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.mustBeUnderstood.length}/500
                  </p>
                </div>

                {/* Stays Next Week */}
                <div className="space-y-2">
                  <Label htmlFor="staysNextWeek">
                    What do you hope stays with them next week?
                  </Label>
                  <Textarea
                    id="staysNextWeek"
                    placeholder="The lasting impact you're hoping for..."
                    value={formData.staysNextWeek}
                    onChange={(e) => handleTextChange('staysNextWeek', e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.staysNextWeek.length}/500
                  </p>
                </div>

                {/* Feels Heavy (Multi-select) */}
                <div className="space-y-3">
                  <Label>What feels heavy in this lesson? (Select all that apply)</Label>
                  <div className="space-y-2">
                    {LEFT_OUT_OPTIONS.feelsHeavy.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={option.value}
                          checked={formData.feelsHeavy.includes(option.value)}
                          onCheckedChange={() => handleFeelsHeavyToggle(option.value)}
                        />
                        <Label htmlFor={option.value} className="font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Usually Happens */}
                <div className="space-y-2">
                  <Label htmlFor="usuallyHappens">
                    When lessons feel too full, what usually happens?
                  </Label>
                  <Select
                    value={formData.usuallyHappens}
                    onValueChange={(value) => handleSelectChange('usuallyHappens', value)}
                  >
                    <SelectTrigger id="usuallyHappens">
                      <SelectValue placeholder="Select what happens" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEFT_OUT_OPTIONS.usuallyHappens.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Simplifying Concern */}
                <div className="space-y-2">
                  <Label htmlFor="simplifyingConcern">
                    What concerns you about simplifying?
                  </Label>
                  <Textarea
                    id="simplifyingConcern"
                    placeholder="What holds you back from leaving things out..."
                    value={formData.simplifyingConcern}
                    onChange={(e) => handleTextChange('simplifyingConcern', e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.simplifyingConcern.length}/500
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
