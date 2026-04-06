const countMock = jest.fn();
const initMock = jest.fn();
const reactNavigationIntegrationMock = jest.fn(() => ({
  registerNavigationContainer: jest.fn(),
}));
const mobileReplayIntegrationMock = jest.fn(() => ({
  name: 'MobileReplay',
}));
const wrapExpoImageMock = jest.fn();

jest.mock('@sentry/react-native', () => ({
  __esModule: true,
  metrics: {
    count: countMock,
  },
  init: initMock,
  reactNavigationIntegration: reactNavigationIntegrationMock,
  mobileReplayIntegration: mobileReplayIntegrationMock,
  wrapExpoImage: wrapExpoImageMock,
}));

jest.mock('expo-image', () => ({
  __esModule: true,
  Image: {},
}));

describe('sentry-service', () => {
  beforeEach(() => {
    // eslint-disable-next-line no-underscore-dangle
    (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;
    countMock.mockClear();
  });

  it('captures counter metrics with attributes', async () => {
    const { countMetric } = await import('../sentry-service');

    countMetric('ota.update.available', {
      platform: 'ios',
      environment: 'production',
    });

    expect(countMock).toHaveBeenCalledWith('ota.update.available', 1, {
      attributes: {
        platform: 'ios',
        environment: 'production',
      },
    });
  });

  it('allows overriding the counter value', async () => {
    const { countMetric } = await import('../sentry-service');

    countMetric('stream.ready', { component: 'StreamPlayer' }, 3);

    expect(countMock).toHaveBeenCalledWith('stream.ready', 3, {
      attributes: {
        component: 'StreamPlayer',
      },
    });
  });
});
