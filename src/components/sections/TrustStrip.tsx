import { Container } from "@/components/ui/Container";
import { CountUp } from "@/components/ui/CountUp";
import { Marquee } from "@/components/ui/Marquee";
import { trust } from "@/content/trust";
import { reveal, revealStagger } from "@/lib/reveal";

export function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-label"
      className="border-y border-line bg-surface/40 py-14"
    >
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-16">
          <p
            id="trust-label"
            {...reveal("eyebrow")}
            className="shrink-0 font-mono text-eyebrow text-muted uppercase"
          >
            {trust.label}
          </p>
          <Marquee items={trust.partners} className="min-w-0 lg:flex-1" />
        </div>

        <dl
          {...revealStagger()}
          className="grid gap-8 border-t border-line pt-12 sm:grid-cols-3"
        >
          {trust.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-2">
              <dt className="text-small text-muted">{stat.label}</dt>
              <dd className="text-h2 font-medium">
                <CountUp value={stat.value} />
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
