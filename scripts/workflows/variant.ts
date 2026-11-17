export type Variant = 'production' | 'internal' | 'testflight' | 'preview';

export type VariantMeta = {
  channel: string;
  sentryDist: string;
  label: string;
  tagSuffix: string;
};

const VARIANTS = {
  production: {
    channel: 'production',
    sentryDist: 'foam-tv',
    label: 'Production',
    tagSuffix: '',
  },
  internal: {
    channel: 'internal',
    sentryDist: 'foam-tv-internal',
    label: 'Internal',
    tagSuffix: 'internal',
  },
  testflight: {
    channel: 'testflight',
    sentryDist: 'foam-tv-testflight',
    label: 'TestFlight',
    tagSuffix: 'testflight',
  },
  preview: {
    channel: 'preview',
    sentryDist: 'foam-tv',
    label: 'Preview',
    tagSuffix: 'preview',
  },
} satisfies Record<Variant, VariantMeta>;

export function isVariant(value: string): value is Variant {
  return Object.prototype.hasOwnProperty.call(VARIANTS, value);
}

export function getVariantMeta(variant: string): VariantMeta {
  if (!isVariant(variant)) {
    throw new Error(`Unsupported variant: ${variant}`);
  }

  return VARIANTS[variant];
}

export function sentryDistFor(variant: string): string {
  return getVariantMeta(variant).sentryDist;
}

export function variantLabel(variant: string): string {
  return getVariantMeta(variant).label;
}

export function appendVariant(value: string, variant: string): string {
  const suffix = getVariantMeta(variant).tagSuffix;

  return suffix === '' ? value : `${value}-${suffix}`;
}
