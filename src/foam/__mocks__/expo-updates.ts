export const reloadAsync = jest.fn(() => Promise.resolve());
export const checkForUpdateAsync = jest.fn(() =>
  Promise.resolve({ isAvailable: false }),
);
export const fetchUpdateAsync = jest.fn(() =>
  Promise.resolve({ isNew: false }),
);
export const getUpdateMetadataAsync = jest.fn(() => Promise.resolve(null));
