/**
 * A more type safe {@link ReturnType<Object.keys>}
 * @see https://www.totaltypescript.com/workshops/typescript-generics/the-art-of-type-arguments/typed-object-keys
 */
export const typedObjectKeys = <T extends object>(object: T) => {
  return Object.keys(object) as (keyof typeof object)[];
};
