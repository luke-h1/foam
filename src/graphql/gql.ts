/**
 * Tagged template used by the generated documents in `generated/gql.tsx`, set
 * as codegen's `gqlImport`.
 *
 * The 7TV clients post documents as plain query strings, so this only has to
 * join the literal with its interpolated fragment documents. Using it instead
 * of `graphql-tag` keeps `graphql` out of the app bundle, and instead of
 * codegen's `documentMode: 'string'` because that mode now emits
 * `new TypedDocumentString(...)`, a class only the client preset defines.
 */
export const gql = (
  strings: TemplateStringsArray,
  ...fragments: string[]
): string =>
  strings.reduce(
    (document, literal, index) =>
      `${document}${literal}${fragments[index] ?? ''}`,
    '',
  );
