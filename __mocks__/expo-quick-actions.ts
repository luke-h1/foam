export const initial = null;
export const maxCount = undefined;

export const setItems = jest.fn(() => Promise.resolve());
export const isSupported = jest.fn(() => Promise.resolve(false));
export const addListener = jest.fn(() => ({ remove: jest.fn() }));
