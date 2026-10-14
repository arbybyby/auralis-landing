import { RevealHeading } from "@/components/ui/RevealHeading";
import { Section } from "@/components/ui/Section";
import { liveData } from "@/content/liveData";
import { reveal, revealStagger } from "@/lib/reveal";

export function LiveData() {
  return (
    <Section id="live" labelledBy="live-title">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <RevealHeading
          level={2}
          id="live-title"
          className="max-w-3xl"
          text={liveData.title}
        />
        <p
          {...reveal("eyebrow")}
          className="inline-flex items-center gap-2.5 font-mono text-eyebrow text-accent uppercase"
        >
          <span aria-hidden className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative size-2 rounded-full bg-accent" />
          </span>
          {liveData.liveLabel}
        </p>
      </div>

      <ul
        {...revealStagger()}
        className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {liveData.metrics.map((metric) => (
          <li
            key={metric.label}
            className="card-hover flex flex-col gap-6 rounded-lg border border-line bg-surface p-6"
          >
            <p className="text-small text-muted">{metric.label}</p>
            <p className="flex items-baseline gap-1.5 text-h2 font-medium">
              {metric.value}
              {metric.unit && (
                <span className="text-h3 text-muted">{metric.unit}</span>
              )}
            </p>
            <p className="font-mono text-eyebrow text-accent uppercase">
              {metric.trend}
            </p>
            <div
              aria-hidden
              className="h-12 rounded-sm bg-linear-to-b from-surface-2/50 to-transparent"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
