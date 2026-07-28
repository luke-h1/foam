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
        // Tagging with our own `gql` keeps graphql + @apollo/client out of the
        // app bundle and yields the plain strings the fetch-based gql client
        // posts. `documentMode: 'string'` would read as the obvious choice but
        // emits `new TypedDocumentString(...)`, a class only the client preset
        // defines, so the generated file throws on import.
        documentMode: 'graphQLTag',
        gqlImport: '@app/graphql/gql#gql',
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
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
