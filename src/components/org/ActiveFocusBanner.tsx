/**
 * ActiveFocusBanner - Displays active org focus with "Use Focus" button
 * 
 * SSOT: src/constants/sharedFocusConfig.ts
 * Shows on lesson generation form when org has an active focus
 */

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, BookOpen, Lightbulb, ChevronRight } from "lucide-react";
import { SharedFocus, FOCUS_TYPES, formatDateRange } from "@/constants/sharedFocusConfig";

interface OrgSettings {
  default_doctrine: string | null;
  default_bible_version: string | null;
}

interface ActiveFocusBannerProps {
  focus: SharedFocus;
  orgSettings?: OrgSettings | null;
  onUseFocus: (passage: string | null, theme: string | null, orgSettings?: OrgSettings | null) => void;
}

export function ActiveFocusBanner({ focus, orgSettings, onUseFocus }: ActiveFocusBannerProps) {
  const typeConfig = FOCUS_TYPES[focus.focus_type];

  const handleUseFocus = () => {
    onUseFocus(focus.passage, focus.theme, orgSettings);
  };

  return (
    <Card className="border-primary/50 bg-primary/5 mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">Organization Focus</span>
                <Badge variant="secondary" className="text-xs">
                  {formatDateRange(focus.start_date, focus.end_date)}
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm">
                {focus.passage && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span><strong>Passage:</strong> {focus.passage}</span>
                  </div>
                )}
                {focus.theme && (
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span><strong>Theme:</strong> {focus.theme}</span>
                  </div>
                )}
              </div>
              
              {focus.notes && (
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                  {focus.notes}
                </p>
              )}
            </div>
          </div>
          
          <Button 
            onClick={handleUseFocus}
            className="shrink-0"
            size="sm"
          >
            Use Focus
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
