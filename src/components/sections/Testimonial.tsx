import { Section } from "@/components/ui/Section";
import { SplitLines } from "@/components/ui/SplitLines";
import { testimonial } from "@/content/testimonial";
import { revealSequence, revealStep } from "@/lib/reveal";

export function Testimonial() {
  const quote = `“${testimonial.quote}”`;

  return (
    <Section id="testimonial" labelledBy="testimonial-author">
      {/* The quote rises line by line, and the author follows once it is told. */}
      <figure {...revealSequence()} className="mx-auto max-w-4xl text-center">
        <blockquote className="font-serif text-h2 text-balance">
          <p {...revealStep("mask-line")}>
            <span className="sr-only">{quote}</span>
            <SplitLines text={quote} />
          </p>
        </blockquote>
        <figcaption
          {...revealStep("fade-up")}
          className="mt-10 flex flex-col gap-1"
        >
          <span id="testimonial-author" className="font-medium">
            {testimonial.author}
          </span>
          <span className="text-small text-muted">
            {testimonial.role}, {testimonial.company}
          </span>
        </figcaption>
      </figure>
    </Section>
  );
}
