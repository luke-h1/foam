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
            content: '/* eslint-disable */\n// @ts-nocheck',
          },
        },
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: false,
        withHOC: false,
        withComponent: false,
        withResultType: false,
        withMutationFn: false,
        withMutationOptionsType: false,
        // 'string' keeps graphql + @apollo/client out of the app bundle:
        // documents are plain strings sent by the fetch-based gql client.
        documentMode: 'string',
        scalars: {
          Id: 'string',
          CustomerId: 'string',
          DateTime: 'string',
          InvoiceId: 'string',
          JSONObject: 'Record<string, unknown>',
          StripeProductId: 'string',
        },
      },
    },
  },
  hooks: {
    afterAllFileWrite: [
      'bun scripts/normalise-array-type-syntax.mjs',
      'prettier --write',
    ],
  },
};

export default config;
