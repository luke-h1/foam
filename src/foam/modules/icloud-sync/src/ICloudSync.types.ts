export interface ICloudSyncNativeModule {
  getString(key: string): Promise<string | null>;
  isAvailable(): boolean;
  remove(key: string): Promise<void>;
  setString(key: string, value: string): Promise<void>;
  synchronize(): Promise<boolean>;
}
