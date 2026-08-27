/**
 * Codegen `gqlImport` tag: joins the literal with its fragments into a plain string, keeping `graphql` out of the bundle. Fragments are deduped - `graphQLTag` mode interpolates only direct spreads, so a shared nested fragment would be defined twice and the server would reject the operation.
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
