/* eslint-disable @typescript-eslint/no-explicit-any */
type Primitive = string | number | boolean | bigint | symbol | undefined | null;
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type Builtin = Primitive | Function | Date | Error | RegExp;

type IsTuple<Type> = Type extends readonly any[]
  ? any[] extends Type
    ? never
    : Type
  : never;

export type DeepRequired<Type> = Type extends Error
  ? Required<Type>
  : Type extends Builtin
    ? Type
    : Type extends Map<infer Keys, infer Values>
      ? Map<DeepRequired<Keys>, DeepRequired<Values>>
      : Type extends ReadonlyMap<infer Keys, infer Values>
        ? ReadonlyMap<DeepRequired<Keys>, DeepRequired<Values>>
        : Type extends WeakMap<infer Keys, infer Values>
          ? WeakMap<DeepRequired<Keys>, DeepRequired<Values>>
          : Type extends Set<infer Values>
            ? Set<DeepRequired<Values>>
            : Type extends ReadonlySet<infer Values>
              ? ReadonlySet<DeepRequired<Values>>
              : Type extends WeakSet<infer Values>
                ? WeakSet<DeepRequired<Values>>
                : Type extends Promise<infer Value>
                  ? Promise<DeepRequired<Value>>
                  : Type extends ReadonlyArray<infer Values>
                    ? Type extends IsTuple<Type>
                      ? { [Key in keyof Type]-?: DeepRequired<Type[Key]> }
                      : Type extends Array<Values>
                        ? Array<Exclude<DeepRequired<Values>, undefined>>
                        : ReadonlyArray<
                            Exclude<DeepRequired<Values>, undefined>
                          >
                    : Type extends object
                      ? { [Key in keyof Type]-?: DeepRequired<Type[Key]> }
                      : Required<Type>;

/**
 * Remove any specified keys from T, that exist on T.
 * It ensures that the keys to be omitted (K) are strictly keys of T. This means that K must be a subset of the keys of T, providing stricter type checking than the normal Omit
 */
export type OmitStrict<T, K extends keyof T> = T extends any
  ? Pick<T, Exclude<keyof T, K>>
  : never;

/**
 * Make all properties of a given type in T optional, recursively
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;
