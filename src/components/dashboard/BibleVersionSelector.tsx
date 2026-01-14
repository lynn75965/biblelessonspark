import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, BookOpen, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  quoteType: "direct" | "paraphrase";
  description: string;
}

const bibleVersions: BibleVersion[] = [
  // Direct Quote Versions
  {
    id: "kjv",
    name: "King James Version",
    abbreviation: "KJV",
    quoteType: "direct",
    description: "Traditional English with 'thee/thou' language"
  },
  {
    id: "web",
    name: "World English Bible",
    abbreviation: "WEB",
    quoteType: "direct",
    description: "Modern, readable English"
  },
  // Paraphrase Versions
  {
    id: "csb",
    name: "Christian Standard Bible",
    abbreviation: "CSB",
    quoteType: "paraphrase",
    description: "Official SBC translation"
  },
  {
    id: "niv",
    name: "New International Version",
    abbreviation: "NIV",
    quoteType: "paraphrase",
    description: "Popular modern translation"
  },
  {
    id: "esv",
    name: "English Standard Version",
    abbreviation: "ESV",
    quoteType: "paraphrase",
    description: "Word-for-word accuracy"
  },
  {
    id: "nkjv",
    name: "New King James Version",
    abbreviation: "NKJV",
    quoteType: "paraphrase",
    description: "KJV in modern English"
  },
  {
    id: "nasb",
    name: "New American Standard Bible",
    abbreviation: "NASB",
    quoteType: "paraphrase",
    description: "Scholarly literal translation"
  }
];

interface BibleVersionSelectorProps {
  selectedVersion: string;
  onVersionChange: (version: string) => void;
  showLabel?: boolean;
}

export function BibleVersionSelector({ 
  selectedVersion, 
  onVersionChange,
  showLabel = true 
}: BibleVersionSelectorProps) {
  const directQuoteVersions = bibleVersions.filter(v => v.quoteType === "direct");
  const paraphraseVersions = bibleVersions.filter(v => v.quoteType === "paraphrase");

  return (
    <div className="space-y-4">
      {showLabel && (
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Bible Version</Label>
          <ParaphraseExplainerDialog />
        </div>
      )}

      <RadioGroup value={selectedVersion} onValueChange={onVersionChange}>
        {/* Direct Quote Section */}
        <Card className="border-2 border-primary/30 bg-primary/5/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-semibold text-green-900">
                DIRECTLY QUOTED (Exact Text)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-primary">
              Lessons include word-for-word Bible text
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {directQuoteVersions.map((version) => (
              <div
                key={version.id}
                className="flex items-start space-x-3 rounded-md border border-primary/30 bg-card p-3 hover:border-primary/70 transition-colors"
              >
                <RadioGroupItem value={version.id} id={version.id} className="mt-0.5" />
                <Label
                  htmlFor={version.id}
                  className="flex-1 cursor-pointer space-y-0.5"
                >
                  <div className="font-semibold text-sm">
                    {version.abbreviation} - {version.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {version.description}
                  </div>
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Paraphrase Section */}
        <Card className="border-2 border-accent/50 bg-blue-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-700" />
              <CardTitle className="text-sm font-semibold text-blue-900">
                PARAPHRASE (Dynamic Summary with References)
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-blue-700">
              Faithful summaries with verse references - read from your Bible in class
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {paraphraseVersions.map((version) => (
              <div
                key={version.id}
                className="flex items-start space-x-3 rounded-md border border-accent/50 bg-card p-3 hover:border-accent transition-colors"
              >
                <RadioGroupItem value={version.id} id={version.id} className="mt-0.5" />
                <Label
                  htmlFor={version.id}
                  className="flex-1 cursor-pointer space-y-0.5"
                >
                  <div className="font-semibold text-sm">
                    {version.abbreviation} - {version.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {version.description}
                  </div>
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>
      </RadioGroup>
    </div>
  );
}

function ParaphraseExplainerDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-xs">
          <Info className="h-4 w-4" />
          What's the difference?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Understanding Bible Version Types</DialogTitle>
          <DialogDescription>
            Choose the option that works best for your teaching style
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Direct Quote Explanation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-green-900">Directly Quoted Versions</h3>
            </div>
            <div className="pl-7 space-y-2 text-sm text-muted-foreground">
              <p>
                Your lessons will include the <strong>exact word-for-word text</strong> from these 
                public domain translations.
              </p>
              <div className="bg-primary/5 border border-primary/30 rounded-md p-3">
                <p className="font-mono text-xs">
                  "For by grace are ye saved through faith; and that not of yourselves: 
                  it is the gift of God" (Ephesians 2:8, KJV)
                </p>
              </div>
              <p className="text-xs">
                âœ“ Perfect for memorization<br />
                âœ“ Exact quotes in handouts<br />
                âœ“ No paraphrasing
              </p>
            </div>
          </div>

          {/* Paraphrase Explanation */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-700" />
              <h3 className="font-semibold text-blue-900">Paraphrase Versions</h3>
            </div>
            <div className="pl-7 space-y-2 text-sm text-muted-foreground">
              <p>
                Your lessons will include <strong>faithful summaries</strong> with clear verse 
                references for copyrighted translations.
              </p>
              <div className="bg-blue-50 border border-accent/50 rounded-md p-3">
                <p className="text-xs mb-2">
                  <strong>Ephesians 2:8 (CSB)</strong>
                </p>
                <p className="text-xs">
                  Paul teaches that we are saved by God's grace through faithâ€”this salvation 
                  is not from ourselves but is God's gift.
                </p>
                <p className="text-xs italic mt-2">
                  [Teacher: Please read Ephesians 2:8 from your CSB Bible]
                </p>
              </div>
              <p className="text-xs">
                âœ“ Doctrinally faithful summaries<br />
                âœ“ Clear verse references included<br />
                âœ“ Read exact text from your own Bible in class
              </p>
            </div>
          </div>

          {/* Why This Approach */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">Why do we use paraphrases?</h4>
            <p className="text-xs text-muted-foreground">
              Licensing copyrighted Bible translations costs $20,000+ annually. By providing 
              faithful paraphrases, we keep BibleLessonSpark affordable while making ALL major 
              translations available to you immediately. You'll still bring your CSB, NIV, or 
              ESV Bible to class and read the exact text!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { bibleVersions };
export type { BibleVersion };
