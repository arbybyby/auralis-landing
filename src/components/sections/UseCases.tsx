import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { useCases } from "@/content/useCases";

export function UseCases() {
  return (
    <Section id="use-cases" labelledBy="use-cases-title">
      <Heading level={2} id="use-cases-title" className="max-w-3xl">
        {useCases.title}
      </Heading>
      <ul className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {useCases.items.map((item) => (
          <li
            key={item.title}
            className="flex min-h-80 flex-col justify-end rounded-lg border border-line bg-linear-to-t from-accent-2/15 via-surface to-surface p-8"
          >
            <Heading level={3}>{item.title}</Heading>
            <p className="mt-4 text-small text-muted">{item.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
