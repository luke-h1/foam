import type { StyleProp, ViewStyle } from 'react-native';

/**
 * JSON-safe paint payload passed from JS to the native renderer.
 */
export type NativePaintShadow = {
  color: number;
  radius: number;
  x_offset: number;
  y_offset: number;
};

export type NativePaintStop = {
  color: number;
  at: number;
};

export type NativePaintLayer = {
  function: 'LINEAR_GRADIENT' | 'RADIAL_GRADIENT' | 'URL';
  stops: NativePaintStop[];
  angle: number;
  shape: string;
  repeat: boolean;
  image_url: string;
  canvas_repeat: string;
  at: [number, number] | null;
  size: [number, number] | null;
  opacity: number;
};

export type NativePaintTextStyle = {
  weight?: number;
  transform?: 'uppercase' | 'lowercase';
  stroke?: { color: number; width: number };
  shadows: NativePaintShadow[];
};

export type NativePaintDefinition = {
  color: number | null;
  layers: NativePaintLayer[];
  dropShadows: NativePaintShadow[];
  textStyle: NativePaintTextStyle | null;
};

export type NativePaintedUsernameViewProps = {
  text: string;
  paint: NativePaintDefinition;
  fallbackColor: string;
  fontSize: number;
  lineHeight: number;
  fontWeight?: string;
  textTransform?: 'uppercase' | 'lowercase';
  style?: StyleProp<ViewStyle>;
};

export interface PaintedUsernameNativeModule {
  isAvailable: () => boolean;
}
