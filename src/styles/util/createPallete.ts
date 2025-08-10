import * as colors from '@radix-ui/colors';
import compact from 'lodash/compact';
import { ColorToken } from '../colors';

type RadixColor = keyof typeof colors;

export type ColorScale =
  | 'bg'
  | 'bgAlt'
  | 'ui'
  | 'uiHover'
  | 'uiActive'
  | 'border'
  | 'borderUi'
  | 'borderHover'
  | 'accent'
  | 'accentHover'
  | 'textLow'
  | 'text';

export type ColorScaleAlpha = `${ColorScale}Alpha`;
export type ColorScaleExtras = 'contrast';

export type BlackAndWhite = ColorScaleAlpha;
export type Colors = ColorScale | ColorScaleAlpha | ColorScaleExtras;

type PaletteColor = Exclude<ColorToken, 'accent'>;

export function createPallete(color: PaletteColor, dark?: boolean) {
  const gray = getGray(color);

  const suffix = dark ? 'Dark' : '';

  return {
    accent: getColors<Colors>(`${color}${suffix}`, `${color}${suffix}A`),
    gray: getColors<Colors>(`${gray}${suffix}`, `${gray}${suffix}A`),

    black: getColors<BlackAndWhite>('blackA'),
    white: getColors<BlackAndWhite>('whiteA'),

    amber: getColors<Colors>(`amber${suffix}`, `amber${suffix}A`),
    blue: getColors<Colors>(`blue${suffix}`, `blue${suffix}A`),
    crimson: getColors<Colors>(`crimson${suffix}`, `crimson${suffix}A`),
    gold: getColors<Colors>(`gold${suffix}`, `gold${suffix}A`),
    grass: getColors<Colors>(`grass${suffix}`, `grass${suffix}A`),
    green: getColors<Colors>(`green${suffix}`, `green${suffix}A`),
    indigo: getColors<Colors>(`indigo${suffix}`, `indigo${suffix}A`),
    jade: getColors<Colors>(`jade${suffix}`, `jade${suffix}A`),
    orange: getColors<Colors>(`orange${suffix}`, `orange${suffix}A`),
    plum: getColors<Colors>(`plum${suffix}`, `plum${suffix}A`),
    red: getColors<Colors>(`red${suffix}`, `red${suffix}A`),
    ruby: getColors<Colors>(`ruby${suffix}`, `ruby${suffix}A`),
    teal: getColors<Colors>(`teal${suffix}`, `teal${suffix}A`),
    tomato: getColors<Colors>(`tomato${suffix}`, `tomato${suffix}A`),
    violet: getColors<Colors>(`violet${suffix}`, `violet${suffix}A`),
  };
}

const blackWhiteRegex = /white|black/;
const lightRegex = /amber|lime|mint|sky|yellow/;
const mauveRegex = /crimson|pink|plum|purple|red|ruby|tomato|violet/;
const slateRegex = /blue|cyan|indigo|iris|sky/;
const sageRegex = /green|jade|mint|teal/;
const oliveRegex = /grass|lime/;
const sandRegex = /amber|brown|orange|yellow/;

function getGray(color: PaletteColor) {
  if (mauveRegex.test(color)) {
    return 'mauve';
  }

  if (slateRegex.test(color)) {
    return 'slate';
  }

  if (sageRegex.test(color)) {
    return 'sage';
  }

  if (oliveRegex.test(color)) {
    return 'olive';
  }

  if (sandRegex.test(color)) {
    return 'sand';
  }

  return 'gray';
}

const map: Record<number, ColorScale> = {
  1: 'bg',
  2: 'bgAlt',
  3: 'ui',
  4: 'uiHover',
  5: 'uiActive',
  6: 'border',
  7: 'borderUi',
  8: 'borderHover',
  9: 'accent',
  10: 'accentHover',
  11: 'textLow',
  12: 'text',
};

function getColors<Palette extends Colors>(
  ...names: RadixColor[]
): Record<Palette, string> {
  const palette: [string, string][] = [];

  names.forEach(name => {
    const alpha = name.endsWith('A');

    palette.push(
      ...Object.values(colors[name]).map((color, idx) => {
        const key: Array<string | undefined> = [map[idx + 1]];

        if (alpha) {
          key.push('Alpha');
        }

        return [compact(key).join(''), color] satisfies [string, string];
      }),
    );
    if (!blackWhiteRegex.test(name)) {
      palette.push(['contrast', lightRegex.test(name) ? '#000' : '#fff']);
    }
  });

  return Object.fromEntries(palette) as Record<Palette, string>;
}
