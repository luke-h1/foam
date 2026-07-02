export const requestPermissionsAsync = jest.fn(() =>
  Promise.resolve({ granted: true, status: 'granted' }),
);

export const getPermissionsAsync = jest.fn(() =>
  Promise.resolve({ granted: true, status: 'granted' }),
);

export class Album {
  static get = jest.fn(() => Promise.resolve(null));

  static create = jest.fn(() =>
    Promise.resolve({ id: 'album', title: 'foam' }),
  );
}

export class Asset {
  static create = jest.fn(() => Promise.resolve({ id: 'asset' }));
}

export const createAssetAsync = jest.fn(() => Promise.resolve({ id: 'asset' }));
