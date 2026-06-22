const BugsnagPerformance = {
  start: jest.fn(),
  withInstrumentedAppStarts: <T>(App: T): T => App,
};

export default BugsnagPerformance;
