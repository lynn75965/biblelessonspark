import { forwardRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROWS: Array<[string, string, string]> = [
  ["Doctrinal Fit", "Broad denominational or publisher perspective", "Aligned with the church's doctrinal convictions"],
  ["Local Relevance", "Written for many churches", "Shaped for one church's people and setting"],
  ["Age Group Fit", "Based on publisher's sequence", "Can be shaped by age group and class need"],
  ["Teacher Support", "Depends on purchased material", "Can prepare teacher-specific guides"],
  ["Flexibility", "Limited to publisher schedule", "Can respond to local needs quickly"],
  ["Print Cost", "Purchased materials and shipping", "Church controls print/digital distribution"],
  ["Digital Options", "Depends on publisher", "Can use ePub, QR codes, links, and handouts"],
  ["Distribution", "Pickup at church", "Church pickup, email, online access, QR code, ePub, or shared link"],
  ["Oversight", "Publisher writes; church adapts", "Church leadership reviews, approves, and shapes the material"],
  ["Best For", "Churches wanting one-size-fits-all curriculum", "Churches wanting alignment with the church, teacher, and member"],
];

export const ComparisonTable = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section ref={ref} className="scroll-mt-24 border-b border-border bg-background">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          A Side-by-Side Look -- Without Taking Sides
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground">
          Traditional published curriculum has served churches faithfully for many years and continues to serve many well. The point of this comparison is not to argue against it, but to help leadership see -- plainly -- what each approach offers, so the choice can be made on the basis of what best serves <em>your</em> church.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          As you read, ask: <span className="text-foreground">where does our current curriculum already fit well, and where might a locally prepared lesson better reflect our doctrine, our teachers, and our members?</span>
        </p>

        <div className="mt-8 overflow-hidden rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[28%]">Evaluation Area</TableHead>
                <TableHead className="w-[36%]">Traditional Published Curriculum</TableHead>
                <TableHead className="w-[36%]">Local Church Curriculum Publishing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map(([area, trad, local]) => (
                <TableRow key={area}>
                  <TableCell className="font-medium text-foreground">{area}</TableCell>
                  <TableCell className="text-muted-foreground">{trad}</TableCell>
                  <TableCell className="text-foreground">{local}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
});

ComparisonTable.displayName = "ComparisonTable";
