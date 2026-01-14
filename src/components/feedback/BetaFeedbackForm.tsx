// ============================================================================
// BetaFeedbackForm.tsx (Database-Driven)
// ============================================================================
// Reads questions dynamically from feedback_questions table
// Questions are managed via Admin Panel (FeedbackQuestionsManager)
// Submits responses to discrete columns in feedback table
// ============================================================================

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Loader2, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  CURRENT_FEEDBACK_MODE, 
  FEEDBACK_FORM_STYLES 
} from '@/constants/feedbackConfig';

// Question type from database
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
}

interface BetaFeedbackFormProps {
  lessonId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BetaFeedbackForm({ lessonId, onSuccess, onCancel }: BetaFeedbackFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Questions loaded from database
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Form responses keyed by columnName
  const [responses, setResponses] = useState<Record<string, any>>({});
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<Record<string, number>>({});

  // Fetch questions from database
  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      setLoadError(null);
      try {
        const { data, error } = await supabase
          .rpc('get_feedback_questions', { p_mode: CURRENT_FEEDBACK_MODE });

        if (error) throw error;
        
        if (!data || data.length === 0) {
          setLoadError('No feedback questions configured. Please contact support.');
          return;
        }
        
        setQuestions(data as FeedbackQuestion[]);
        
        // Initialize responses with empty values
        const initialResponses: Record<string, any> = {};
        (data as FeedbackQuestion[]).forEach(q => {
          initialResponses[q.columnName] = q.type === 'boolean' ? null : 
                                           q.type === 'stars' || q.type === 'nps' ? 0 : '';
        });
        setResponses(initialResponses);
        
      } catch (error) {
        console.error('Error fetching questions:', error);
        setLoadError('Could not load feedback form. Please try again.');
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, []);

  // Update a response value
  const updateResponse = (columnName: string, value: any) => {
    setResponses(prev => ({ ...prev, [columnName]: value }));
  };

  // Check if all required questions are answered
  const isFormValid = () => {
    return questions
      .filter(q => q.required)
      .every(q => {
        const value = responses[q.columnName];
        if (value === null || value === undefined) return false;
        if (typeof value === 'string' && value.trim() === '') return false;
        if (typeof value === 'number' && value === 0 && q.type !== 'nps') return false;
        return true;
      });
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to submit feedback.',
        variant: 'destructive',
      });
      return;
    }

    if (!isFormValid()) {
      toast({
        title: 'Please Complete Required Fields',
        description: 'All questions marked with * are required.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build submission object from responses
      const submission: Record<string, any> = {
        user_id: user.id,
        lesson_id: lessonId || null,
        is_beta_feedback: CURRENT_FEEDBACK_MODE === 'beta',
      };

      // Add each response using the column name
      questions.forEach(q => {
        const value = responses[q.columnName];
        if (value !== null && value !== undefined && value !== '') {
          submission[q.columnName] = value;
        }
      });

      const { error } = await supabase
        .from('feedback')
        .insert(submission);

      if (error) throw error;

      setIsSubmitted(true);
      toast({
        title: 'Thank You!',
        description: 'Your feedback helps us improve BibleLessonSpark.',
      });

    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        title: 'Submission Failed',
        description: 'Please try again. If the problem persists, contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render star rating input
  const renderStars = (question: FeedbackQuestion) => {
    const maxStars = question.maxValue || 5;
    const currentValue = responses[question.columnName] || 0;
    const hovered = hoveredStar[question.columnName] || 0;
    
    return (
      <div className="flex gap-1 mt-2">
        {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => updateResponse(question.columnName, star)}
            onMouseEnter={() => setHoveredStar(prev => ({ ...prev, [question.columnName]: star }))}
            onMouseLeave={() => setHoveredStar(prev => ({ ...prev, [question.columnName]: 0 }))}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className="h-8 w-8"
              fill={(hovered || currentValue) >= star ? FEEDBACK_FORM_STYLES.starActiveColor : 'none'}
              stroke={(hovered || currentValue) >= star ? FEEDBACK_FORM_STYLES.starActiveColor : FEEDBACK_FORM_STYLES.starInactiveColor}
            />
          </button>
        ))}
      </div>
    );
  };

  // Render NPS scale (0-10)
  const renderNPS = (question: FeedbackQuestion) => {
    const minValue = question.minValue ?? 0;
    const maxValue = question.maxValue ?? 10;
    const currentValue = responses[question.columnName];
    
    return (
      <div className="space-y-2 mt-2">
        <div className="grid grid-cols-6 sm:grid-cols-11 gap-1 sm:gap-2 justify-items-center">
          {Array.from({ length: maxValue - minValue + 1 }, (_, i) => minValue + i).map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => updateResponse(question.columnName, score)}
              className={`${FEEDBACK_FORM_STYLES.npsButtonClass} ${
                currentValue === score 
                  ? FEEDBACK_FORM_STYLES.npsSelectedClass 
                  : FEEDBACK_FORM_STYLES.npsUnselectedClass
              }`}
            >
              {score}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span></span>
            <span>Extremely likely</span>
        </div>
      </div>
    );
  };

  // Render select/radio options
  const renderSelect = (question: FeedbackQuestion) => {
    const options = question.options || [];
    const currentValue = responses[question.columnName];
    
    return (
      <RadioGroup
        value={String(currentValue)}
        onValueChange={(value) => {
          // Try to preserve original type (number vs string)
          const option = options.find(o => String(o.value) === value);
          updateResponse(question.columnName, option ? option.value : value);
        }}
        className="mt-2 space-y-2"
      >
        {options.map((option) => (
          <div key={String(option.value)} className="flex items-center space-x-2">
            <RadioGroupItem value={String(option.value)} id={`${question.columnName}-${option.value}`} />
            <Label 
              htmlFor={`${question.columnName}-${option.value}`} 
              className="font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  };

  // Render boolean (yes/no)
  const renderBoolean = (question: FeedbackQuestion) => {
    const options = question.options || [
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ];
    const currentValue = responses[question.columnName];
    
    return (
      <RadioGroup
        value={currentValue === null ? '' : String(currentValue)}
        onValueChange={(value) => updateResponse(question.columnName, value === 'true')}
        className="mt-2 space-y-2"
      >
        {options.map((option) => (
          <div key={String(option.value)} className="flex items-center space-x-2">
            <RadioGroupItem value={String(option.value)} id={`${question.columnName}-${option.value}`} />
            <Label 
              htmlFor={`${question.columnName}-${option.value}`} 
              className="font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  };

  // Render textarea
  const renderTextarea = (question: FeedbackQuestion) => {
    return (
      <Textarea
        value={responses[question.columnName] || ''}
        onChange={(e) => updateResponse(question.columnName, e.target.value)}
        placeholder={question.placeholder || ''}
        maxLength={question.maxLength || 2000}
        className="mt-2"
        rows={3}
      />
    );
  };

  // Render a question based on its type
  const renderQuestion = (question: FeedbackQuestion) => {
    switch (question.type) {
      case 'stars':
        return renderStars(question);
      case 'nps':
        return renderNPS(question);
      case 'select':
        return renderSelect(question);
      case 'boolean':
        return renderBoolean(question);
      case 'textarea':
        return renderTextarea(question);
      default:
        return <p className="text-red-500">Unknown question type: {question.type}</p>;
    }
  };

  // Loading state
  if (isLoadingQuestions) {
    return (
      <div className={FEEDBACK_FORM_STYLES.containerClass}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Unable to Load Feedback Form
        </h3>
        <p className="text-muted-foreground mb-4">{loadError}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  // Reset form for another submission
  const handleSubmitAnother = () => {
    // Reset responses to initial values
    const initialResponses: Record<string, any> = {};
    questions.forEach(q => {
      initialResponses[q.columnName] = q.type === 'boolean' ? null :
                                       q.type === 'stars' || q.type === 'nps' ? 0 : '';
    });
    setResponses(initialResponses);
    setIsSubmitted(false);
  };

  // Success state with options
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle className="h-16 w-16 text-primary mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Thank You for Your Feedback!
        </h3>
        <p className="text-muted-foreground mb-6">
          Your input is invaluable in helping us serve Sunday School teachers better.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSubmitAnother}
            className="gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Submit Another
          </Button>
          <Button
            onClick={() => onSuccess?.()}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={FEEDBACK_FORM_STYLES.containerClass}>
      {questions.map((question) => (
        <div key={question.id} className={FEEDBACK_FORM_STYLES.sectionClass}>
          <Label className={FEEDBACK_FORM_STYLES.questionClass}>
            {question.label} {question.required && '*'}
          </Label>
          {question.description && (
            <p className={FEEDBACK_FORM_STYLES.descriptionClass}>
              {question.description}
            </p>
          )}
          {renderQuestion(question)}
        </div>
      ))}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={isSubmitting || !isFormValid()}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Feedback'
          )}
        </Button>
      </div>
    </form>
  );
}

export default BetaFeedbackForm;


