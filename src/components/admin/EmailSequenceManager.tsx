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
import type { Database } from '@/integrations/supabase/types';

type EmailTemplate = Database['public']['Tables']['email_sequence_templates']['Row'];

// Brand colors
const BRAND = {
  primaryGreen: "#3D5C3D",
  primaryGreenLight: "#4A6F4A",
  cream: "#FFFEF9",
  darkText: "#1a1a1a",
  mutedText: "#666666",
  borderColor: "#e5e5e5",
};

// Get button text based on URL
function getButtonText(url: string): string {
  if (url.includes("/pricing")) return "View Pricing Plans →";
  if (url.includes("/lesson-generator")) return "Create Your Lesson →";
  if (url.includes("/preferences")) return "Set Up Your Profile →";
  if (url.includes("/help")) return "Get Help →";
  return "Get Started →";
}

// Convert plain text to HTML (matches Edge Function exactly)
function textToHtml(text: string): string {
  const lines = text.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    if (line === '') {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      continue;
    }
    
    line = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    const bulletMatch = line.match(/^[•\-]\s+(.+)$/);
    if (bulletMatch) {
      if (!inList) {
        htmlLines.push(`<ul style="margin: 12px 0; padding-left: 24px;">`);
        inList = true;
      }
      htmlLines.push(`<li style="margin-bottom: 6px; color: ${BRAND.darkText};">${bulletMatch[1]}</li>`);
      continue;
    }
    
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }
    
    const urlMatch = line.match(/^(https?:\/\/[^\s]+)$/);
    if (urlMatch) {
      const url = urlMatch[1].replace(/[.,;:!?)]+$/, "");
      const isMainCta = url.includes("/pricing") || 
                        url.includes("/lesson-generator") ||
                        url.includes("/preferences") ||
                        url === "https://biblelessonspark.com/" || 
                        url === "https://biblelessonspark.com";
      
      if (isMainCta) {
        htmlLines.push(`
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
  <tr>
    <td style="border-radius: 6px; background: ${BRAND.primaryGreen};">
      <a href="${url}" target="_blank" style="background: ${BRAND.primaryGreen}; font-family: Georgia, serif; font-size: 15px; text-decoration: none; padding: 12px 24px; color: #ffffff; border-radius: 6px; display: inline-block; font-weight: bold;">
        ${getButtonText(url)}
      </a>
    </td>
  </tr>
</table>`);
        continue;
      }
    }
    
    line = line.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      const cleanUrl = url.replace(/[.,;:!?)]+$/, "");
      const trailing = url.slice(cleanUrl.length);
      return `<a href="${cleanUrl}" style="color: ${BRAND.primaryGreen}; text-decoration: underline;">${cleanUrl}</a>${trailing}`;
    });
    
    htmlLines.push(`<p style="margin: 0 0 12px 0; line-height: 1.6; color: ${BRAND.darkText};">${line}</p>`);
  }
  
  if (inList) {
    htmlLines.push('</ul>');
  }
  
  return htmlLines.join('\n');
}

// Generate preview HTML
function generatePreviewHtml(subject: string, body: string, isHtml: boolean): string {
  const bodyHtml = isHtml ? body : textToHtml(body);

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
      <td style="padding: 20px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px; background-color: ${BRAND.cream}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.primaryGreen} 0%, ${BRAND.primaryGreenLight} 100%); padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #ffffff;">
                ✦ BibleLessonSpark
              </h1>
              <p style="margin: 6px 0 0 0; font-family: Georgia, serif; font-size: 13px; color: rgba(255,255,255,0.9); font-style: italic;">
                Personalized Bible Studies in Minutes
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 32px; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: ${BRAND.darkText};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f8f6; padding: 20px 32px; border-top: 1px solid ${BRAND.borderColor};">
              <p style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 13px; color: ${BRAND.mutedText}; text-align: center;">
                <strong style="color: ${BRAND.primaryGreen};">BibleLessonSpark</strong> — AI-powered lesson preparation for Baptist teachers
              </p>
              <p style="margin: 0; font-family: Georgia, serif; font-size: 11px; color: #999999; text-align: center;">
                © ${new Date().getFullYear()} BibleLessonSpark • <a href="https://biblelessonspark.com" style="color: #999999;">biblelessonspark.com</a>
              </p>
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
      toast({ title: 'Error loading templates', description: error.message, variant: 'destructive' });
    } else {
      setTemplates(data || []);
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
      toast({ title: 'Error saving template', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Template saved', description: `Email ${template.sequence_order} updated.` });
    }
    setSaving(null);
  };

  const handleFieldChange = (id: string, field: keyof EmailTemplate, value: unknown) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
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
      toast({ title: 'Error adding template', description: error.message, variant: 'destructive' });
    } else if (data) {
      setTemplates([...templates, data]);
      setExpandedId(data.id);
      toast({ title: 'Template added', description: `Email ${nextOrder} created.` });
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!confirm(`Delete email ${template.sequence_order}: "${template.subject}"?`)) return;

    const { error } = await supabase
      .from('email_sequence_templates')
      .delete()
      .eq('id', template.id);

    if (error) {
      toast({ title: 'Error deleting template', description: error.message, variant: 'destructive' });
    } else {
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      toast({ title: 'Template deleted' });
    }
  };

  const handlePreview = (template: EmailTemplate) => {
    const html = generatePreviewHtml(template.subject, template.body, template.is_html ?? false);
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
          <p className="text-muted-foreground">Automated onboarding emails for new users.</p>
        </div>
        <Button onClick={handleAddTemplate} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Email
        </Button>
      </div>

      <div className="text-sm bg-muted/50 p-4 rounded-lg space-y-1">
        <p><strong>Personalization:</strong> <code className="bg-muted px-1 rounded">{'{name}'}</code> = user's name</p>
        <p><strong>Plain Text:</strong> URLs on their own line → buttons. Lines starting with - or • → bullet lists.</p>
        <p><strong>HTML Mode:</strong> Full control. Use <code className="bg-muted px-1 rounded">&lt;p&gt;</code>, <code className="bg-muted px-1 rounded">&lt;strong&gt;</code>, <code className="bg-muted px-1 rounded">&lt;ul&gt;&lt;li&gt;</code> tags.</p>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-lg bg-gray-100">
            <iframe srcDoc={previewHtml} className="w-full h-[600px] border-0" title="Email Preview" />
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
            <CardHeader className="cursor-pointer" onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                    {template.sequence_order}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {template.subject}
                      {template.is_html && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">HTML</span>}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Day {template.send_day} • {template.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
                {expandedId === template.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </div>
            </CardHeader>

            {expandedId === template.id && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Send on Day</Label>
                    <Input
                      type="number"
                      min="0"
                      value={template.send_day}
                      onChange={(e) => handleFieldChange(template.id, 'send_day', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={template.is_active ?? true}
                      onCheckedChange={(checked) => handleFieldChange(template.id, 'is_active', checked)}
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch
                      checked={template.is_html ?? false}
                      onCheckedChange={(checked) => handleFieldChange(template.id, 'is_html', checked)}
                    />
                    <Label className="flex items-center gap-1">
                      {template.is_html ? <Code className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      {template.is_html ? 'HTML' : 'Plain Text'}
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subject Line</Label>
                  <Input
                    value={template.subject}
                    onChange={(e) => handleFieldChange(template.id, 'subject', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{template.is_html ? 'Email Body (HTML)' : 'Email Body (Plain Text)'}</Label>
                    <Button variant="outline" size="sm" onClick={() => handlePreview(template)} className="gap-1">
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                  <Textarea
                    value={template.body}
                    onChange={(e) => handleFieldChange(template.id, 'body', e.target.value)}
                    rows={16}
                    className={`font-mono text-sm ${template.is_html ? 'bg-slate-50' : ''}`}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(template)} className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button onClick={() => handleSave(template)} disabled={saving === template.id} className="gap-2">
                    {saving === template.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
