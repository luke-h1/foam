import type { Variant } from '../../../app.config';

/**
 * The build variant from EXPO_PUBLIC_APP_VARIANT. A build without it is a
 * local development build.
 */
export function getAppVariant(): Variant {
  // SAFETY: app.config.ts sets EXPO_PUBLIC_APP_VARIANT from its Variant union.
  return (
    (process.env.EXPO_PUBLIC_APP_VARIANT as Variant | undefined) ??
    'development'
  );
}
