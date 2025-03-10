import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import eslintPluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      '**/node_modules',
      '**/.github',
      '**/coverage/',
      '**/node_modules/',
      '.expo',
      '.storybook/storybook.requires.ts',
    ],
    files: ['src/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
  },
  ...fixupConfigRules(
    compat.extends(
      'airbnb',
      'plugin:import/typescript',
      'prettier',
      'prettier/prettier',
    ),
  ),
  {
    languageOptions: {
      globals: {
        ...globals.es2023,
        ...globals.jest,
        ...globals.node,
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strict,
  // pluginReact.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'react-native': eslintPluginReact,
      'react-hooks': reactHooks,
    },
  },
  {
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
  },
  {
    rules: {
      'arrow-parens': 0,
      camelcase: 'error',
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
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_$',
        },
      ],
      'no-underscore-dangle': ['error'],
      'react/jsx-filename-extension': [
        'error',
        {
          extensions: ['.jsx', '.tsx'],
        },
      ],
      'no-case-declarations': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      'react/jsx-wrap-multilines': [
        'error',
        {
          prop: 'ignore',
        },
      ],
      'comma-dangle': ['error', 'always-multiline'],
      'consistent-return': 'error',
      'function-paren-newline': 0,
      'no-void': 'off',
      'no-use-before-define': 'off',
      'global-require': 0,
      'implicit-arrow-linebreak': 0,
      'import/no-cycle': 0,
      'no-extra-boolean-cast': 0,
      'no-nested-ternary': 'error',
      'no-return-assign': 0,
      'no-undef': ['warn'],
      'no-underscore-dangle': 0,
      'no-unused-expressions': 0,
      'no-fallthrough': 'error',
      'import/no-unresolved': ['error'],
      '@typescript-eslint/no-unused-vars': ['error'],
      'object-curly-newline': 0,
      'import/prefer-default-export': 'off',
      'object-curly-spacing': ['error', 'always'],
      'operator-linebreak': 0,
      'quote-props': 0,
      quotes: ['error', 'single', { avoidEscape: true }],
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react-native/no-color-literals': ['off'],
      'react-native/no-inline-styles': 0,
      'react-native/no-raw-text': 0,
      'react-native/no-unused-styles': 0,
      'react-native/split-platform-components': 0,
      'react/jsx-one-expression-per-line': 0,
      'react/jsx-uses-react': 'off',
      'react/jsx-wrap-multilines': 1,
      'react/no-unescaped-entities': 0,
      'react/prefer-stateless-function': ['off'],
      'react/prop-types': ['warn'],
      'react/react-in-jsx-scope': 0,
      'spaced-comment': 0,
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
              pattern: '@app/**',
              group: 'internal',
            },
          ],
          alphabetize: {
            order: 'asc',
          },
        },
      ],
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
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Text', 'TextProps', 'Animated', 'Image'],
              message:
                'Please import `Typography` instead of `Text` from `~/components` instead. Import `Animated` from `react-native-reanimated` instead. Import `Image` from `expo-image` instead.',
            },
          ],
        },
      ],
    },
  },
];
