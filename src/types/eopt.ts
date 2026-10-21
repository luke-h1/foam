/**
 * Under exactOptionalPropertyTypes, `prop?: T` rejects an explicit
 * `undefined`. Use this when a value may be missing or set to undefined.
 */
export type EoptOptional<T> = T | undefined;

/**
 * Like Partial, but each key also accepts explicit undefined. Built-in
 * Partial only marks keys optional, which EOPT still rejects for
 * `undefined` assignments.
 */
export type PartialUndefined<T> = {
  [K in keyof T]?: T[K] | undefined;
};

type OmitUndefinedResult<T> = {
  [K in keyof T]?: Exclude<T[K], undefined>;
};

/**
 * Drop keys whose value is undefined so the result assigns to third-party
 * option types that use `prop?: T` under exactOptionalPropertyTypes.
 */
export function omitUndefined<T extends object>(
  obj: T,
): OmitUndefinedResult<T> {
  // SAFETY: null-prototype bag only receives defined own keys from obj.
  const out = Object.create(null) as OmitUndefinedResult<T>;

  // SAFETY: Object.keys returns string[]; every key came from obj so it is keyof T.
  const keys = Object.keys(obj) as (keyof T)[];

  for (const key of keys) {
    const value = obj[key];

    if (value !== undefined) {
      // SAFETY: the undefined branch is filtered above, so value matches Exclude.
      out[key] = value as OmitUndefinedResult<T>[typeof key];
    }
  }

  return out;
}
