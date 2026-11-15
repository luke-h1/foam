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

  const targets = pending;

  pending = flushing;
  flushing = targets;

  for (const target of targets) {
    target.current?.redraw();
  }

  targets.clear();
}

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
