import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
  type: "terms" | "privacy";
}

const LEGAL_SUMMARIES = {
  terms: {
    title: "Terms of Service",
    points: [
      "You must be 18 or older to use this service",
      "You are responsible for maintaining your account security",
      "Content you create remains yours, but we need rights to display it",
      "We may update these terms with notice to you",
      "We can suspend accounts that violate these terms",
      "This service is provided as-is without warranty",
    ],
    fullPath: "/terms-of-service",
  },
  privacy: {
    title: "Privacy Policy",
    points: [
      "We collect email and account information you provide",
      "Lesson content you create is stored securely",
      "We do not sell your personal information",
      "We use cookies for authentication and preferences",
      "You can request deletion of your data",
      "We may share data if required by law",
    ],
    fullPath: "/privacy-policy",
  },
};

export function LegalModal({ open, onClose, type }: LegalModalProps) {
  const content = LEGAL_SUMMARIES[type];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{content.title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 pr-4">
            <p className="text-sm text-muted-foreground">Key points:</p>
            <ul className="space-y-2">
              {content.points.map((point, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-3">
                This is a summary. Please read the full document for complete details.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(content.fullPath, '_blank')}
              >
                Read Full {content.title}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
