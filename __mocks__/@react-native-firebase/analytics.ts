export const getAnalytics = jest.fn(() => ({}));

export const logEvent = jest.fn().mockResolvedValue(undefined);
export const logScreenView = jest.fn().mockResolvedValue(undefined);
export const setAnalyticsCollectionEnabled = jest
  .fn()
  .mockResolvedValue(undefined);
export const setUserId = jest.fn().mockResolvedValue(undefined);
export const setUserProperties = jest.fn().mockResolvedValue(undefined);
