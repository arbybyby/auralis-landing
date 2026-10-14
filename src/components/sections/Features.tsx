import { Eyebrow } from "@/components/ui/Eyebrow";
import { Heading } from "@/components/ui/Heading";
import { RevealHeading } from "@/components/ui/RevealHeading";
import { Section } from "@/components/ui/Section";
import { features } from "@/content/features";
import { revealStagger } from "@/lib/reveal";

export function Features() {
  return (
    <Section id="platform" labelledBy="features-title">
      <RevealHeading
        level={2}
        id="features-title"
        className="max-w-3xl"
        text={features.title}
      />
      <ul
        {...revealStagger("scale-in")}
        className="mt-16 grid gap-4 md:grid-cols-2"
      >
        {features.items.map((item) => (
          <li
            key={item.number}
            className="card-hover flex min-h-72 flex-col justify-between gap-12 rounded-lg border border-line bg-linear-to-b from-surface-2/60 to-surface p-8 md:p-10"
          >
            <Eyebrow>{item.number}</Eyebrow>
            <div>
              <Heading level={3}>{item.title}</Heading>
              <p className="mt-4 max-w-md text-muted">{item.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
