import { BrandIconName, BrandIcons } from '@app/components/BrandIcon/BrandIcon';

export function isBrandIcon(value: unknown): value is BrandIconName {
  return typeof value === 'string' && Object.keys(BrandIcons).includes(value);
}
