/**
 * A more strongly typed {@link ReturnType<Object.entries>}
 * @see https://github.com/trpfrog/trpfrog.net/blob/4b71ca962e9e87f5c044177780e83a0e22fa8303/packages/utils/src/object.ts#L24
 * @see https://stackoverflow.com/a/60142095
 */

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

export function typedObjectEntries<T extends object>(obj: T): Entries<T> {
  return Object.entries(obj) as Entries<T>;
}
