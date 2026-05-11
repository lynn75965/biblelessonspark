import { forwardRef } from "react";

export const ClosingSection = forwardRef<HTMLElement>((_, ref) => {
  return (
    <section
      ref={ref}
      className="scroll-mt-24 border-t border-border bg-secondary/40"
    >
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          A pastoral note from BibleLessonSpark
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-foreground/90">
          BibleLessonSpark does not replace the pastor, Discipleship Minister, teacher, deacons, elders where applicable, or the church's doctrinal oversight. It helps church leadership and teachers prepare Scripture-true lessons, aligned with the church's doctrinal convictions, so teachers can teach with confidence, students can grow in truth, and churches can faithfully honor God's Word across every age group.
        </p>
        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          <h3 className="text-base font-semibold text-foreground">When you are ready</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Begin where permission and readiness already exist. Whether that is one teacher preparing personally, a single class pilot, or a department-wide test, <a href="https://biblelessonspark.com" className="text-primary underline underline-offset-4 hover:opacity-80">BibleLessonSpark</a> is here to support -- not replace -- leadership review and oversight.
          </p>
        </div>
      </div>
    </section>
  );
});

ClosingSection.displayName = "ClosingSection";
