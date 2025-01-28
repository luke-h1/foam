/* eslint-disable no-underscore-dangle */
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      '**/node_modules',
      '**/.github',
      '**/.next',
      '**/.vercel',
      '**/public',
      '**/build',
      '**/.next/',
      '**/build/',
      '**/coverage/',
      '**/node_modules/',
      '**/*.min.css',
      '**/*.min.js',
      '**/@sanity',
      '.expo',
      '.storybook/storybook.requires.ts',
      'metro.config.js',
    ],
  },
  ...fixupConfigRules(
    compat.extends(
      'airbnb',
      'plugin:@typescript-eslint/recommended',
      'plugin:import/typescript',
      'plugin:@typescript-eslint/strict',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'prettier',
      'prettier/prettier',
    ),
  ),
  {
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },

      parser: tsParser,
    },

    settings: {
      'import/resolver': {
        typescript: {
          project: ['tsconfig.json'],
        },
      },

      react: {
        version: 'detect',
      },
    },

    rules: {
      'import/no-cycle': 'off',

      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          mjs: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
        },
      ],

      'import/no-unresolved': [
        'error',
        {
          ignore: ['^(part|all):'],
        },
      ],

      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external', 'internal'],
            'parent',
            'sibling',
            'index',
          ],

          pathGroups: [
            {
              pattern: '@frontend/**',
              group: 'internal',
            },
          ],

          alphabetize: {
            order: 'asc',
          },
        },
      ],

      'react/function-component-definition': 'off',
      'import/prefer-default-export': 'off',
      'no-unsafe-finally': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_$',
        },
      ],

      'no-underscore-dangle': [
        'error',
        {
          allow: ['key', '_type', '_rev', '_id'],
        },
      ],

      'no-use-before-define': 'off',

      'react/jsx-filename-extension': [
        'error',
        {
          extensions: ['.jsx', '.tsx'],
        },
      ],

      'react/jsx-one-expression-per-line': 'off',
      '@typescript-eslint/ban-types': 'off',
      'no-case-declarations': 'error',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@next/next/no-img-element': 'off',
      'react/jsx-props-no-spreading': 'off',
      'jsx-a11y/anchor-is-valid': 'off',

      'react/jsx-wrap-multilines': [
        'error',
        {
          prop: 'ignore',
        },
      ],

      'react/prop-types': 'off',
      'import/no-extraneous-dependencies': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/require-default-props': 'off',
      'react/state-in-constructor': 'off',

      'react/no-unescaped-entities': [
        'error',
        {
          forbid: [
            {
              char: '>',
              alternatives: ['&gt;'],
            },
            {
              char: '}',
              alternatives: ['&#125;'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.js'],

    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'global-require': 'off',
      'import/no-dynamic-require': 'off',
      'no-console': 'off',
    },
  },
];
