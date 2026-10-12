import type { Ref } from "react";

import { Container } from "@/components/ui/Container";
import { intro } from "@/content/intro";

interface IntroLoaderProps {
  ref: Ref<HTMLDivElement>;
  onSkip: () => void;
}

/**
 * The intro's quiet controls over the dark scene: a tiny readiness counter and bar in one corner,
 * a skip control in the other. Only shown while the boot script marks the intro as pending, so it
 * never appears without JavaScript.
 */
export function IntroLoader({ ref, onSkip }: IntroLoaderProps) {
  return (
    <div
      ref={ref}
      className="intro-loader pointer-events-none fixed inset-x-0 bottom-0 z-90"
    >
      <Container className="flex items-center justify-between py-6 font-mono text-eyebrow text-muted uppercase">
        <span data-intro-progress className="flex items-center gap-3">
          <span data-intro-counter aria-hidden>
            000
          </span>
          <span
            role="progressbar"
            aria-label={intro.progressLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            className="h-px w-10 bg-line"
          >
            <span
              data-intro-bar
              className="block h-full w-full origin-left scale-x-0 bg-accent"
            />
          </span>
        </span>
        <button
          type="button"
          onClick={onSkip}
          aria-label={intro.skipLabel}
          className="pointer-events-auto rounded-sm py-1 tracking-[inherit] uppercase transition-colors duration-300 hover:text-text"
        >
          {intro.skip}
        </button>
      </Container>
    </div>
  );
}
