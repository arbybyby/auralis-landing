import { Section } from "@/components/ui/Section";
import { testimonial } from "@/content/testimonial";

export function Testimonial() {
  return (
    <Section id="testimonial" labelledBy="testimonial-author">
      <figure className="mx-auto max-w-4xl text-center">
        <blockquote className="font-serif text-h2 text-balance">
          <p>“{testimonial.quote}”</p>
        </blockquote>
        <figcaption className="mt-10 flex flex-col gap-1">
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
