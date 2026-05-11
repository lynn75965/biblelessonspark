import { Button } from "@/components/ui/button";

interface Props {
  onStart: () => void;
  onSeeComparison: () => void;
}

export function Hero({ onStart, onSeeComparison }: Props) {
  return (
    <section className="border-b border-border bg-gradient-to-b from-background to-secondary/30">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Curriculum Evaluation Tool
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Is Local Church Curriculum Publishing Right for Your Church?
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          A guided evaluation to help church leadership compare traditional published curriculum with locally prepared, church-specific Bible lessons.
        </p>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-foreground/90">
          <p>
            Most churches have long used traditional published curriculum. That may still be the right choice for many churches. But some churches are asking whether their Bible study lessons could be more closely aligned with their doctrine, teachers, members, age groups, ministry setting, and discipleship objectives.
          </p>
          <p>This evaluation helps church leadership consider that question wisely.</p>
          <p>
            It is designed to help pastors, Discipleship Ministers, teachers, deacons, elders where applicable, and other ministry leaders evaluate whether local church curriculum publishing may be useful for their specific church.
          </p>
        </div>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button size="lg" onClick={onStart}>
            Start the Evaluation
          </Button>
          <button
            type="button"
            onClick={onSeeComparison}
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            See how traditional and local curriculum compare
          </button>
        </div>
      </div>
    </section>
  );
}
