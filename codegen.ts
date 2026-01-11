import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'https://7tv.io/v4/gql',
  documents: ['src/graphql/**/*.gql'],
  generates: {
    './src/graphql/generated/gql.tsx': {
      plugins: [
        {
          add: {
            content:
              '// eslint-disable-next-line @typescript-eslint/ban-ts-comment\n// @ts-nocheck\n/* eslint-disable */',
          },
        },
        'typescript',
        'typescript-operations',
        'typescript-urql',
      ],
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
