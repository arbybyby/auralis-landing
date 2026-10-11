import { Bloom, EffectComposer } from "@react-three/postprocessing";

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
  return (
    // The scene is soft sprites and a feathered halo with no hard edges, so MSAA would cost without showing.
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur {...bloom} />
    </EffectComposer>
  );
}
