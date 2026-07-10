jest.mock('@sentry/react-native', () => ({
  startInactiveSpan: jest.fn(),
}));

import type { Span } from '@sentry/react-native';
import { startInactiveSpan } from '@sentry/react-native';

import type { ExpoImageLoaders } from '@app/lib/sentryImageSpans';
import { instrumentExpoImageLoads } from '@app/lib/sentryImageSpans';

const startInactiveSpanMock = jest.mocked(startInactiveSpan);

function createFakeSpan() {
  const span: Span = {
    spanContext: () => ({
      traceId: 'trace-id',
      spanId: 'span-id',
      traceFlags: 1,
    }),
    end: () => undefined,
    setAttribute() {
      return this;
    },
    setAttributes() {
      return this;
    },
    setStatus() {
      return this;
    },
    updateName() {
      return this;
    },
    isRecording: () => true,
    addEvent() {
      return this;
    },
    addLink() {
      return this;
    },
    addLinks() {
      return this;
    },
    recordException: () => undefined,
  };
  return {
    span,
    end: jest.spyOn(span, 'end'),
    setStatus: jest.spyOn(span, 'setStatus'),
  };
}

function createFakeImageClass(loadResult: Promise<unknown>): ExpoImageLoaders {
  return {
    prefetch: jest.fn((..._args: Parameters<ExpoImageLoaders['prefetch']>) =>
      Promise.resolve(true),
    ),
    loadAsync: jest.fn(
      (..._args: Parameters<ExpoImageLoaders['loadAsync']>) => loadResult,
    ),
  };
}

describe('instrumentExpoImageLoads span deadline', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('a load that never settles is force-ended at the deadline', () => {
    const { span, end, setStatus } = createFakeSpan();
    startInactiveSpanMock.mockReturnValue(span);
    const imageClass = createFakeImageClass(new Promise(() => undefined));
    instrumentExpoImageLoads(imageClass);

    void imageClass.loadAsync({ uri: 'https://a.io/stuck.avif' });
    expect(end).not.toHaveBeenCalled();

    jest.advanceTimersByTime(5_000);

    expect(setStatus.mock.calls).toEqual([
      [{ code: 2, message: 'deadline_exceeded' }],
    ]);
    expect(end).toHaveBeenCalledTimes(1);
  });

  test('a load that settles after the deadline keeps the deadline_exceeded status', async () => {
    const { span, end, setStatus } = createFakeSpan();
    startInactiveSpanMock.mockReturnValue(span);
    let resolveLoad!: (value: string) => void;
    const imageClass = createFakeImageClass(
      new Promise<string>(resolve => {
        resolveLoad = resolve;
      }),
    );
    instrumentExpoImageLoads(imageClass);

    const load = imageClass.loadAsync({ uri: 'https://a.io/slow.avif' });
    jest.advanceTimersByTime(5_000);
    resolveLoad('image-ref');
    await expect(load).resolves.toBe('image-ref');

    expect(setStatus.mock.calls).toEqual([
      [{ code: 2, message: 'deadline_exceeded' }],
    ]);
    expect(end).toHaveBeenCalledTimes(1);
  });

  test('a load that settles before the deadline reports ok and clears the timer', async () => {
    const { span, end, setStatus } = createFakeSpan();
    startInactiveSpanMock.mockReturnValue(span);
    const imageClass = createFakeImageClass(Promise.resolve('image-ref'));
    instrumentExpoImageLoads(imageClass);

    await expect(
      imageClass.loadAsync({ uri: 'https://a.io/fast.avif' }),
    ).resolves.toBe('image-ref');

    expect(setStatus.mock.calls).toEqual([[{ code: 1, message: 'ok' }]]);
    expect(end).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });
});
