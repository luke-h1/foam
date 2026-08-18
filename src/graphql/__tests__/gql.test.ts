import {
  BadgeQueryDocument,
  ImageFragmentFragmentDoc,
  UserByConnectionDocument,
} from '@app/graphql/generated/gql';
import { gql } from '@app/graphql/gql';

const occurrences = (document: string, fragment: string) =>
  document.split(fragment).length - 1;

// Prettier reformats the GraphQL inside a `gql` tag, so these assert on the
// interpolated fragments, which it leaves alone, rather than exact output.
describe('gql', () => {
  const fragmentA = 'fragment A on T { a }';
  const fragmentB = 'fragment B on T { b }';

  test('appends interpolated fragments in order', () => {
    const document = gql`
      query Q {
        a
      }
      ${fragmentA}
      ${fragmentB}
    `;

    expect([
      occurrences(document, fragmentA),
      occurrences(document, fragmentB),
      document.indexOf(fragmentA) < document.indexOf(fragmentB),
    ]).toEqual([1, 1, true]);
  });

  test('leaves a document with no fragments alone', () => {
    const document = gql`
      query Q {
        a
      }
    `;

    expect([
      document.includes('query Q'),
      document.includes('fragment'),
    ]).toEqual([true, false]);
  });

  /**
   * `graphQLTag` mode interpolates only direct spreads, so two fragments that
   * share a nested one arrive already carrying it. Repeating the definition
   * makes the whole operation invalid.
   */
  test('appends a repeated fragment only once', () => {
    const shared = 'fragment ImageFragment on Image { url }';

    const document = gql`
      query Q {
        a
      }
      ${shared}
      ${shared}
    `;

    expect(occurrences(document, shared)).toEqual(1);
  });
});

/**
 * The clients post documents straight into a JSON body, so codegen has to keep
 * emitting plain strings. These fail if it drifts back to `documentMode`
 * `'string'`, which emits a `TypedDocumentString` class nothing here defines.
 */
describe('generated documents', () => {
  test('are plain strings', () => {
    expect(UserByConnectionDocument.constructor).toBe(String);
  });

  test('carry the operation they were generated from', () => {
    expect(UserByConnectionDocument).toContain(
      'query UserByConnection($platformId: String!)',
    );
  });

  test('inline the fragments they spread', () => {
    expect(BadgeQueryDocument).toContain(String(ImageFragmentFragmentDoc));
  });
});
