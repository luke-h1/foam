import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import promise from 'eslint-plugin-promise';
import react from 'eslint-plugin-react';
import reactDoctor from 'eslint-plugin-react-doctor';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import reanimated from 'eslint-plugin-reanimated';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import requireMemoizedComponentExport from './eslint-rules/require-memoized-component-export.cjs';
import preferAliasImports from './eslint-rules/prefer-alias-imports.cjs';

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
          'prefer-alias-imports': preferAliasImports,
        },
      },
      promise,
      react,
      'react-doctor': reactDoctor,
      'react-hooks': reactHooks,
      'react-native': reactNative,
      reanimated,
      'simple-import-sort': simpleImportSort,
      '@typescript-eslint': tseslint.plugin,
    },
    settings: {
      react: {
        version: '19.2',
      },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      ...jsxA11y.configs.recommended.rules,
      ...promise.configs.recommended.rules,
      ...reactDoctor.configs.recommended.rules,
      ...reactDoctor.configs['react-native'].rules,
      ...reactDoctor.configs['tanstack-query'].rules,
      'react-doctor/rn-no-raw-text': 'error',
      'local/prefer-alias-imports': 'warn',
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            ['^\\u0000'],
            ['^react$', '^react-native$', '^react', '^react-native'],
            ['^@?\\w'],
            ['^@app/', '^@modules/', '^@e2e/'],
            ['^\\.'],
            ['^.+\\.(css|json)$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'warn',
      'react-doctor/react-compiler-no-manual-memoization': 'off',
      'react-doctor/no-effect-with-fresh-deps': 'off',
      'react-doctor/exhaustive-deps': 'off',
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
      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks:
            '(useAnimatedStyle|useDerivedValue|useAnimatedProps)',
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'reanimated/js-function-in-worklet': 'error',
      'react/display-name': 'off',
      'react/no-direct-mutation-state': 'off',
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
  {
    files: [
      'src/context/AuthContext.tsx',
      'src/components/Chat/components/ChatOverlayController.tsx',
      'src/components/Chat/components/ChatOverlayLayer.tsx',
      'src/components/ui/Input/Input.ios.tsx',
      'src/screens/Preferences/ChatPreferenceScreen.tsx',
      'src/screens/Stream/LiveStreamScreen.tsx',
    ],
    rules: {
      'react-doctor/no-giant-component': 'off',
      'react-doctor/no-many-boolean-props': 'off',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/**/__tests__/**',
      'src/**/*.test.{ts,tsx}',
      'src/**/*.stories.{ts,tsx}',
      'src/utils/logger.ts',
      'src/lib/sentry.ts',
      'src/lib/bugsnag.ts',
    ],
    rules: {
      'no-console': 'error',
    },
  },
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/screens/**/*.{ts,tsx}'],
    ignores: [
      'src/**/__tests__/**',
      'src/**/*.test.{ts,tsx}',
      'src/**/*.stories.{ts,tsx}',
      'src/**/*StoryFixtures.{ts,tsx}',
      'src/components/BrandIcon/**',
      'src/screens/DevTools/**',
    ],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]',
          message:
            'Avoid hardcoded hex colors in UI. Use a theme token from src/styles/themes.ts (e.g. theme.color.live, theme.color.surface, theme.colorWhite) so colors stay consistent.',
        },
      ],
    },
  },
  prettierConfig,
);
