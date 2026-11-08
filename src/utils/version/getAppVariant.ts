import type { Variant } from '../../../app.config';

export function getAppVariant(): Variant {
  // SAFETY: app.config.ts sets EXPO_PUBLIC_APP_VARIANT from its Variant union.
  return (
    (process.env.EXPO_PUBLIC_APP_VARIANT as Variant | undefined) ??
    'development'
  );
}
