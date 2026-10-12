"use client";

import { Component } from "react";
import type { ReactNode } from "react";

import { reportSceneFailure } from "@/lib/sceneHealth";

interface SceneErrorBoundaryProps {
  children: ReactNode;
}

interface SceneErrorBoundaryState {
  hasFailed: boolean;
}

/**
 * Catches anything the 3D tree throws, a WebGL context that cannot be created included, and lets
 * the static planet take over, so a crash never blanks the page or leaves the intro waiting.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { hasFailed: false };

  static getDerivedStateFromError(): SceneErrorBoundaryState {
    return { hasFailed: true };
  }

  componentDidCatch(): void {
    reportSceneFailure();
  }

  render() {
    return this.state.hasFailed ? null : this.props.children;
  }
}
