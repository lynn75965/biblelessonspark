/**
 * ToolbeltEmailManager.tsx
 * Manages email sequence templates for Teacher Toolbelt
 * Location: src/components/admin/toolbelt/ToolbeltEmailManager.tsx
 * 
 * CHANGELOG:
 * - Jan 29, 2026: Fixed bidirectional mode conversion to preserve paragraphs
 * - Jan 29, 2026: Added ReactQuill rich text editor with link toolbar
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronDown, ChevronUp, Eye, Save, Plus, Trash2, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Brand colors for email styling
const BRAND = {
  primaryGreen: "#3D5C3D",
  primaryGreenLight: "#4A6F4A",
  cream: "#FFFEF9",
  darkText: "#1a1a1a",
  mutedText: "#666666",
};

// Quill editor toolbar configuration - includes link button
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    ['link'],
    [{ 'align': [] }],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline',
  'list', 'bullet',
  'link',
  'align'
];

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

/**
 * Convert plain text to HTML for Quill editor
 * Preserves paragraph structure by converting double newlines to separate <p> tags
 */
function plainTextToHtml(text: string): string {
  if (!text) return '<p></p>';
  
  // Check if already has HTML tags - don't double-convert
  if (/<\/?[a-z][\s\S]*>/i.test(text)) {
    return text;
  }
  
  // Split by double newlines (paragraph breaks)
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map(para => {
    // Convert single newlines to <br> within paragraph
    let html = para.replace(/\n/g, '<br>');
    // Convert **bold** to <strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Convert *italic* to <em>
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return `<p>${html}</p>`;
  }).join('');
}

/**
 * Convert HTML back to plain text
 * Preserves paragraph structure by converting </p><p> to double newlines
 */
function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  let text = html;
  
  // Replace </p><p> with double newline (paragraph break)
  text = text.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  
  // Remove opening <p> tag
  text = text.replace(/<p[^>]*>/gi, '');
  
  // Remove closing </p> tag
  text = text.replace(/<\/p>/gi, '');
  
  // Convert <br> to single newline
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Convert <strong> to **bold**
  text = text.replace(/<strong>(.+?)<\/strong>/gi, '**$1**');
  
  // Convert <em> to *italic*
  text = text.replace(/<em>(.+?)<\/em>/gi, '*$1*');
  
  // Convert links to plain URLs
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '$1');
  
  // Remove list tags but keep content
  text = text.replace(/<\/?[uo]l[^>]*>/gi, '');
  text = text.replace(/<li[^>]*>/gi, '- ');
  text = text.replace(/<\/li>/gi, '\n');
  
  // Remove heading tags
  text = text.replace(/<h[1-6][^>]*>/gi, '\n');
  text = text.replace(/<\/h[1-6]>/gi, '\n');
  
  // Strip any remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  
  // Normalize multiple newlines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  // Trim whitespace
  text = text.trim();
  
  return text;
}

/**
 * Convert plain text to styled HTML for email preview/sending
 * Handles: **bold**, URLs as buttons, paragraphs
 */
function convertPlainTextToEmailHtml(text: string): string {
  // Split into paragraphs by double newlines
  const paragraphs = text.split(/\n\n+/);
  
  const htmlParagraphs = paragraphs.map(para => {
    let html = para;
    
    // Escape HTML entities
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Convert **bold** to <strong>
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Check if this paragraph is just a URL (make it a button)
    const urlOnlyMatch = html.trim().match(/^(https?:\/\/[^\s]+)$/);
    if (urlOnlyMatch) {
      return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
        <tr>
          <td style="border-radius: 6px; background: ${BRAND.primaryGreen};">
            <a href="${urlOnlyMatch[1]}" target="_blank" style="background: ${BRAND.primaryGreen}; font-family: Georgia, serif; font-size: 15px; text-decoration: none; padding: 12px 24px; color: #ffffff; border-radius: 6px; display: inline-block; font-weight: bold;">
              Visit Link →
            </a>
          </td>
        </tr>
      </table>`;
    }
    
    // Convert inline URLs to links
    html = html.replace(
      /(https?:\/\/[^\s]+)/g,
      `<a href="$1" style="color: ${BRAND.primaryGreen}; text-decoration: underline;">$1</a>`
    );
    
    // Convert single newlines to <br>
    html = html.replace(/\n/g, '<br>');
    
    return `<p style="margin: 0 0 16px 0; line-height: 1.6; color: ${BRAND.darkText};">${html}</p>`;
  });
  
  return htmlParagraphs.join('\n');
}

/**
 * Convert Quill HTML to email-safe HTML with inline styles
 */
function convertQuillToEmailHtml(quillHtml: string): string {
  let html = quillHtml;
  
  // Add inline styles to paragraphs
  html = html.replace(/<p>/g, `<p style="margin: 0 0 16px 0; line-height: 1.6; color: ${BRAND.darkText};">`);
  html = html.replace(/<p class="ql-align-center">/g, `<p style="margin: 0 0 16px 0; line-height: 1.6; color: ${BRAND.darkText}; text-align: center;">`);
  html = html.replace(/<p class="ql-align-right">/g, `<p style="margin: 0 0 16px 0; line-height: 1.6; color: ${BRAND.darkText}; text-align: right;">`);
  
  // Style lists
  html = html.replace(/<ul>/g, `<ul style="margin: 0 0 16px 0; padding-left: 24px;">`);
  html = html.replace(/<ol>/g, `<ol style="margin: 0 0 16px 0; padding-left: 24px;">`);
  html = html.replace(/<li>/g, `<li style="margin-bottom: 8px; color: ${BRAND.darkText};">`);
  
  // Style links with brand green
  html = html.replace(/<a /g, `<a style="color: ${BRAND.primaryGreen}; text-decoration: underline;" `);
  
  // Style headers
  html = html.replace(/<h1>/g, `<h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: ${BRAND.darkText};">`);
  html = html.replace(/<h2>/g, `<h2 style="margin: 0 0 14px 0; font-size: 20px; font-weight: bold; color: ${BRAND.darkText};">`);
  html = html.replace(/<h3>/g, `<h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold; color: ${BRAND.darkText};">`);
  
  // Remove empty paragraphs
  html = html.replace(/<p[^>]*><br><\/p>/g, '');
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');
  
  return html;
}

export function ToolbeltEmailManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [openTemplates, setOpenTemplates] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('toolbelt_email_templates')
        .select('*')
        .order('sequence_order', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveTemplate(template: EmailTemplate) {
    try {
      setSaving(template.id);
      const { error } = await supabase
        .from('toolbelt_email_templates')
        .update({
          subject: template.subject,
          body: template.body,
          send_day: template.send_day,
          is_active: template.is_active,
          is_html: template.is_html,
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: 'Saved',
        description: 'Email template updated successfully',
      });
    } catch (err) {
      console.error('Error saving template:', err);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  }

  async function deleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this email template?')) return;

    try {
      const { error } = await supabase
        .from('toolbelt_email_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== id));
      toast({
        title: 'Deleted',
        description: 'Email template deleted',
      });
    } catch (err) {
      console.error('Error deleting template:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  }

  async function addTemplate() {
    try {
      const nextOrder = templates.length > 0 
        ? Math.max(...templates.map(t => t.sequence_order)) + 1 
        : 1;
      const nextDay = templates.length > 0
        ? Math.max(...templates.map(t => t.send_day)) + 7
        : 0;

      const { data, error } = await supabase
        .from('toolbelt_email_templates')
        .insert({
          tenant_id: 'default',
          sequence_order: nextOrder,
          send_day: nextDay,
          subject: 'New Email Subject',
          body: 'Hello {name},\n\nYour email content here.\n\nWarmly,\nLynn',
          is_active: false,
          is_html: false,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates([...templates, data]);
      setOpenTemplates(new Set([...openTemplates, data.id]));
      toast({
        title: 'Added',
        description: 'New email template created',
      });
    } catch (err) {
      console.error('Error adding template:', err);
      toast({
        title: 'Error',
        description: 'Failed to add template',
        variant: 'destructive',
      });
    }
  }

  function toggleTemplate(id: string) {
    const newOpen = new Set(openTemplates);
    if (newOpen.has(id)) {
      newOpen.delete(id);
    } else {
      newOpen.add(id);
    }
    setOpenTemplates(newOpen);
  }

  function updateTemplate(id: string, updates: Partial<EmailTemplate>) {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, ...updates } : t
    ));
  }

  /**
   * Handle mode switch with proper content conversion
   */
  function handleModeSwitch(template: EmailTemplate, newIsHtml: boolean) {
    if (newIsHtml === template.is_html) return;
    
    let newBody = template.body;
    
    if (newIsHtml) {
      // Switching TO Rich Text mode: convert plain text to HTML
      const confirmed = confirm(
        'Switching to Rich Text mode will convert your content to HTML format.\n\n' +
        'Paragraph breaks will be preserved. Continue?'
      );
      if (!confirmed) return;
      
      newBody = plainTextToHtml(template.body);
    } else {
      // Switching TO Plain Text mode: convert HTML to plain text
      const confirmed = confirm(
        'Switching to Plain Text mode will convert HTML back to plain text.\n\n' +
        'Some formatting (like links) will be simplified. Continue?'
      );
      if (!confirmed) return;
      
      newBody = htmlToPlainText(template.body);
    }
    
    updateTemplate(template.id, { 
      is_html: newIsHtml,
      body: newBody
    });
  }

  /**
   * Generate preview HTML with variable substitution and proper styling
   */
  function getPreviewHtml(template: EmailTemplate): string {
    const bodyWithVars = template.body
      .replace(/{name}/g, 'Teacher')
      .replace(/{email}/g, 'teacher@example.com');
    
    if (template.is_html) {
      return convertQuillToEmailHtml(bodyWithVars);
    }
    
    return convertPlainTextToEmailHtml(bodyWithVars);
  }

  /**
   * Generate full email preview with header/footer
   */
  function getFullPreviewHtml(template: EmailTemplate): string {
    const bodyHtml = getPreviewHtml(template);
    
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, ${BRAND.primaryGreen}, ${BRAND.primaryGreenLight}); padding: 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px; }
    .body { padding: 32px 24px; color: ${BRAND.darkText}; line-height: 1.6; font-size: 15px; }
    .footer { background: ${BRAND.cream}; padding: 24px; text-align: center; font-size: 12px; color: ${BRAND.mutedText}; }
    .footer a { color: ${BRAND.primaryGreen}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✦ BibleLessonSpark</h1>
      <p>Personalized Bible Studies in Minutes</p>
    </div>
    <div class="body">
      ${bodyHtml}
    </div>
    <div class="footer">
      <p>© 2026 BibleLessonSpark. All rights reserved.</p>
      <p><a href="#">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Custom styles for Quill editor */}
      <style>{`
        .toolbelt-email-editor .ql-container {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 15px;
          min-height: 200px;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }
        .toolbelt-email-editor .ql-editor {
          min-height: 200px;
          line-height: 1.6;
        }
        .toolbelt-email-editor .ql-toolbar {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          background: #f9fafb;
        }
        .toolbelt-email-editor .ql-editor a {
          color: ${BRAND.primaryGreen};
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Sequence Templates</h3>
          <p className="text-sm text-muted-foreground">
            Manage the nurture sequence sent after email capture
          </p>
        </div>
        <Button onClick={addTemplate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Email
        </Button>
      </div>

      {/* Help text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm space-y-2">
        <p className="font-semibold text-blue-900">Quick Guide:</p>
        <div className="text-blue-800 space-y-1">
          <p><strong>Plain Text Mode (Recommended):</strong> Use <code className="bg-blue-100 px-1 rounded">{'{name}'}</code> for personalization. URLs on their own line become green buttons. Use blank lines between paragraphs.</p>
          <p><strong>Rich Text Mode:</strong> Use the toolbar to add links, bold text, and lists. Best for emails that need inline clickable text.</p>
        </div>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No email templates found. Click "Add Email" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id} className={!template.is_active ? 'opacity-60' : ''}>
              <Collapsible open={openTemplates.has(template.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleTemplate(template.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            Email #{template.sequence_order}: {template.subject}
                            {template.is_html ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Rich Text</span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Plain Text</span>
                            )}
                          </CardTitle>
                          <CardDescription>
                            Day {template.send_day} • {template.is_active ? 'Active' : 'Inactive'}
                          </CardDescription>
                        </div>
                      </div>
                      {openTemplates.has(template.id) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`subject-${template.id}`}>Subject Line</Label>
                        <Input
                          id={`subject-${template.id}`}
                          value={template.subject}
                          onChange={(e) => updateTemplate(template.id, { subject: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`day-${template.id}`}>Send Day (days after capture)</Label>
                        <Input
                          id={`day-${template.id}`}
                          type="number"
                          min="0"
                          value={template.send_day}
                          onChange={(e) => updateTemplate(template.id, { send_day: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Email Body {template.is_html ? '(Rich Text Editor)' : '(Plain Text)'}</Label>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`html-${template.id}`}
                            checked={template.is_html}
                            onCheckedChange={(checked) => handleModeSwitch(template, checked)}
                          />
                          <Label htmlFor={`html-${template.id}`} className="text-sm font-normal">
                            Rich Text Mode
                          </Label>
                        </div>
                      </div>
                      
                      {template.is_html ? (
                        <div className="toolbelt-email-editor border rounded-md overflow-hidden">
                          <ReactQuill
                            theme="snow"
                            value={template.body}
                            onChange={(value) => updateTemplate(template.id, { body: value })}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Start writing your email..."
                          />
                        </div>
                      ) : (
                        <>
                          <Textarea
                            id={`body-${template.id}`}
                            value={template.body}
                            onChange={(e) => updateTemplate(template.id, { body: e.target.value })}
                            rows={12}
                            className="font-mono text-sm leading-relaxed"
                            placeholder={`Hello {name},

Your email content here...

https://biblelessonspark.com/toolbelt

Warmly,
Lynn`}
                          />
                          <p className="text-xs text-muted-foreground">
                            Tip: Use blank lines between paragraphs. URLs on their own line become buttons. Use **text** for bold.
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`active-${template.id}`}
                          checked={template.is_active}
                          onCheckedChange={(checked) => updateTemplate(template.id, { is_active: checked })}
                        />
                        <Label htmlFor={`active-${template.id}`}>Active</Label>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                              <DialogTitle>Email Preview: {template.subject}</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-auto border rounded-lg bg-gray-100">
                              <iframe 
                                srcDoc={getFullPreviewHtml(template)} 
                                className="w-full h-[500px] border-0" 
                                title="Email Preview" 
                              />
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => saveTemplate(template)}
                          disabled={saving === template.id}
                        >
                          {saving === template.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
