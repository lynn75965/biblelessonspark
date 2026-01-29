/**
 * ToolbeltEmailManager.tsx
 * Manages email sequence templates for Teacher Toolbelt
 * Location: src/components/admin/toolbelt/ToolbeltEmailManager.tsx
 * 
 * CHANGELOG:
 * - Jan 29, 2026: Added markdown-to-HTML conversion for preview
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
 * Convert basic markdown and plain text to styled HTML for preview
 * Handles: **bold**, URLs as buttons, line breaks
 */
function convertToPreviewHtml(text: string): string {
  let html = text;
  
  // Escape HTML entities first (but not our conversions)
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  // Convert **bold** to <strong>
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em> (but not if part of **)
  html = html.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert URLs on their own line to styled buttons
  html = html.replace(
    /^(https?:\/\/[^\s]+)$/gm,
    '<a href="$1" style="display: inline-block; background-color: #3D5C3D; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 8px 0;">$1</a>'
  );
  
  // Convert inline URLs (not on their own line) to links
  html = html.replace(
    /(?<!href=")(https?:\/\/[^\s<]+)(?![^<]*<\/a>)/g,
    '<a href="$1" style="color: #3D5C3D; text-decoration: underline;">$1</a>'
  );
  
  // Convert line breaks to <br> for proper display
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

export function ToolbeltEmailManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [openTemplates, setOpenTemplates] = useState<Set<string>>(new Set());
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
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
          body: 'Email content goes here...',
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
   * Generate preview HTML with variable substitution
   */
  function getPreviewHtml(template: EmailTemplate): string {
    const bodyWithVars = template.body
      .replace(/{name}/g, 'Teacher')
      .replace(/{email}/g, 'teacher@example.com');
    
    if (template.is_html) {
      return bodyWithVars;
    }
    
    return convertToPreviewHtml(bodyWithVars);
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
                          <CardTitle className="text-base">
                            Email #{template.sequence_order}: {template.subject}
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
                      <Label htmlFor={`body-${template.id}`}>Email Body</Label>
                      <Textarea
                        id={`body-${template.id}`}
                        value={template.body}
                        onChange={(e) => updateTemplate(template.id, { body: e.target.value })}
                        rows={10}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use {'{name}'} for recipient name, {'{email}'} for their email. 
                        Use **text** for bold formatting. URLs on their own line become buttons.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`active-${template.id}`}
                            checked={template.is_active}
                            onCheckedChange={(checked) => updateTemplate(template.id, { is_active: checked })}
                          />
                          <Label htmlFor={`active-${template.id}`}>Active</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`html-${template.id}`}
                            checked={template.is_html}
                            onCheckedChange={(checked) => updateTemplate(template.id, { is_html: checked })}
                          />
                          <Label htmlFor={`html-${template.id}`}>HTML Mode</Label>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setPreviewTemplate(template)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Email Preview</DialogTitle>
                            </DialogHeader>
                            <div className="border rounded-lg p-4 bg-white">
                              <p className="font-semibold mb-2">Subject: {template.subject}</p>
                              <hr className="my-3" />
                              <div 
                                className="font-serif leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: getPreviewHtml(template) }}
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
