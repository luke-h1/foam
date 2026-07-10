import { Platform } from 'react-native';

import type {
  MinimumVersionTrack,
  RemoteConfigEntry,
  RemoteConfigType,
} from '@app/hooks/firebase/useRemoteConfig';

import { getMinimumVersion } from '../getMinimumVersion';

function entry<T>(value: T): RemoteConfigEntry<T> {
  return { raw: JSON.stringify(value), value, source: 'remote' };
}

function createRemoteConfig(minimumVersion: {
  android?: Partial<Record<MinimumVersionTrack, string>>;
  ios?: Partial<Record<MinimumVersionTrack, string>>;
}): RemoteConfigType {
  return {
    updateAppButtonAllowedUsers: entry([]),
    splash: entry({ '7tvUnavailable': false, app: false }),
    minimumVersion: entry(
      minimumVersion as RemoteConfigType['minimumVersion']['value'],
    ),
    statusPageUrl: entry('https://status.foam-app.com'),
    websiteUrl: entry('https://foam-app.com'),
    admins: entry([]),
    experiments: entry({}),
    bundleButtonEnabled: entry({
      ios: {
        development: false,
        internal: true,
        testflight: false,
        production: false,
        e2e: false,
      },
    }),
  };
}

const remoteConfig = createRemoteConfig({
  android: {
    development: '1.0.0',
    internal: '1.1.0',
    testflight: '1.2.0',
    production: '1.3.0',
  },
  ios: {
    development: '2.0.0',
    internal: '2.1.0',
    testflight: '2.2.0',
    production: '2.3.0',
  },
});

const originalOS = Platform.OS;

afterEach(() => {
  Platform.OS = originalOS;
});

describe('getMinimumVersion', () => {
  test('reads the ios track for the current variant on ios', () => {
    Platform.OS = 'ios';

    expect(getMinimumVersion('production', remoteConfig)).toBe('2.3.0');
    expect(getMinimumVersion('testflight', remoteConfig)).toBe('2.2.0');
    expect(getMinimumVersion('internal', remoteConfig)).toBe('2.1.0');
    expect(getMinimumVersion('development', remoteConfig)).toBe('2.0.0');
  });

  test('reads the android track for the current variant on android', () => {
    Platform.OS = 'android';

    expect(getMinimumVersion('production', remoteConfig)).toBe('1.3.0');
    expect(getMinimumVersion('testflight', remoteConfig)).toBe('1.2.0');
    expect(getMinimumVersion('internal', remoteConfig)).toBe('1.1.0');
    expect(getMinimumVersion('development', remoteConfig)).toBe('1.0.0');
  });

  test('never gates e2e builds', () => {
    Platform.OS = 'ios';
    expect(getMinimumVersion('e2e', remoteConfig)).toBe('');

    Platform.OS = 'android';
    expect(getMinimumVersion('e2e', remoteConfig)).toBe('');
  });

  test('falls back to an empty version when the track is missing', () => {
    Platform.OS = 'ios';
    const partial = createRemoteConfig({
      android: {
        development: '1.0.0',
        internal: '1.1.0',
        testflight: '1.2.0',
        production: '1.3.0',
      },
      ios: {
        development: '2.0.0',
        internal: '2.1.0',
        testflight: '2.2.0',
        // production intentionally omitted to exercise the ?? '' fallback
      },
    });

    expect(getMinimumVersion('production', partial)).toBe('');
  });

  test('treats web as the android track', () => {
    Platform.OS = 'web';

    expect(getMinimumVersion('production', remoteConfig)).toBe('1.3.0');
  });
});
