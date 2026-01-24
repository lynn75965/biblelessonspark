/**
 * TourHelpButton Component
 * Small "?" button to manually trigger a tour step or full tour
 * 
 * Placement: Near each step section header
 */

import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TourHelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function TourHelpButton({ onClick, className = '' }: TourHelpButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={h-6 w-6 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 }
      title="Show help for this section"
    >
      <HelpCircle className="h-4 w-4" />
      <span className="sr-only">Help</span>
    </Button>
  );
}
