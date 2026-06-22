const Bugsnag = {
  start: jest.fn(),
  notify: jest.fn(),
  leaveBreadcrumb: jest.fn(),
  addMetadata: jest.fn(),
  setUser: jest.fn(),
  isStarted: jest.fn(() => false),
};

export default Bugsnag;
