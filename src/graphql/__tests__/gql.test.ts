import {
  BadgeQueryDocument,
  ImageFragmentFragmentDoc,
  UserByConnectionDocument,
} from '@app/graphql/generated/gql';
import { gql } from '@app/graphql/gql';

describe('gql', () => {
  test('joins a document with its interpolated fragments', () => {
    const fragment = gql`
      fragment ImageFragment on Image {
        url
      }
    `;

    expect(gql`
      query BadgeQuery {
        images {
          ...ImageFragment
        }
      }
      ${fragment}
    `).toContain('fragment ImageFragment on Image');
  });
});

/**
 * The clients post documents straight into a JSON body, so codegen has to keep
 * emitting plain strings. `documentMode: 'string'` emits
 * `new TypedDocumentString(...)` instead, a class nothing in this project
 * defines - these fail loudly if the config drifts back to it.
 */
describe('generated documents', () => {
  test('are plain strings', () => {
    expect(typeof UserByConnectionDocument).toEqual('string');
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
