import { type ColorValue, Platform } from 'react-native';

import { Color } from 'expo-router';

/**
 * Material You (Android 12+) dynamic-colour support, mirroring Platano's
 * approach: on Android the system palette derived from the user's wallpaper can
 * replace fixed brand colours. Enabled by default; a device below Android 12
 * resolves these to the app's Material fallback automatically.
 *
 * IMPORTANT: `Color.android.dynamic.*` returns an opaque native PlatformColor,
 * not a readable hex string. It is safe only at ColorValue sinks (navigation
 * tint, tab tint) that hand the value straight to native. It must NOT feed
 * foam's hex-based colour maths (alpha compositing, Skia paints, 7TV paint
 * blending), which need real hex/rgba values - so this is deliberately scoped
 * to interactive chrome, exactly as Platano scopes `brand.primary`.
 */
export const isAndroidDynamic = Platform.OS === 'android';

/**
 * Material You primary at a ColorValue sink, falling back to `fallback` on iOS,
 * web, or when dynamic colour is unavailable.
 */
export function androidDynamicTint(fallback: ColorValue): ColorValue {
  return isAndroidDynamic
    ? (Color.android.dynamic.primary as ColorValue)
    : fallback;
}
