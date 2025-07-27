/* eslint-disable no-underscore-dangle */
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
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
    files: ['src/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    ignores: [
      '**/node_modules',
      '**/.github',
      '**/public',
      '**/build',
      '**/scripts/',
      '**/build/',
      '**/coverage/',
      '**/node_modules/',
      '.expo',
      '.storybook/storybook.requires.ts',
      'metro.config.js',
    ],
    languageOptions: {
      globals: {
        ...globals.es2023,
        ...globals.jest,
        ...globals.node,
        logger: true,
        __DEV__: true,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  ...fixupConfigRules(
    compat.extends(
      'airbnb',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-type-checked',
      'plugin:import/typescript',
      'plugin:@typescript-eslint/strict',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended',
      'prettier',
      'prettier/prettier',
    ),
  ),
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescriptEslint),
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
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
      'import/no-unresolved': ['error'],
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          js: 'never',
          jsx: 'never',
          ts: 'never',
          tsx: 'never',
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
              pattern: '@app/**',
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
      '@typescript-eslint/no-floating-promises': 'warn',
      'react/jsx-one-expression-per-line': 'off',
      '@typescript-eslint/ban-types': 'off',
      'no-void': 'off',
      'no-case-declarations': 'error',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@next/next/no-img-element': 'off',
      'react/jsx-props-no-spreading': 'off',
      'jsx-a11y/anchor-is-valid': 'off',
      'comma-dangle': ['error', 'always-multiline'],
      'consistent-return': 0,
      'function-paren-newline': 0,
      'global-require': 0,
      'implicit-arrow-linebreak': 0,
      'jsx-quotes': ['error', 'prefer-double'],
      'no-console': ['off'],
      'no-extra-boolean-cast': 0,
      'no-return-assign': 0,
      'no-undef': ['warn'],
      'no-unused-expressions': 0,
      'no-fallthrough': 'error',
      'object-curly-newline': 0,
      'object-curly-spacing': ['error', 'always'],
      'operator-linebreak': 0,
      'quote-props': 0,
      'react-hooks/rules-of-hooks': 'error',
      'react/jsx-wrap-multilines': [
        'error',
        { declaration: false, assignment: false },
      ],
      'react/react-in-jsx-scope': 0,
      semi: ['error', 'always'],
      'spaced-comment': 0,
      'react/prop-types': 'off',
      'import/no-extraneous-dependencies': 'off',
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
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: [
                'Animated',
                'Button',
                'ButtonProps',
                'Image',
                'ImageProps',
                'Pressable',
                'PressableProps',
                'Text',
                'FlatList',
                'FlatListProps',
                'FlashList',
                'FlashListProps',
                'TextProps',
                'TouchableHighlight',
                'TouchableHighlightProps',
                'TouchableOpacity',
                'TouchableOpacityProps',
                'TouchableWithoutFeedback',
                'TouchableWithoutFeedbackProps',
              ],
              message:
                'Import these components from `~/components` instead. Use `react-native-reanimated` instead of `Animated` API.',
            },
            {
              name: 'React',
              importNames: ['React'],
              message: 'Import respective React API as a named import instead.',
            },
            {
              name: 'expo-image',
              importNames: ['Image', 'ImageProps'],
              message: 'Use `~/components/Image` instead.',
            },
          ],
        },
      ],
    },
  },
];
