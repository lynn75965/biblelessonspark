import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface EmailTemplate {
  id: string;
  tenant_id: string;
  sequence_order: number;
  send_day: number;
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function EmailSequenceManager() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
      setTemplates([...templates, data]);
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

      <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
        <strong>Personalization variables:</strong> Use <code className="bg-muted px-1 rounded">{'{name}'}</code> for the user's name 
        and <code className="bg-muted px-1 rounded">{'{email}'}</code> for their email address.
      </div>

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
                    <CardTitle className="text-lg">{template.subject}</CardTitle>
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
                <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor={`body-${template.id}`}>Email Body</Label>
                  <Textarea
                    id={`body-${template.id}`}
                    value={template.body}
                    onChange={(e) =>
                      handleFieldChange(template.id, 'body', e.target.value)
                    }
                    rows={15}
                    className="font-mono text-sm"
                  />
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
