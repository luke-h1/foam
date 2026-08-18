import { BrandIconName, BrandIcons } from './brandIconRegistry';

export function isBrandIcon(value: string): value is BrandIconName {
  return Object.keys(BrandIcons).includes(value);
}
