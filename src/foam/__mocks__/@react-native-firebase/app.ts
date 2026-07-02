export const getApp = jest.fn(() => ({
  name: '[DEFAULT]',
  options: {},
  analytics: jest.fn(() => {}),
  inAppMessaging: jest.fn(() => {}),
  messaging: jest.fn(() => {}),
  perf: jest.fn(() => {}),
}));

export const initializeApp = jest.fn(() => ({
  name: '[DEFAULT]',
  options: {},
}));
