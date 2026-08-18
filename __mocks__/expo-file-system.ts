/**
 * Faithful fake of the parts of expo-file-system's next (Directory/File)
 * API that src/utils/image/image-cache.ts and src/lib/sentryCacheSweep.ts
 * (and their tests) rely on. The real module wraps native ExpoFileSystem
 * bindings that aren't available under Jest, so this in-memory node map
 * stands in for the device disk.
 */
type MockNode =
  | { kind: 'directory'; children: string[] }
  | { kind: 'file'; size: number | null };

const nodes = new Map<string, MockNode>();
const deletedUris: string[] = [];
const failingDeletes = new Set<string>();
let downloadCount = 0;
let defaultFileSize = 128;
let deferDownloads = false;
const pendingDownloads: (() => void)[] = [];

export class Directory {
  uri: string;

  constructor(base: string | { uri: string }, name?: string) {
    const baseUri = base instanceof Object ? base.uri : base;
    this.uri = name ? `${baseUri.replace(/\/?$/, '/')}${name}/` : baseUri;
  }

  get exists() {
    return nodes.get(this.uri)?.kind === 'directory';
  }

  list(): (Directory | File)[] {
    const node = nodes.get(this.uri);
    if (node?.kind !== 'directory') {
      throw new Error(`Directory does not exist: ${this.uri}`);
    }
    return node.children.map(childUri =>
      nodes.get(childUri)?.kind === 'directory'
        ? new Directory(childUri)
        : new File(childUri),
    );
  }

  delete() {
    Array.from(nodes.keys()).forEach(uri => {
      if (uri.startsWith(this.uri)) {
        nodes.delete(uri);
      }
    });
  }
}

export class File {
  uri: string;

  constructor(base: string | { uri: string }, name?: string) {
    this.uri =
      base instanceof Object
        ? `${base.uri.replace(/\/?$/, '/')}${name ?? ''}`
        : base;
  }

  static async downloadFileAsync(_url: string, cacheDir: Directory) {
    if (deferDownloads) {
      await new Promise<void>(resolve => {
        pendingDownloads.push(resolve);
      });
    }
    downloadCount += 1;
    const file = new File(cacheDir, `download-${downloadCount}.png`);
    nodes.set(file.uri, { kind: 'file', size: defaultFileSize });
    return file;
  }

  get exists() {
    return nodes.get(this.uri)?.kind === 'file';
  }

  get size() {
    const node = nodes.get(this.uri);
    return node?.kind === 'file' ? node.size : null;
  }

  delete() {
    if (failingDeletes.has(this.uri)) {
      throw new Error(`Cannot delete: ${this.uri}`);
    }
    nodes.delete(this.uri);
    deletedUris.push(this.uri);
  }

  move(destination: File) {
    const node = nodes.get(this.uri);
    nodes.delete(this.uri);
    this.uri = destination.uri;
    nodes.set(this.uri, node ?? { kind: 'file', size: defaultFileSize });
  }

  write() {
    nodes.set(this.uri, { kind: 'file', size: defaultFileSize });
  }

  async base64() {
    return 'base64';
  }
}

export const Paths = {
  cache: 'file:///cache/',
};

/**
 * Test-only controls, mirroring the pattern in __mocks__/react-native-mmkv.js.
 * Not part of the real expo-file-system surface.
 */
export const __mockFileSystem = {
  addDirectory: (uri: string, children: string[]) => {
    nodes.set(uri, { kind: 'directory', children });
  },
  addFile: (uri: string, size: number | null) => {
    nodes.set(uri, { kind: 'file', size });
  },
  failDeleteOf: (uri: string) => {
    failingDeletes.add(uri);
  },
  deletedUris: () => [...deletedUris],
  downloadCount: () => downloadCount,
  evict: (uri: string) => nodes.delete(uri),
  exists: (uri: string) => nodes.has(uri),
  pendingDownloadCount: () => pendingDownloads.length,
  releaseDownload: () => {
    pendingDownloads.shift()?.();
  },
  releaseAllDownloads: () => {
    while (pendingDownloads.length > 0) {
      pendingDownloads.shift()?.();
    }
  },
  setDeferDownloads: (defer: boolean) => {
    deferDownloads = defer;
  },
  setFileSize: (size: number) => {
    defaultFileSize = size;
  },
  reset: () => {
    nodes.clear();
    deletedUris.length = 0;
    failingDeletes.clear();
    downloadCount = 0;
    defaultFileSize = 128;
    deferDownloads = false;
    pendingDownloads.length = 0;
  },
};
