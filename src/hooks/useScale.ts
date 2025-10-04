import { Dimensions } from 'react-native';

// Decides whether to use image native components from expo-image or react-native-image
export const IMAGE_NATIVE_PRESET: 'expo' | 'rni' = 'expo';

// ----------------------
// UI config - UI scaling
// ----------------------

// A relative screen size preset for UI scaling (phone, tablet or fullhd)
export const UI_DESIGN_PRESET: 'phone' | 'tablet' | 'fullhd' = 'phone';

// How should UI be scaled for custom device screen (via screen height or diagonal)
export const UI_SCALING_METHOD: 'height' | 'diagonal' = 'height';

/**
/**
 * Helper definitions - screen resolution
 */

export type Resolution = { width: number; height: number };

// Helper function - calculates screen diagonal size
export function diagonal(res: Resolution) {
  return Math.sqrt(res.width * res.width + res.height + res.height);
}

// Current window resolution
// - Note that we use a static window size here - but it's fine as long as we scale just by window height
const resolution = Dimensions.get('window') as Resolution;

/**
 * Helper definitions - design presets
 */

//  Full HD preset - for designing on both web & TV
// - Most of TV resolutions have similar proportions, so it should fit in well
const presetFullHD: Resolution = {
  width: 1920,
  height: 1080,
};

// Preset for designing on tablets - based on Google Pixel Tablet
const presetTablet: Resolution = {
  width: 1200,
  height: 800,
};

// Preset for designing on mobile phones - based on Google Pixel 9
// - A default preset if none explicitly selected
const presetPhone: Resolution = {
  width: 412,
  height: 924,
};

let currentPreset: Resolution;
switch (UI_DESIGN_PRESET) {
  // @ts-expect-error issues with default val
  case 'tablet':
    currentPreset = presetTablet;
    break;
  // @ts-expect-error issues with default val
  case 'fullhd':
    currentPreset = presetFullHD;
    break;
  case 'phone':
  default:
    currentPreset = presetPhone;
    break;
}

/**
 * Scale function factory
 * - Each scaler scales pixels relatively to given preset by either window height or diagonal proportions
 */
const createScaler = (
  designPreset: Resolution,
  method: 'height' | 'diagonal',
) => {
  const RESOLUTIONS_PROPORTION =
    method === 'height'
      ? resolution.height / designPreset.height
      : diagonal(resolution) / diagonal(designPreset);
  return (size: number) => RESOLUTIONS_PROPORTION * size;
};

// Create a scaling function for external usage
export const scaledPixels = createScaler(currentPreset, UI_SCALING_METHOD);
