export const addBreadcrumb = jest.fn();
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const captureFeedback = jest.fn();
export const expoRouterIntegration = jest.fn(() => ({}));
export const flush = jest.fn(() => Promise.resolve(true));
export const init = jest.fn();
export const showFeedbackWidget = jest.fn();
export const startInactiveSpan = jest.fn();
type SpanOptions = {
  name: string;
  op?: string;
  attributes?: Record<string, string | number | boolean>;
};

export const startSpan = jest.fn(<T>(_options: SpanOptions, fn: () => T): T =>
  fn(),
);
export const withScope = jest.fn();
export const wrap = jest.fn(<T>(component: T): T => component);

export const logger = {
  info: jest.fn(),
  warn: jest.fn(),
};

export const metrics = {
  count: jest.fn(),
};

export const appStartIntegration = jest.fn(() => ({}));
export const graphqlIntegration = jest.fn(() => ({}));
export const mobileReplayIntegration = jest.fn(() => ({}));
export const reactNativeTracingIntegration = jest.fn(() => ({}));
