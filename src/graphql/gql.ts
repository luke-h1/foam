/**
 * Tag for the generated documents, set as codegen's `gqlImport`. Joins the
 * literal with its interpolated fragments and returns a plain string - the
 * clients post documents as-is, and this keeps `graphql` out of the bundle.
 *
 * Fragments are deduped because `graphQLTag` mode interpolates only direct
 * spreads: two that share a nested fragment would otherwise define it twice
 * and the server would reject the operation.
 */
export const gql = (
  strings: TemplateStringsArray,
  ...fragments: string[]
): string => {
  const appended = new Set<string>();

  return strings.reduce((document, literal, index) => {
    const fragment = fragments[index];
    if (fragment === undefined || appended.has(fragment)) {
      return `${document}${literal}`;
    }
    appended.add(fragment);
    return `${document}${literal}${fragment}`;
  }, '');
};
