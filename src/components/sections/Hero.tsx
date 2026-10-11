import { Accent, Heading } from "@/components/ui/Heading";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { hero } from "@/content/hero";

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="relative flex min-h-svh items-center overflow-hidden pt-28 pb-32"
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_30%,rgb(124_92_255/0.22),transparent),radial-gradient(50%_45%_at_25%_70%,rgb(94_231_255/0.16),transparent)] mix-blend-screen"
      />
      <Container>
        <Eyebrow>{hero.eyebrow}</Eyebrow>
        <Heading level={1} id="hero-title" className="mt-6 max-w-5xl">
          {hero.headline.lead}
          <Accent>{hero.headline.accent}</Accent>
          {hero.headline.end}
        </Heading>
        <p className="mt-8 max-w-xl text-muted">{hero.subtitle}</p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button href={hero.primaryCta.href}>{hero.primaryCta.label}</Button>
          <Button href={hero.secondaryCta.href} variant="ghost">
            {hero.secondaryCta.label}
          </Button>
        </div>
      </Container>

      <Container className="absolute inset-x-0 bottom-8 flex items-center justify-between font-mono text-eyebrow text-muted uppercase">
        <span className="hidden pointer-fine:inline">{hero.hints.cursor}</span>
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
