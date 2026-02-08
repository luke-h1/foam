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
        documentMode: 'documentNode',
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
