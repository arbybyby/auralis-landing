import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { howItWorks } from "@/content/howItWorks";

export function HowItWorks() {
  return (
    <Section id="how" labelledBy="how-title">
      <Heading level={2} id="how-title" className="max-w-3xl">
        {howItWorks.title}
      </Heading>
      <ol className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
        {howItWorks.steps.map((step) => (
          <li key={step.number} className="border-t border-line pt-6">
            <span className="font-serif text-h2 text-accent italic">
              {step.number}
            </span>
            <Heading level={3} className="mt-6">
              {step.title}
            </Heading>
            <p className="mt-4 max-w-xs text-muted">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
