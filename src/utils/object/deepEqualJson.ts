/**
 * A JSON-shaped value: primitives, arrays, and plain key-value objects.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

function isJsonArray<T>(value: T): value is T & JsonValue[] {
  return Array.isArray(value);
}

function isJsonObject<T>(value: T): value is T & { [key: string]: JsonValue } {
  return (
    Object(value) === value &&
    !Array.isArray(value) &&
    !(value instanceof Function)
  );
}

/**
 * Key-order-insensitive structural equality for JSON-shaped values. The
 * object overload covers named JSON-serialisable domain types, which lack the
 * implicit index signature `JsonValue` requires.
 */
export function deepEqualJson(a: JsonValue, b: JsonValue): boolean;
export function deepEqualJson<T extends object>(
  a: T | null | undefined,
  b: T | null | undefined,
): boolean;
export function deepEqualJson<T>(a: T, b: T): boolean {
  if (a === b) {
    return true;
  }

  if (isJsonArray(a) || isJsonArray(b)) {
    if (!isJsonArray(a) || !isJsonArray(b)) {
      return false;
    }
    return (
      a.length === b.length &&
      a.every((item, index) => deepEqualJson(item, b[index]))
    );
  }

  if (!isJsonObject(a) || !isJsonObject(b)) {
    return false;
  }

  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) {
    return false;
  }

  return aKeys.every(
    key =>
      Object.prototype.hasOwnProperty.call(b, key) &&
      deepEqualJson(a[key], b[key]),
  );
}
