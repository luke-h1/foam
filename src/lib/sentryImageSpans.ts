import { startInactiveSpan } from '@sentry/react-native';
import type { Image as ExpoImage } from 'expo-image';

/**
 * Hard cap on how long a resource.image.* span may stay open; stuck CDN loads
 * otherwise hold their parent transaction open for hours (FOAM-TV-MOBILE-1C).
 */
const IMAGE_SPAN_DEADLINE_MS = 5_000;

/**
 * The two expo-image statics this module instruments.
 */
export interface ExpoImageLoaders {
  prefetch: (
    ...args: Parameters<(typeof ExpoImage)['prefetch']>
  ) => Promise<boolean>;
  loadAsync: (
    ...args: Parameters<(typeof ExpoImage)['loadAsync']>
  ) => Promise<unknown>;
}

const instrumentedClasses = new WeakSet<ExpoImageLoaders>();

/**
 * Replaces Sentry's wrapExpoImage with two load-bearing differences: spans are
 * created with onlyIfParent so chat emote loads (which run outside any
 * transaction) never become root transactions of their own, and spans are
 * force-ended after IMAGE_SPAN_DEADLINE_MS so a load that never settles cannot
 * hold its parent transaction open.
 */
export function instrumentExpoImageLoads(imageClass: ExpoImageLoaders): void {
  if (instrumentedClasses.has(imageClass)) {
    return;
  }
  instrumentedClasses.add(imageClass);
  wrapPrefetch(imageClass);
  wrapLoadAsync(imageClass);
}

function trackImageSpan<T>(
  options: {
    name: string;
    op: string;
    attributes: Record<string, string | number>;
  },
  run: () => Promise<T>,
  resultIsOk: (result: T) => boolean,
): Promise<T> {
  const span = startInactiveSpan({
    name: options.name,
    op: options.op,
    attributes: {
      'sentry.origin': 'auto.resource.expo_image',
      ...options.attributes,
    },
    onlyIfParent: true,
  });
  if (!span.isRecording()) {
    return run();
  }

  const deadline = setTimeout(() => {
    span.setStatus({ code: 2, message: 'deadline_exceeded' });
    span.end();
  }, IMAGE_SPAN_DEADLINE_MS);

  const finish = (ok: boolean) => {
    clearTimeout(deadline);
    span.setStatus(
      ok ? { code: 1, message: 'ok' } : { code: 2, message: 'internal_error' },
    );
    span.end();
  };

  let result: Promise<T>;
  try {
    result = run();
  } catch (error) {
    finish(false);
    throw error;
  }
  return result.then(
    value => {
      finish(resultIsOk(value));
      return value;
    },
    (error: unknown) => {
      finish(false);
      throw error;
    },
  );
}

function wrapPrefetch(imageClass: ExpoImageLoaders): void {
  const originalPrefetch = imageClass.prefetch.bind(imageClass);
  imageClass.prefetch = (
    ...args: Parameters<ExpoImageLoaders['prefetch']>
  ): Promise<boolean> => {
    const [urls] = args;
    const urlList = Array.isArray(urls) ? urls : [urls];
    const firstUrl = urlList[0] ?? 'unknown';
    const description =
      urlList.length === 1 ? describeUrl(firstUrl) : `${urlList.length} images`;
    return trackImageSpan(
      {
        name: `Image prefetch ${description}`,
        op: 'resource.image.prefetch',
        attributes: {
          'image.url_count': urlList.length,
          ...(urlList.length === 1
            ? { 'image.url': sanitizeUrl(firstUrl) }
            : undefined),
        },
      },
      () => originalPrefetch(...args),
      result => result,
    );
  };
}

function wrapLoadAsync(imageClass: ExpoImageLoaders): void {
  const originalLoadAsync = imageClass.loadAsync.bind(imageClass);
  imageClass.loadAsync = (
    ...args: Parameters<ExpoImageLoaders['loadAsync']>
  ): Promise<unknown> => {
    const [source] = args;
    const imageUrl = sourceUrl(source);
    return trackImageSpan(
      {
        name: `Image load ${describeSource(source)}`,
        op: 'resource.image.load',
        attributes: imageUrl ? { 'image.url': sanitizeUrl(imageUrl) } : {},
      },
      () => originalLoadAsync(...args),
      () => true,
    );
  };
}

function describeSource(
  source: Parameters<ExpoImageLoaders['loadAsync']>[0],
): string {
  if (typeof source === 'number') {
    return `asset #${source}`;
  }
  const url = sourceUrl(source);
  return url ? describeUrl(url) : 'unknown source';
}

function sourceUrl(
  source: Parameters<ExpoImageLoaders['loadAsync']>[0],
): string | undefined {
  if (typeof source === 'string') {
    return source;
  }
  if (typeof source === 'object' && source?.uri) {
    return source.uri;
  }
  return undefined;
}

function sanitizeUrl(url: string): string {
  const withoutQuery = url.split('?')[0] ?? url;
  return withoutQuery.split('#')[0] ?? withoutQuery;
}

function describeUrl(url: string): string {
  const sanitized = sanitizeUrl(url);
  return sanitized.split('/').pop() ?? sanitized;
}
