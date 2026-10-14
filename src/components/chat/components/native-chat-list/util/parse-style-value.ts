import type { TextStyle, ViewStyle } from 'react-native';

import { z } from 'zod';

type StyleValue = TextStyle[keyof TextStyle] | ViewStyle[keyof ViewStyle];

/**
 * Most style keys a row reads are missing. Keep the schemas optional so a
 * missing key parses: a failed `safeParse` builds an error object, and with
 * about 30 calls per row that made a native row build about 20 times slower.
 */
const styleNumberSchema = z.number().optional();
const styleStringSchema = z.string().optional();

/**
 * A flattened style value as points. A percentage, an animated value or a
 * missing key gives undefined.
 */
export function parseStyleNumber(value: StyleValue): number | undefined {
  const parsed = styleNumberSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

/**
 * A flattened style colour as a string. A platform colour object or a missing
 * key gives undefined.
 */
export function parseStyleString(value: StyleValue): string | undefined {
  const parsed = styleStringSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}
