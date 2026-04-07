const mockCount = jest.fn();
const mockInit = jest.fn();
const mockReactNavigationIntegration = jest.fn(() => ({
  registerNavigationContainer: jest.fn(),
}));
const mockMobileReplayIntegration = jest.fn(() => ({
  name: 'MobileReplay',
}));
const mockWrapExpoImage = jest.fn();

jest.mock('@sentry/react-native', () => ({
  __esModule: true,
  metrics: {
    count: mockCount,
  },
  init: mockInit,
  reactNavigationIntegration: mockReactNavigationIntegration,
  mobileReplayIntegration: mockMobileReplayIntegration,
  wrapExpoImage: mockWrapExpoImage,
}));

jest.mock('expo-image', () => ({
  __esModule: true,
  Image: {},
}));

// eslint-disable-next-line no-underscore-dangle
(globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;

const { countMetric } =
  jest.requireActual<typeof import('../sentry-service')>('../sentry-service');

describe('sentry-service', () => {
  beforeEach(() => {
    mockCount.mockClear();
  });

  it('captures counter metrics with attributes', () => {
    countMetric('ota.update.available', {
      platform: 'ios',
      environment: 'production',
    });

    expect(mockCount).toHaveBeenCalledWith('ota.update.available', 1, {
      attributes: {
        platform: 'ios',
        environment: 'production',
      },
    });
  });

  it('allows overriding the counter value', () => {
    countMetric('stream.ready', { component: 'StreamPlayer' }, 3);

    expect(mockCount).toHaveBeenCalledWith('stream.ready', 3, {
      attributes: {
        component: 'StreamPlayer',
      },
    });
  });
});
