export const getRemoteConfig = jest.fn(() => ({
  setDefaults: jest.fn().mockImplementation(() => Promise.resolve()),
}));

export const setConfigSettings = jest.fn();
export const fetchAndActivate = jest.fn().mockResolvedValue(true);
export const getAll = jest.fn().mockReturnValue({});
export const getValue = jest.fn();
