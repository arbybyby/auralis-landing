/**
 * Runs `callback` once the main thread is idle, or after `timeoutMs` at the latest. Returns a
 * function that cancels it.
 */
export function whenIdle(callback: () => void, timeoutMs: number): () => void {
  // Safari has no requestIdleCallback; the next task is the closest thing it offers.
  if (typeof window.requestIdleCallback !== "function") {
    const handle = window.setTimeout(callback, 0);
    return () => window.clearTimeout(handle);
  }
  const handle = window.requestIdleCallback(callback, { timeout: timeoutMs });
  return () => window.cancelIdleCallback(handle);
}
