import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import { useRef } from "react";

import type { BloomSettings } from "@/lib/constants";
import { INTRO } from "@/lib/intro";
import { introState, markIntroReady } from "@/lib/introStore";
import { sceneCurrent } from "@/lib/sceneStore";

interface EffectsProps {
  bloom: BloomSettings;
}

export function Effects({ bloom }: EffectsProps) {
  const bloomRef = useRef<BloomEffect>(null);
  // Frames drawn with the bloom, up to the warm-up count: its shaders are ready after a few.
  const framesRun = useRef(0);

  // Each section scales the tier's bloom and the hero keeps it as set; the intro flares it.
  useFrame(() => {
    if (framesRun.current < INTRO.warmUpFrames) {
      framesRun.current += 1;
      if (framesRun.current === INTRO.warmUpFrames) markIntroReady("effects");
    }
    if (bloomRef.current) {
      bloomRef.current.intensity =
        bloom.intensity * sceneCurrent.bloom * introState.bloom;
    }
  });

  return (
    // The scene is soft sprites and a feathered halo with no hard edges, so MSAA would cost without showing.
    <EffectComposer multisampling={0}>
      <Bloom ref={bloomRef} mipmapBlur {...bloom} />
    </EffectComposer>
  );
}
