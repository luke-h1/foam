import { font } from './font';
import { radii } from './radii';
import { spacing } from './spacing';
import { createPallete } from './util';

export type Theme = 'foam-light' | 'foam-dark';

export const lightTheme = {
  colors: createPallete('blue'),
  name: 'light',
  spacing,
  radii,
  font,
};

export const darkTheme = {
  colors: createPallete('blue', true),
  name: 'dark',
  spacing,
  radii,
  font,
};
