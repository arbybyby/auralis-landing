import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import { useRef } from "react";

import { sceneCurrent } from "@/lib/sceneStore";

interface BloomSettings {
  intensity: number;
  luminanceThreshold: number;
  radius: number;
  /** Mipmap blur levels; fewer levels mean fewer passes and a tighter glow. */
  levels: number;
}

interface EffectsProps {
  bloom: BloomSettings;
}

export function Effects({ bloom }: EffectsProps) {
  const bloomRef = useRef<BloomEffect>(null);

  // Each section scales the tier's bloom; the hero keeps it as set.
  useFrame(() => {
    if (bloomRef.current) {
      bloomRef.current.intensity = bloom.intensity * sceneCurrent.bloom;
    }
  });

  return (
    // The scene is soft sprites and a feathered halo with no hard edges, so MSAA would cost without showing.
    <EffectComposer multisampling={0}>
      <Bloom ref={bloomRef} mipmapBlur {...bloom} />
    </EffectComposer>
  );
}
