"use client";

import { useEffect, useRef, useState } from "react";

import { IntroLoader } from "@/components/IntroLoader";
import { SCENE_TIERS } from "@/lib/constants";
import { getDeviceTier } from "@/lib/deviceTier";
import { chooseIntroMode, runIntro } from "@/lib/introRunner";
import type { IntroHandle } from "@/lib/introRunner";

/** The opening sequence: owns the loader and hands the page over once the intro is done. */
export function IntroSequence() {
  const [isLoaderMounted, setLoaderMounted] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const intro = useRef<IntroHandle | null>(null);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;
    const tier = getDeviceTier();
    const mode = chooseIntroMode(
      tier !== "none" && SCENE_TIERS[tier].fullIntro,
    );
    const handle = runIntro(mode, loader, () => setLoaderMounted(false));
    intro.current = handle;
    return () => handle.dispose();
  }, []);

  if (!isLoaderMounted) return null;
  return <IntroLoader ref={loaderRef} onSkip={() => intro.current?.skip()} />;
}
