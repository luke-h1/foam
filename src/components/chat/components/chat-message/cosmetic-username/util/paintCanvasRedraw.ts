interface RedrawableCanvas {
  redraw: () => void;
}

export interface PaintCanvasRedrawTarget {
  current: RedrawableCanvas | null;
}

const pending = new Set<PaintCanvasRedrawTarget>();
let frame = 0;

function flushRedraws(): void {
  frame = 0;

  const targets = [...pending];
  pending.clear();

  for (const target of targets) {
    target.current?.redraw();
  }
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
