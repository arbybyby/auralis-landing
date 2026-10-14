import { CtaForm } from "@/components/sections/CtaForm";
import { RevealHeading } from "@/components/ui/RevealHeading";
import { Section } from "@/components/ui/Section";
import { finalCta } from "@/content/finalCta";
import { reveal } from "@/lib/reveal";

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
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_100%,rgb(124_92_255/0.25),transparent)] mix-blend-screen"
      />
      <RevealHeading
        level={2}
        id="access-title"
        className="max-w-4xl"
        text={finalCta.title}
      />
      <p {...reveal("fade-up")} className="mt-6 mb-10 max-w-md text-muted">
        {finalCta.text}
      </p>
      {/* Takes the form's width, so the centred column lays out exactly as before. */}
      <div {...reveal("fade-up")} className="w-full max-w-xl">
        <CtaForm copy={finalCta.form} />
      </div>
    </Section>
  );
}
