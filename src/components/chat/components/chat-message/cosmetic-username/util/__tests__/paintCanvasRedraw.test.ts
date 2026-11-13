import {
  cancelPaintCanvasRedraw,
  type PaintCanvasRedrawTarget,
  schedulePaintCanvasRedraw,
} from '../paintCanvasRedraw';

function makeTarget(): PaintCanvasRedrawTarget & { redraw: jest.Mock } {
  const redraw = jest.fn();
  return { current: { redraw }, redraw };
}

describe('schedulePaintCanvasRedraw', () => {
  let requestFrame: jest.SpyInstance;
  let cancelFrame: jest.SpyInstance;
  let queued: FrameRequestCallback[];

  beforeEach(() => {
    queued = [];

    requestFrame = jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation(callback => {
        queued.push(callback);
        return queued.length;
      });

    cancelFrame = jest
      .spyOn(global, 'cancelAnimationFrame')
      .mockImplementation(() => {
        queued = [];
      });
  });

  afterEach(() => {
    requestFrame.mockRestore();
    cancelFrame.mockRestore();
  });

  const runFrame = () => {
    const callbacks = queued;
    queued = [];
    callbacks.forEach(callback => callback(0));
  };

  test('redraws every canvas that asked in one frame with one callback', () => {
    const targets = [makeTarget(), makeTarget(), makeTarget()];

    targets.forEach(schedulePaintCanvasRedraw);
    runFrame();

    expect(requestFrame).toHaveBeenCalledTimes(1);

    expect(targets.map(target => target.redraw.mock.calls.length)).toEqual([
      1, 1, 1,
    ]);
  });

  test('skips a canvas that cancelled before the frame', () => {
    const kept = makeTarget();
    const cancelled = makeTarget();

    schedulePaintCanvasRedraw(kept);
    schedulePaintCanvasRedraw(cancelled);
    cancelPaintCanvasRedraw(cancelled);
    runFrame();

    expect([
      kept.redraw.mock.calls.length,
      cancelled.redraw.mock.calls.length,
    ]).toEqual([1, 0]);
  });

  test('drops the frame when the last canvas cancels', () => {
    const target = makeTarget();

    schedulePaintCanvasRedraw(target);
    cancelPaintCanvasRedraw(target);

    expect(cancelFrame).toHaveBeenCalledTimes(1);

    schedulePaintCanvasRedraw(target);

    expect(requestFrame).toHaveBeenCalledTimes(2);
  });
});
