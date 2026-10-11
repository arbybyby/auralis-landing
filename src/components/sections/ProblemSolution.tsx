import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { problemSolution } from "@/content/problemSolution";
import { cn } from "@/lib/utils";

export function ProblemSolution() {
  return (
    <Section id="problem" containerClassName="flex flex-col">
      {problemSolution.map((beat) => {
        const titleId = `beat-${beat.title.toLowerCase()}`;
        return (
          <article
            key={beat.title}
            aria-labelledby={titleId}
            className="grid gap-6 border-t border-line py-12 first:border-t-0 md:grid-cols-[1fr_1.4fr] md:gap-16 md:py-20"
          >
            <Heading
              level={2}
              id={titleId}
              className={cn(beat.isSolution && "text-accent")}
            >
              {beat.title}
            </Heading>
            <p
              className={cn(
                "max-w-xl self-end text-h3 text-balance",
                beat.isSolution ? "text-text" : "text-muted",
              )}
            >
              {beat.text}
            </p>
          </article>
        );
      })}
    </Section>
  );
}
