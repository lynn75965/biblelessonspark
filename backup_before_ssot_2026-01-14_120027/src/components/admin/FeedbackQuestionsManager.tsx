// ============================================================================
// FeedbackQuestionsManager.tsx
// ============================================================================
// Admin Panel component for managing feedback survey questions
// Allows: Add, Edit, Reorder, Activate/Deactivate questions
// Questions are stored in database and read dynamically by feedback form
// ============================================================================

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, 
  ArrowUp, ArrowDown, Save, X, RefreshCw, AlertTriangle
} from 'lucide-react';
import { CURRENT_FEEDBACK_MODE } from '@/constants/feedbackConfig';

// Question type definitions
interface QuestionOption {
  value: string | number | boolean;
  label: string;
  color?: string;
}

interface FeedbackQuestion {
  id: string;
  questionKey: string;
  columnName: string;
  label: string;
  description: string | null;
  placeholder: string | null;
  type: 'stars' | 'nps' | 'select' | 'boolean' | 'textarea';
  options: QuestionOption[] | null;
  required: boolean;
  minValue: number | null;
  maxValue: number | null;
  maxLength: number | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Available question types
const QUESTION_TYPES = [
  { value: 'stars', label: 'Star Rating (1-5)', description: 'Visual star rating' },
  { value: 'nps', label: 'NPS Scale (0-10)', description: 'Net Promoter Score slider' },
  { value: 'select', label: 'Single Select', description: 'Dropdown or radio options' },
  { value: 'boolean', label: 'Yes/No', description: 'Simple yes or no choice' },
  { value: 'textarea', label: 'Text Response', description: 'Open-ended text input' },
] as const;

// Available database columns for storing responses
const AVAILABLE_COLUMNS = [
  { value: 'rating', label: 'rating', type: 'integer' },
  { value: 'nps_score', label: 'nps_score', type: 'integer' },
  { value: 'ease_of_use', label: 'ease_of_use', type: 'text' },
  { value: 'lesson_quality', label: 'lesson_quality', type: 'text' },
  { value: 'would_pay_for', label: 'would_pay_for', type: 'text' },
  { value: 'would_recommend', label: 'would_recommend', type: 'boolean' },
  { value: 'minutes_saved', label: 'minutes_saved', type: 'integer' },
  { value: 'positive_comments', label: 'positive_comments', type: 'text' },
  { value: 'improvement_suggestions', label: 'improvement_suggestions', type: 'text' },
  { value: 'ui_issues', label: 'ui_issues', type: 'text' },
  { value: 'comments', label: 'comments (general)', type: 'text' },
] as const;

// Empty question template
const EMPTY_QUESTION: Partial<FeedbackQuestion> = {
  questionKey: '',
  columnName: '',
  label: '',
  description: '',
  placeholder: '',
  type: 'select',
  options: [],
  required: false,
  minValue: null,
  maxValue: null,
  maxLength: null,
  isActive: true,
};

export function FeedbackQuestionsManager() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<FeedbackQuestion> | null>(null);
  const [isNewQuestion, setIsNewQuestion] = useState(false);
  
  // Options editor state (for select/boolean types)
  const [optionsText, setOptionsText] = useState('');

  // Fetch questions from database
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_all_feedback_questions', { p_mode: CURRENT_FEEDBACK_MODE });

      if (error) throw error;
      setQuestions((data || []) as FeedbackQuestion[]);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: 'Error Loading Questions',
        description: 'Could not load feedback questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Open dialog for new question
  const handleAddNew = () => {
    setEditingQuestion({ 
      ...EMPTY_QUESTION,
      displayOrder: questions.length + 1,
    });
    setOptionsText('');
    setIsNewQuestion(true);
    setIsDialogOpen(true);
  };

  // Open dialog to edit existing question
  const handleEdit = (question: FeedbackQuestion) => {
    setEditingQuestion({ ...question });
    // Convert options array to text for editing
    if (question.options && question.options.length > 0) {
      setOptionsText(
        question.options.map(opt => 
          `${opt.value}|${opt.label}${opt.color ? '|' + opt.color : ''}`
        ).join('\n')
      );
    } else {
      setOptionsText('');
    }
    setIsNewQuestion(false);
    setIsDialogOpen(true);
  };

  // Parse options text to array
  const parseOptions = (text: string): QuestionOption[] => {
    if (!text.trim()) return [];
    return text.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        value: parts[0],
        label: parts[1] || parts[0],
        color: parts[2] || undefined,
      };
    });
  };

  // Save question (create or update)
  const handleSave = async () => {
    if (!editingQuestion) return;
    
    // Validation
    if (!editingQuestion.questionKey?.trim()) {
      toast({ title: 'Question key is required', variant: 'destructive' });
      return;
    }
    if (!editingQuestion.columnName?.trim()) {
      toast({ title: 'Database column is required', variant: 'destructive' });
      return;
    }
    if (!editingQuestion.label?.trim()) {
      toast({ title: 'Question label is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const options = ['select', 'boolean'].includes(editingQuestion.type || '') 
        ? parseOptions(optionsText) 
        : null;

      const questionData = {
        question_key: editingQuestion.questionKey,
        column_name: editingQuestion.columnName,
        label: editingQuestion.label,
        description: editingQuestion.description || null,
        placeholder: editingQuestion.placeholder || null,
        question_type: editingQuestion.type,
        options: options,
        is_required: editingQuestion.required || false,
        min_value: editingQuestion.minValue,
        max_value: editingQuestion.maxValue,
        max_length: editingQuestion.maxLength,
        display_order: editingQuestion.displayOrder || questions.length + 1,
        is_active: editingQuestion.isActive !== false,
        feedback_mode: CURRENT_FEEDBACK_MODE,
      };

      if (isNewQuestion) {
        const { error } = await supabase
          .from('feedback_questions')
          .insert(questionData);
        if (error) throw error;
        toast({ title: 'Question Added', description: 'New question has been added to the survey.' });
      } else {
        const { error } = await supabase
          .from('feedback_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);
        if (error) throw error;
        toast({ title: 'Question Updated', description: 'Question has been updated.' });
      }

      setIsDialogOpen(false);
      setEditingQuestion(null);
      fetchQuestions();
    } catch (error: any) {
      console.error('Error saving question:', error);
      toast({
        title: 'Error Saving Question',
        description: error.message || 'Could not save question. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle question active status
  const handleToggleActive = async (question: FeedbackQuestion) => {
    try {
      const { error } = await supabase
        .from('feedback_questions')
        .update({ is_active: !question.isActive })
        .eq('id', question.id);

      if (error) throw error;
      
      toast({
        title: question.isActive ? 'Question Hidden' : 'Question Activated',
        description: question.isActive 
          ? 'Question will not appear in the feedback form.' 
          : 'Question will now appear in the feedback form.',
      });
      fetchQuestions();
    } catch (error) {
      console.error('Error toggling question:', error);
      toast({ title: 'Error', description: 'Could not update question.', variant: 'destructive' });
    }
  };

  // Move question up/down in order
  const handleReorder = async (question: FeedbackQuestion, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === question.id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const targetQuestion = questions[targetIndex];
    
    try {
      // Swap display orders
      await supabase
        .from('feedback_questions')
        .update({ display_order: targetQuestion.displayOrder })
        .eq('id', question.id);
      
      await supabase
        .from('feedback_questions')
        .update({ display_order: question.displayOrder })
        .eq('id', targetQuestion.id);

      fetchQuestions();
    } catch (error) {
      console.error('Error reordering:', error);
      toast({ title: 'Error', description: 'Could not reorder questions.', variant: 'destructive' });
    }
  };

  // Delete question (with confirmation)
  const handleDelete = async (question: FeedbackQuestion) => {
    if (!confirm(`Are you sure you want to delete "${question.label}"? This cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('feedback_questions')
        .delete()
        .eq('id', question.id);

      if (error) throw error;
      toast({ title: 'Question Deleted', description: 'Question has been removed.' });
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({ title: 'Error', description: 'Could not delete question.', variant: 'destructive' });
    }
  };

  // Get type badge color
  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      stars: 'bg-amber-100 text-amber-800',
      nps: 'bg-blue-100 text-blue-800',
      select: 'bg-purple-100 text-purple-800',
      boolean: 'bg-green-100 text-green-800',
      textarea: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Beta Feedback Questions</CardTitle>
            <CardDescription>
              Manage the questions shown in the beta feedback survey. 
              Changes take effect immediately.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchQuestions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No questions configured. Click "Add Question" to create your first survey question.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-24">Required</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question, index) => (
                <TableRow key={question.id} className={!question.isActive ? 'opacity-50' : ''}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => handleReorder(question, 'up')}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="text-center text-sm">{question.displayOrder}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === questions.length - 1}
                        onClick={() => handleReorder(question, 'down')}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{question.label}</div>
                      <div className="text-sm text-muted-foreground">{question.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Key: {question.questionKey} → Column: {question.columnName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadge(question.type)}>
                      {question.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {question.required ? (
                      <Badge variant="destructive">Required</Badge>
                    ) : (
                      <Badge variant="outline">Optional</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(question)}
                    >
                      {question.isActive ? (
                        <><Eye className="h-4 w-4 mr-1" /> Active</>
                      ) : (
                        <><EyeOff className="h-4 w-4 mr-1" /> Hidden</>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(question)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => handleDelete(question)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Question Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isNewQuestion ? 'Add New Question' : 'Edit Question'}
              </DialogTitle>
              <DialogDescription>
                Configure the question details. Changes affect the feedback form immediately.
              </DialogDescription>
            </DialogHeader>

            {editingQuestion && (
              <div className="space-y-4 py-4">
                {/* Question Key */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="questionKey">Question Key *</Label>
                    <Input
                      id="questionKey"
                      value={editingQuestion.questionKey || ''}
                      onChange={(e) => setEditingQuestion({
                        ...editingQuestion,
                        questionKey: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                      })}
                      placeholder="e.g., ease_of_use"
                      disabled={!isNewQuestion}
                    />
                    <p className="text-xs text-muted-foreground">
                      Unique identifier (lowercase, underscores)
                    </p>
                  </div>

                  {/* Database Column */}
                  <div className="space-y-2">
                    <Label htmlFor="columnName">Database Column *</Label>
                    <Select
                      value={editingQuestion.columnName || ''}
                      onValueChange={(value) => setEditingQuestion({
                        ...editingQuestion,
                        columnName: value,
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column..." />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_COLUMNS.map((col) => (
                          <SelectItem key={col.value} value={col.value}>
                            {col.label} ({col.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Label */}
                <div className="space-y-2">
                  <Label htmlFor="label">Question Label *</Label>
                  <Input
                    id="label"
                    value={editingQuestion.label || ''}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      label: e.target.value,
                    })}
                    placeholder="e.g., How easy was it to use?"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Help Text</Label>
                  <Input
                    id="description"
                    value={editingQuestion.description || ''}
                    onChange={(e) => setEditingQuestion({
                      ...editingQuestion,
                      description: e.target.value,
                    })}
                    placeholder="Additional context shown below the question"
                  />
                </div>

                {/* Question Type */}
                <div className="space-y-2">
                  <Label htmlFor="type">Question Type *</Label>
                  <Select
                    value={editingQuestion.type || 'select'}
                    onValueChange={(value: any) => setEditingQuestion({
                      ...editingQuestion,
                      type: value,
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} - {type.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Options (for select/boolean) */}
                {['select', 'boolean'].includes(editingQuestion.type || '') && (
                  <div className="space-y-2">
                    <Label htmlFor="options">Options</Label>
                    <Textarea
                      id="options"
                      value={optionsText}
                      onChange={(e) => setOptionsText(e.target.value)}
                      placeholder="value|Label|#color (one per line)&#10;e.g.:&#10;yes|Yes, definitely|#22c55e&#10;no|No|#ef4444"
                      rows={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: value|Label|#hexColor (color optional). One option per line.
                    </p>
                  </div>
                )}

                {/* Min/Max for stars/nps */}
                {['stars', 'nps'].includes(editingQuestion.type || '') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minValue">Minimum Value</Label>
                      <Input
                        id="minValue"
                        type="number"
                        value={editingQuestion.minValue || (editingQuestion.type === 'stars' ? 1 : 0)}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          minValue: parseInt(e.target.value),
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxValue">Maximum Value</Label>
                      <Input
                        id="maxValue"
                        type="number"
                        value={editingQuestion.maxValue || (editingQuestion.type === 'stars' ? 5 : 10)}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          maxValue: parseInt(e.target.value),
                        })}
                      />
                    </div>
                  </div>
                )}

                {/* Max Length for textarea */}
                {editingQuestion.type === 'textarea' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="maxLength">Max Characters</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        value={editingQuestion.maxLength || 2000}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          maxLength: parseInt(e.target.value),
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="placeholder">Placeholder Text</Label>
                      <Input
                        id="placeholder"
                        value={editingQuestion.placeholder || ''}
                        onChange={(e) => setEditingQuestion({
                          ...editingQuestion,
                          placeholder: e.target.value,
                        })}
                        placeholder="e.g., Share your thoughts..."
                      />
                    </div>
                  </div>
                )}

                {/* Required toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="required"
                    checked={editingQuestion.required || false}
                    onCheckedChange={(checked) => setEditingQuestion({
                      ...editingQuestion,
                      required: checked,
                    })}
                  />
                  <Label htmlFor="required">Required question</Label>
                </div>

                {/* Active toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={editingQuestion.isActive !== false}
                    onCheckedChange={(checked) => setEditingQuestion({
                      ...editingQuestion,
                      isActive: checked,
                    })}
                  />
                  <Label htmlFor="isActive">Show in feedback form</Label>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Question'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default FeedbackQuestionsManager;