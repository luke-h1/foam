/**
 * Structural equality for JSON-shaped values (plain objects, arrays,
 * primitives, null). Unlike stringify comparison it is insensitive to object
 * key order. A property explicitly set to `undefined` only compares equal to
 * another explicit `undefined`, not to a missing key.
 */
export function deepEqualJson(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
      return false;
    }
    return (
      a.length === b.length &&
      a.every((item, index) => deepEqualJson(item, b[index]))
    );
  }

  const aRecord = a as Record<string, unknown>;
  const bRecord = b as Record<string, unknown>;
  const aKeys = Object.keys(aRecord);
  if (aKeys.length !== Object.keys(bRecord).length) {
    return false;
  }

  return aKeys.every(
    key =>
      Object.prototype.hasOwnProperty.call(bRecord, key) &&
      deepEqualJson(aRecord[key], bRecord[key]),
  );
}
