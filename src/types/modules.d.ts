declare module '@modules/core-haptics' {
  export interface HapticEventParameter {
    parameterID: 'hapticIntensity' | 'hapticSharpness';
    value: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0;
  }

  export interface HapticPatternData {
    events: Array<{
      eventType: 'hapticTransient' | 'hapticContinuous';
      time?: number;
      eventDuration?: number;
      parameters?: HapticEventParameter[];
    }>;
  }

  export interface NativeCoreHapticsModule {
    impact(sharpness: number, intensity: number): Promise<void>;
    playPattern(pattern: HapticPatternData): Promise<void>;
  }

  const module: NativeCoreHapticsModule;
  export default module;
}

declare module '@modules/icloud-sync' {
  export interface ICloudSyncNativeModule {
    getString(key: string): Promise<string | null>;
    isAvailable(): boolean;
    remove(key: string): Promise<void>;
    setString(key: string, value: string): Promise<void>;
    synchronize(): Promise<boolean>;
  }

  const module: ICloudSyncNativeModule;
  export default module;
}
