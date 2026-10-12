import { Accent, Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { InteractionHint } from "@/components/ui/InteractionHint";
import { SplitText } from "@/components/ui/SplitText";
import { SplitWords } from "@/components/ui/SplitWords";
import { hero } from "@/content/hero";

export function Hero() {
  const { lead, accent, end } = hero.headline;

  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative flex min-h-svh items-center overflow-hidden pt-28 pb-32"
    >
      <div
        aria-hidden
        data-intro="backdrop"
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_30%,rgb(124_92_255/0.22),transparent),radial-gradient(50%_45%_at_25%_70%,rgb(94_231_255/0.16),transparent)] mix-blend-screen"
      />
      {/* Keeps the copy legible whichever part of the planet turns behind it. */}
      <div
        aria-hidden
        data-intro="backdrop"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-void/70 from-60% to-transparent to-85% lg:bg-linear-to-r lg:from-30% lg:to-60%"
      />
      <Container>
        <Eyebrow data-intro="eyebrow" className="relative">
          {hero.eyebrow}
          {/* Draws in under the eyebrow during the intro, then fades; never seen otherwise. */}
          <span
            aria-hidden
            data-intro-line
            className="absolute inset-x-0 -bottom-2 h-px origin-left scale-x-0 bg-accent opacity-0"
          />
        </Eyebrow>
        <Heading
          level={1}
          id="hero-title"
          aria-label={`${lead}${accent}${end}`}
          className="mt-6 max-w-5xl"
        >
          {/* The spaces between the split letters are plain text, so the whole line waits hidden
              with its letters; otherwise the browser would count the headline as shown too early. */}
          <span data-intro="headline">
            <SplitText text={lead} />
            {/* Keeps the accent word and its punctuation on one line, as in the plain text. */}
            <span data-intro-finale className="whitespace-nowrap">
              <span data-intro-accent>
                <Accent>
                  <SplitText text={accent} />
                </Accent>
              </span>
              <SplitText text={end} />
            </span>
          </span>
        </Heading>
        {/* Waits hidden with its words, for the same reason as the headline. */}
        <p data-intro="subtitle" className="mt-8 max-w-xl text-muted">
          <SplitWords text={hero.subtitle} />
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button data-intro="button" href={hero.primaryCta.href}>
            {hero.primaryCta.label}
          </Button>
          <Button
            data-intro="button"
            href={hero.secondaryCta.href}
            variant="ghost"
          >
            {hero.secondaryCta.label}
          </Button>
        </div>
      </Container>

      <Container
        data-intro="hints"
        className="absolute inset-x-0 bottom-8 flex items-center justify-between font-mono text-eyebrow text-muted uppercase"
      >
        <InteractionHint pointer={hero.hints.cursor} tilt={hero.hints.tilt} />
        <span className="flex items-center gap-3 sm:ml-auto">
          {hero.hints.scroll}
          <span
            aria-hidden
            className="h-8 w-px bg-linear-to-b from-accent to-transparent"
          />
        </span>
      </Container>
    </section>
  );
}
