import { BrandIconName, BrandIcons } from './brand-icon-registry';

export function isBrandIcon(value: string): value is BrandIconName {
  return Object.keys(BrandIcons).includes(value);
}
