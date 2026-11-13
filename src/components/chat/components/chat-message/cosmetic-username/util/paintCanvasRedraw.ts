interface RedrawableCanvas {
  redraw: () => void;
}

export interface PaintCanvasRedrawTarget {
  current: RedrawableCanvas | null;
}

let pending = new Set<PaintCanvasRedrawTarget>();
let flushing = new Set<PaintCanvasRedrawTarget>();
let frame = 0;

function flushRedraws(): void {
  frame = 0;

  // Animated paints flush on every texture frame. Swap two sets, so a
  // flush does not allocate, and a redraw asked for now waits for the next frame.
  const targets = pending;

  pending = flushing;
  flushing = targets;

  for (const target of targets) {
    target.current?.redraw();
  }

  targets.clear();
}

/**
 * Redraws the canvas on the next frame. Every paint canvas that asks in the
 * same frame shares one `requestAnimationFrame`, so a screen of new rows
 * costs one callback, not one per row.
 */
export function schedulePaintCanvasRedraw(
  target: PaintCanvasRedrawTarget,
): void {
  pending.add(target);

  if (frame === 0) {
    frame = requestAnimationFrame(flushRedraws);
  }
}

export function cancelPaintCanvasRedraw(target: PaintCanvasRedrawTarget): void {
  pending.delete(target);

  if (pending.size === 0 && frame !== 0) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}
