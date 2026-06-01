import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import promise from 'eslint-plugin-promise';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import requireMemoizedComponentExport from './eslint-rules/require-memoized-component-export.cjs';

const restrictedSentryImports = [
  {
    name: '@sentry/react-native',
    message: 'Use src/lib/sentry helpers instead of importing Sentry directly.',
  },
  {
    name: '@app/lib/sentry',
    importNames: ['sentryService'],
    message:
      'Use recordInfo, recordWarning, recordError, countMetric, startSpan, or showFeedbackWidget instead of sentryService.',
  },
];

export default tseslint.config(
  {
    ignores: [
      'commitlint.config.js',
      '.agent-device/**',
      '.agents/**',
      '.rnstorybook/**',
      '__mocks__/.rnstorybook/**',
      'modules/**',
      'modules/**/node_modules/**',
      '**/node_modules/**',
      '**/.github/**',
      '**/public/**',
      '**/build/**',
      '**/generated/**',
      '**/scripts/**',
      '**/coverage/**',
      '.expo/**',
      '.storybook/storybook.requires.ts',
      'android/**',
      'build-artifacts/**',
      'dist/**',
      'ios/**',
      'metro.config.js',
      'player-website/.astro/**',
      'player-website/dist/**',
      'src/graphql/generated/**',
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
  })),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.browser,
        ...globals.es2024,
        ...globals.jest,
        ...globals.node,
        __DEV__: 'readonly',
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      sourceType: 'module',
    },
    plugins: {
      import: importPlugin,
      'jsx-a11y': jsxA11y,
      local: {
        rules: {
          'require-memoized-component-export': requireMemoizedComponentExport,
        },
      },
      promise,
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      '@typescript-eslint': tseslint.plugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...jsxA11y.configs.recommended.rules,
      ...promise.configs.recommended.rules,
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/no-misused-spread': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
        },
      ],
      curly: ['error', 'all'],
      'local/require-memoized-component-export': 'off',
      'no-console': 'off',
      'no-extra-boolean-cast': 'off',
      'no-restricted-imports': [
        'error',
        {
          paths: restrictedSentryImports,
          patterns: [
            {
              group: ['@sentry/*'],
              message:
                'Use src/lib/sentry helpers instead of importing Sentry directly.',
            },
          ],
        },
      ],
      'no-unsafe-finally': 'off',
      'no-unused-expressions': 'off',
      'promise/always-return': 'off',
      'promise/catch-or-return': 'off',
      'promise/param-names': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
  {
    files: ['e2e/**/*.{js,ts}'],
    languageOptions: {
      globals: {
        by: 'readonly',
        device: 'readonly',
        element: 'readonly',
        waitFor: 'readonly',
      },
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,tsx,js,jsx}', '**/*.test.{ts,tsx,js,jsx}'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['src/lib/sentry.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/screens/**/*.{ts,tsx}'],
    rules: {
      'local/require-memoized-component-export': 'off',
    },
  },
  prettierConfig,
);
