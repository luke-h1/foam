export const ANDROID_EMBEDDED_URL_BASE_RESOURCE = 'file:///android_res/';

export class Asset {
  static byHash = {};

  static byUri = {};

  name = '';

  type = '';

  hash: string | null = null;

  uri = '';

  localUri: string | null = null;

  width: number | null = null;

  height: number | null = null;

  downloaded = false;

  downloading = false;

  static loadAsync = jest.fn((): Promise<Asset[]> => Promise.resolve([]));

  static fromModule = jest.fn(() => new Asset());

  static fromMetadata = jest.fn(() => new Asset());

  static fromURI = jest.fn(() => new Asset());

  downloadAsync = jest.fn(() => Promise.resolve(this));
}

export const useAssets = jest.fn(() => [null, null]);
