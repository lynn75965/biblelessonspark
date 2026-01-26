import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Trash2, ChevronDown, ChevronUp, Code, FileText, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EmailTemplate {
  id: string;
  tenant_id: string;
  sequence_order: number;
  send_day: number;
  subject: string;
  body: string;
  is_active: boolean;
  is_html: boolean;
  created_at: string;
  updated_at: string;
}

// Brand colors for preview
const BRAND = {
  primaryGreen: "#3D5C3D",
  primaryGreenLight: "#4A6F4A",
  gold: "#D4A74B",
  cream: "#FFFEF9",
  darkText: "#1a1a1a",
  mutedText: "#666666",
  borderColor: "#e5e5e5",
};

// Generate preview HTML (same logic as Edge Function)
function generatePreviewHtml(subject: string, body: string, isHtml: boolean): string {
  let bodyHtml = body;
  
  if (!isHtml) {
    // Convert plain text to HTML
    bodyHtml = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Convert URLs to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    bodyHtml = bodyHtml.replace(urlRegex, (url) => {
      const cleanUrl = url.replace(/[.,;:!?)]+$/, "");
      const trailingChars = url.slice(cleanUrl.length);
      const isMainCta = cleanUrl.includes("/pricing") || 
                        cleanUrl.includes("/lesson-generator") ||
                        cleanUrl.includes("/preferences") ||
                        (cleanUrl === "https://biblelessonspark.com/" || cleanUrl === "https://biblelessonspark.com");
      
      if (isMainCta) {
        let buttonText = "Get Started →";
        if (cleanUrl.includes("/pricing")) buttonText = "View Pricing Plans →";
        if (cleanUrl.includes("/lesson-generator")) buttonText = "Create Your Lesson →";
        if (cleanUrl.includes("/preferences")) buttonText = "Set Up Your Profile →";
        
        return `</p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
            <tr>
              <td style="border-radius: 8px; background: ${BRAND.primaryGreen};">
                <a href="${cleanUrl}" target="_blank" style="background: ${BRAND.primaryGreen}; border: 1px solid ${BRAND.primaryGreen}; font-family: 'Georgia', serif; font-size: 16px; line-height: 1.5; text-decoration: none; padding: 14px 28px; color: #ffffff; border-radius: 8px; display: inline-block; font-weight: bold;">
                  ${buttonText}
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 0 0 16px 0; line-height: 1.7; color: ${BRAND.darkText};">${trailingChars}`;
      } else {
        return `<a href="${cleanUrl}" style="color: ${BRAND.primaryGreen}; text-decoration: underline;">${cleanUrl}</a>${trailingChars}`;
      }
    });

    // Convert bullet points
    bodyHtml = bodyHtml.replace(/^[•\-]\s+(.+)$/gm, `<li style="margin-bottom: 8px; color: ${BRAND.darkText};">$1</li>`);
    bodyHtml = bodyHtml.replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, (match) => {
      return `<ul style="margin: 16px 0; padding-left: 24px; color: ${BRAND.darkText};">${match}</ul>`;
    });

    // Convert paragraphs
    bodyHtml = bodyHtml.replace(/\n\n+/g, `</p><p style="margin: 0 0 16px 0; line-height: 1.7; color: ${BRAND.darkText};">`);
    bodyHtml = bodyHtml.replace(/\n/g, "<br>");
    bodyHtml = `<p style="margin: 0 0 16px 0; line-height: 1.7; color: ${BRAND.darkText};">${bodyHtml}</p>`;
    bodyHtml = bodyHtml.replace(/<p[^>]*>\s*<\/p>/g, "");
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 24px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px; background-color: ${BRAND.cream}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.primaryGreen} 0%, ${BRAND.primaryGreenLight} 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                ✦ BibleLessonSpark
              </h1>
              <p style="margin: 8px 0 0 0; font-family: Georgia, serif; font-size: 14px; color: rgba(255,255,255,0.9); font-style: italic;">
                Personalized Bible Studies in Minutes
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.7; color: ${BRAND.darkText};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f8f6; padding: 32px 40px; border-top: 1px solid ${BRAND.borderColor};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 12px 0; font-family: Georgia, serif; font-size: 14px; color: ${BRAND.mutedText};">
                      <strong style="color: ${BRAND.primaryGreen};">BibleLessonSpark</strong> — AI-powered lesson preparation for Baptist teachers
                    </p>
                    <p style="margin: 0; font-family: Georgia, serif; font-size: 12px; color: #999999;">
                      © ${new Date().getFullYear()} BibleLessonSpark. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function EmailSequenceManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('email_sequence_templates')
      .select('*')
      .eq('tenant_id', 'default')
      .order('sequence_order', { ascending: true });

    if (error) {
      toast({
        title: 'Error loading templates',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Ensure is_html has a default value
      const templatesWithDefaults = (data || []).map(t => ({
        ...t,
        is_html: t.is_html ?? false
      }));
      setTemplates(templatesWithDefaults);
    }
    setLoading(false);
  };

  const handleSave = async (template: EmailTemplate) => {
    setSaving(template.id);
    const { error } = await supabase
      .from('email_sequence_templates')
      .update({
        send_day: template.send_day,
        subject: template.subject,
        body: template.body,
        is_active: template.is_active,
        is_html: template.is_html,
        updated_at: new Date().toISOString(),
      })
      .eq('id', template.id);

    if (error) {
      toast({
        title: 'Error saving template',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Template saved',
        description: `Email ${template.sequence_order} updated successfully.`,
      });
    }
    setSaving(null);
  };

  const handleFieldChange = (id: string, field: keyof EmailTemplate, value: any) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleAddTemplate = async () => {
    const nextOrder = templates.length + 1;
    const lastTemplate = templates[templates.length - 1];
    const nextDay = lastTemplate ? lastTemplate.send_day + 7 : 0;

    const { data, error } = await supabase
      .from('email_sequence_templates')
      .insert({
        tenant_id: 'default',
        sequence_order: nextOrder,
        send_day: nextDay,
        subject: 'New Email Subject',
        body: 'Dear Friend,\n\nYour email content here.\n\nGrace and peace,\nThe BibleLessonSpark Team',
        is_active: true,
        is_html: false,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error adding template',
        description: error.message,
        variant: 'destructive',
      });
    } else if (data) {
      setTemplates([...templates, { ...data, is_html: data.is_html ?? false }]);
      setExpandedId(data.id);
      toast({
        title: 'Template added',
        description: `Email ${nextOrder} created. Edit and save to activate.`,
      });
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Delete email ${template.sequence_order}: "${template.subject}"?`)) {
      return;
    }

    const { error } = await supabase
      .from('email_sequence_templates')
      .delete()
      .eq('id', template.id);

    if (error) {
      toast({
        title: 'Error deleting template',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      toast({
        title: 'Template deleted',
        description: `Email ${template.sequence_order} has been removed.`,
      });
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handlePreview = (template: EmailTemplate) => {
    const html = generatePreviewHtml(template.subject, template.body, template.is_html);
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Email Sequence</h2>
          <p className="text-muted-foreground">
            Manage the automated onboarding emails sent to new users.
          </p>
        </div>
        <Button onClick={handleAddTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Email
        </Button>
      </div>

      <div className="text-sm bg-muted/50 p-4 rounded-lg space-y-2">
        <p><strong>Personalization:</strong> Use <code className="bg-muted px-1 rounded">{'{name}'}</code> for user's name, <code className="bg-muted px-1 rounded">{'{email}'}</code> for their email.</p>
        <p><strong>Plain Text Mode:</strong> URLs automatically become styled buttons. Use • or - for bullet lists.</p>
        <p><strong>HTML Mode:</strong> Full control over formatting. You write the HTML for the body content (header/footer added automatically).</p>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg bg-gray-100">
            <iframe
              srcDoc={previewHtml}
              className="w-full h-[600px] border-0"
              title="Email Preview"
            />
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
            <CardHeader
              className="cursor-pointer"
              onClick={() => toggleExpanded(template.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {template.sequence_order}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.subject}
                      {template.is_html && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">HTML</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Day {template.send_day} • {template.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                {expandedId === template.id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>

            {expandedId === template.id && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`day-${template.id}`}>Send on Day</Label>
                    <Input
                      id={`day-${template.id}`}
                      type="number"
                      min="0"
                      value={template.send_day}
                      onChange={(e) =>
                        handleFieldChange(template.id, 'send_day', parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id={`active-${template.id}`}
                      checked={template.is_active}
                      onCheckedChange={(checked) =>
                        handleFieldChange(template.id, 'is_active', checked)
                      }
                    />
                    <Label htmlFor={`active-${template.id}`}>Active</Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      id={`html-${template.id}`}
                      checked={template.is_html}
                      onCheckedChange={(checked) =>
                        handleFieldChange(template.id, 'is_html', checked)
                      }
                    />
                    <Label htmlFor={`html-${template.id}`} className="flex items-center gap-1">
                      {template.is_html ? <Code className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      {template.is_html ? 'HTML Mode' : 'Plain Text'}
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`subject-${template.id}`}>Subject Line</Label>
                  <Input
                    id={`subject-${template.id}`}
                    value={template.subject}
                    onChange={(e) =>
                      handleFieldChange(template.id, 'subject', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`body-${template.id}`}>
                      {template.is_html ? 'Email Body (HTML)' : 'Email Body (Plain Text)'}
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                  <Textarea
                    id={`body-${template.id}`}
                    value={template.body}
                    onChange={(e) =>
                      handleFieldChange(template.id, 'body', e.target.value)
                    }
                    rows={18}
                    className={`font-mono text-sm ${template.is_html ? 'bg-slate-50' : ''}`}
                    placeholder={template.is_html 
                      ? '<p style="margin: 0 0 16px 0;">Your HTML content here...</p>'
                      : 'Dear Friend,\n\nYour plain text content here...'
                    }
                  />
                  {template.is_html && (
                    <p className="text-xs text-muted-foreground">
                      Write only the body content HTML. The branded header and footer are added automatically.
                    </p>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(template)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    onClick={() => handleSave(template)}
                    disabled={saving === template.id}
                    className="gap-2"
                  >
                    {saving === template.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No email templates configured.</p>
          <Button onClick={handleAddTemplate} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Email
          </Button>
        </Card>
      )}
    </div>
  );
}
