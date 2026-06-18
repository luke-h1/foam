import {
  internal,
  setAtPath,
  type Change,
  type ObservablePersistenceConfigLocalGlobalOptions,
  type ObservablePersistLocal,
  type PersistMetadata,
  type PersistOptionsLocal,
} from '@legendapp/state';
import { logger } from '@app/utils/logger';

const METADATA_SUFFIX = '__m';
const VALUE_ID = 'state';
const METADATA_ID = 'metadata';

type JsonRecord = {
  id: string;
  value: string;
};

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getTableParts(table: string) {
  if (table.endsWith(METADATA_SUFFIX)) {
    return {
      id: METADATA_ID,
      storeName: table.slice(0, -METADATA_SUFFIX.length),
    };
  }

  return {
    id: VALUE_ID,
    storeName: table,
  };
}

export class ObservablePersistIndexedDbJson implements ObservablePersistLocal {
  private data: Record<string, unknown> = {};
  private dbPromise: Promise<IDBDatabase | null> | undefined;
  private tableNames: string[] = [];

  initialize(
    config: ObservablePersistenceConfigLocalGlobalOptions,
  ): Promise<void> | void {
    const indexedDbConfig = config.indexedDB;
    if (typeof indexedDB === 'undefined' || !indexedDbConfig) {
      return;
    }

    this.tableNames = indexedDbConfig.tableNames;
    this.dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
      const request = indexedDB.open(
        indexedDbConfig.databaseName,
        indexedDbConfig.version,
      );

      request.onupgradeneeded = () => {
        const db = request.result;
        indexedDbConfig.tableNames.forEach(tableName => {
          if (!db.objectStoreNames.contains(tableName)) {
            db.createObjectStore(tableName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch(error => {
      logger.cache.warn(
        '[legend-state] Failed to open IndexedDB persistence',
        error,
      );
      this.dbPromise = undefined;
      return null;
    });

    return this.dbPromise.then(() => undefined);
  }

  async loadTable(table: string): Promise<void> {
    if (this.data[table] !== undefined) {
      return;
    }

    const store = await this.getStore(table, 'readonly');
    if (!store) {
      return;
    }

    const { id } = getTableParts(table);
    const record = await requestToPromise<JsonRecord | undefined>(
      store.get(id),
    );
    this.data[table] = record ? internal.safeParse(record.value) : undefined;
  }

  getTable<T = unknown>(
    table: string,
    _config: PersistOptionsLocal,
    init: object,
  ): T {
    return (this.data[table] ?? init ?? {}) as T;
  }

  getMetadata(table: string, config: PersistOptionsLocal): PersistMetadata {
    return this.getTable(`${table}${METADATA_SUFFIX}`, config, {});
  }

  set(
    table: string,
    changes: Change[],
    _config: PersistOptionsLocal,
  ): Promise<void> {
    if (!this.data[table]) {
      this.data[table] = {};
    }

    changes.forEach(({ path, valueAtPath, pathTypes }) => {
      this.data[table] = setAtPath(
        this.data[table] as object,
        path,
        pathTypes,
        valueAtPath,
      );
    });

    return this.save(table);
  }

  setMetadata(table: string, metadata: PersistMetadata): Promise<void> {
    return this.setValue(`${table}${METADATA_SUFFIX}`, metadata);
  }

  deleteTable(table: string): Promise<void> {
    delete this.data[table];
    return this.deleteValue(table);
  }

  deleteMetadata(table: string): Promise<void> {
    return this.deleteTable(`${table}${METADATA_SUFFIX}`);
  }

  private async getStore(
    table: string,
    mode: IDBTransactionMode,
  ): Promise<IDBObjectStore | null> {
    const db = await this.dbPromise;
    if (!db) {
      return null;
    }

    const { storeName } = getTableParts(table);
    if (!this.tableNames.includes(storeName)) {
      return null;
    }

    return db.transaction(storeName, mode).objectStore(storeName);
  }

  private async setValue(table: string, value: unknown): Promise<void> {
    this.data[table] = value;
    await this.save(table);
  }

  private async save(table: string): Promise<void> {
    const store = await this.getStore(table, 'readwrite');
    if (!store) {
      return;
    }

    const { id } = getTableParts(table);
    const value = this.data[table];
    if (value === undefined || value === null) {
      await requestToPromise(store.delete(id));
      return;
    }

    await requestToPromise(
      store.put({
        id,
        value: internal.safeStringify(value),
      } satisfies JsonRecord),
    );
  }

  private async deleteValue(table: string): Promise<void> {
    const store = await this.getStore(table, 'readwrite');
    if (!store) {
      return;
    }

    const { id } = getTableParts(table);
    await requestToPromise(store.delete(id));
  }
}
