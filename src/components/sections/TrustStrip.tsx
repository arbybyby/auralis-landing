import { Container } from "@/components/ui/Container";
import { trust } from "@/content/trust";

export function TrustStrip() {
  return (
    <section
      aria-labelledby="trust-label"
      className="border-y border-line bg-surface/40 py-14"
    >
      <Container className="flex flex-col gap-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <p
            id="trust-label"
            className="font-mono text-eyebrow text-muted uppercase"
          >
            {trust.label}
          </p>
          <ul className="flex flex-wrap gap-x-10 gap-y-4">
            {trust.partners.map((partner) => (
              <li
                key={partner}
                className="text-lg font-medium tracking-tight text-muted"
              >
                {partner}
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid gap-8 border-t border-line pt-12 sm:grid-cols-3">
          {trust.stats.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-2">
              <dt className="text-small text-muted">{stat.label}</dt>
              <dd className="text-h2 font-medium">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
