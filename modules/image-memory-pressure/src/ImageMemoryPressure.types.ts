import type { EventSubscription } from 'expo-modules-core';

export type ImageMemoryPressureEvent = {
  level: number;
};

export interface ImageMemoryPressureNativeModule {
  getAvailableMemory(): number;

  addListener?(
    eventName: 'onMemoryPressure',
    listener: (event: ImageMemoryPressureEvent) => void,
  ): EventSubscription;
}
