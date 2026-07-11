import { useSyncExternalStore } from 'react';
// Only used for `Image.resolveAssetSource` (how RN Skia resolves font assets
// itself); nothing is rendered, so expo-image does not apply.
// eslint-disable-next-line react-doctor/rn-prefer-expo-image
import { Image } from 'react-native';

import { Skia, type SkTypefaceFontProvider } from '@shopify/react-native-skia';

import { logger } from '@app/utils/logger';

const montserratFaces = [
  require('@expo-google-fonts/montserrat/400Regular/Montserrat_400Regular.ttf'),
  require('@expo-google-fonts/montserrat/500Medium/Montserrat_500Medium.ttf'),
  require('@expo-google-fonts/montserrat/600SemiBold/Montserrat_600SemiBold.ttf'),
  require('@expo-google-fonts/montserrat/700Bold/Montserrat_700Bold.ttf'),
  require('@expo-google-fonts/montserrat/800ExtraBold/Montserrat_800ExtraBold.ttf'),
  require('@expo-google-fonts/montserrat/900Black/Montserrat_900Black.ttf'),
];

let fontProvider: SkTypefaceFontProvider | null = null;
let loadStarted = false;
const listeners = new Set<() => void>();

function loadFontProvider(): void {
  loadStarted = true;
  const provider = Skia.TypefaceFontProvider.Make();
  Promise.all(
    montserratFaces.map(async face => {
      const data = await Skia.Data.fromURI(Image.resolveAssetSource(face).uri);
      const typeface = Skia.Typeface.MakeFreeTypeFaceFromData(data);
      if (typeface) {
        provider.registerFont(typeface, 'Montserrat');
      }
    }),
  )
    .then(() => {
      fontProvider = provider;
      listeners.forEach(listener => listener());
    })
    .catch(error => {
      loadStarted = false;
      logger.chat.warn('Failed to load Montserrat faces for Skia paints:', {
        error,
      });
    });
}

/**
 * Shared Montserrat provider for the Skia paint rasterizer. RN Skia's
 * `useFonts` fetches and parses every listed face per component instance, so
 * each painted chat row (and every remount after a scroll-shed cycle) would
 * redo six typeface decodes; the faces never change, so load them once and
 * share the provider across all rows.
 */
export function useSkiaPaintFontProvider(): SkTypefaceFontProvider | null {
  const provider = useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => fontProvider,
  );
  if (!provider && !loadStarted) {
    loadFontProvider();
  }
  return provider;
}
