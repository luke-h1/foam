export type HapticEventType =
  | 'hapticTransient'
  | 'hapticContinuous'
  | 'audioContinuous'
  | 'audioCustom';

export type HapticEventParameterID =
  | 'hapticIntensity'
  | 'hapticSharpness'
  | 'attackTime'
  | 'decayTime'
  | 'releaseTime'
  | 'sustained'
  | 'audioVolume'
  | 'audioPitch'
  | 'audioPan'
  | 'audioBrightness';

export type HapticDynamicParameterID =
  | 'hapticIntensityControl'
  | 'hapticSharpnessControl'
  | 'audioVolumeControl'
  | 'audioPanControl'
  | 'audioBrightnessControl'
  | 'audioPitchControl';

export interface HapticEventParameter {
  parameterID: HapticEventParameterID;
  value: 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.7 | 0.8 | 0.9 | 1.0; // 0.0 to 1.0
}

export interface HapticEvent {
  eventType: HapticEventType;
  time?: number;
  eventDuration?: number;
  parameters?: HapticEventParameter[];
}

export interface HapticParameterCurveControlPoint {
  relativeTime: number;
  value: number; // 0.0 to 1.0
}

export interface HapticParameterCurve {
  parameterID: HapticDynamicParameterID;
  controlPoints: HapticParameterCurveControlPoint[];
  relativeTime?: number;
}

export interface HapticPatternData {
  events: HapticEvent[];
  parameterCurves?: HapticParameterCurve[];
}

export interface CoreHapticsModule {
  /**
   * Play a transient haptic impacy
   * @param sharpness - The sharpness of the haptic (0.0 to 1.0)
   * @param intensity - The intensity of the haptic (0.0 to 1.0)
   */
  impact(sharpness: number, intensity: number): Promise<void>;

  /**
   * Play a complex haptic pattern
   * @param pattern - The haptic pattern to play
   */
  playPattern(pattern: HapticPatternData): Promise<void>;
}
