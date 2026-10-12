import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { markIntroReady } from "@/lib/introStore";

/**
 * Compiles every shader in the scene up front, hidden intro effects included, and tells the
 * intro once they are ready. Otherwise each effect would compile the first time it appears, and
 * on Windows that can freeze the intro for a moment mid-flight.
 */
export function useShaderWarmUp(): void {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    gl.compileAsync(scene, camera).finally(() => markIntroReady("shaders"));
  }, [gl, scene, camera]);
}
