import { CtaForm } from "@/components/sections/CtaForm";
import { Heading } from "@/components/ui/Heading";
import { Section } from "@/components/ui/Section";
import { finalCta } from "@/content/finalCta";

export function FinalCta() {
  return (
    <Section
      id="access"
      labelledBy="access-title"
      className="overflow-hidden"
      containerClassName="flex flex-col items-center text-center"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_100%,rgb(124_92_255/0.25),transparent)]"
      />
      <Heading level={2} id="access-title" className="max-w-4xl">
        {finalCta.title}
      </Heading>
      <p className="mt-6 mb-10 max-w-md text-muted">{finalCta.text}</p>
      <CtaForm copy={finalCta.form} />
    </Section>
  );
}
