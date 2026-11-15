export const getRemoteConfig = jest.fn(() => ({
  settings: {
    minimumFetchIntervalMillis: 0,
    fetchTimeoutMillis: 0,
  },
  defaultConfig: {},
}));

export const fetchAndActivate = jest.fn().mockResolvedValue(true);
export const getAll = jest.fn().mockReturnValue({});
export const getValue = jest.fn();
