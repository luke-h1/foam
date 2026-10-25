import nkzw from '@nkzw/oxlint-config';
import reactDoctor from 'eslint-plugin-react-doctor';
import {
  defineConfig,
  type DummyRule,
  type OxlintConfig,
  type OxlintOverride,
} from 'oxlint';

type RulesWithJsPlugins = NonNullable<OxlintConfig['rules']> &
  Record<string, DummyRule | undefined>;

type OverrideWithJsPlugins = Omit<OxlintOverride, 'rules'> & {
  rules?: RulesWithJsPlugins;
};

type LocalOxlintConfig = Omit<OxlintConfig, 'rules' | 'overrides'> & {
  rules?: RulesWithJsPlugins;
  overrides?: OverrideWithJsPlugins[];
};

const reactDoctorPresetRules = {
  ...reactDoctor.configs.recommended.rules,
  ...reactDoctor.configs['react-native'].rules,
  ...reactDoctor.configs['tanstack-query'].rules,
} as RulesWithJsPlugins;

const local = {
  ignorePatterns: [
    '.agent/**',
    '.agents/**',
    '.agent-device/**',
    '.claude/**',
    '.codex/**',
    '.continue/**',
    '.cursor/**',
    '.gemini/**',
    '.opencode/**',
    '.pi/**',
    '.roo/**',
    '.windsurf/**',
    'tools/oxlint/anti-slop/**',
    '.rnstorybook/**',
    '__mocks__/.rnstorybook/**',
    'modules/**',
    '**/node_modules/**',
    '**/.github/**',
    '**/public/**',
    '**/build/**',
    '**/generated/**',
    '**/scripts/**',
    '**/coverage/**',
    '.jest-cache/**',
    '.cache/**',
    '.expo/**',
    'android/**',
    'build-artifacts/**',
    'dist/**',
    'ios/**',
    'player-website/.astro/**',
    'player-website/dist/**',
    'src/foam/**',
    'src/player-website/**',
    'src/graphql/generated/**',
    'src/components/chat/components/chat-message/__fixtures__/seven-tv-paints.fixture.ts',
    'commitlint.config.js',
    'modules/**/node_modules/**',
    '.storybook/storybook.requires.ts',
    'metro.config.js',
  ],
  categories: {
    correctness: 'off',
  },
  env: {
    builtin: true,
  },
  settings: {
    react: {
      version: '19.2',
    },
  },
  rules: {
    'anti-slop/no-chained-type-assertions': 'error',
    'anti-slop/no-conditional-empty-object-spread': 'error',
    'anti-slop/no-known-value-widening': 'error',
    'anti-slop/no-module-mocking': 'error',
    'anti-slop/no-object-parameters': 'error',
    'anti-slop/no-reflect-apply': 'error',
    'anti-slop/no-reflect-get': 'error',
    'anti-slop/no-runtime-typeof': 'error',
    'anti-slop/no-shape-in-symbol-names': 'error',
    'anti-slop/no-unknown-parameters': 'error',
    'anti-slop/no-unknown-returns': 'error',
    'anti-slop/no-unknown-type-aliases': 'error',
    'anti-slop/no-unsafe-dictionary-type': 'error',
    'anti-slop/no-widen-then-assert': 'error',
    'anti-slop/require-safety-comment-for-type-assertion': 'error',
  },
  overrides: [
    {
      files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
      rules: {
        'constructor-super': 'error',
        'for-direction': 'error',
        'getter-return': 'error',
        'no-async-promise-executor': 'error',
        'no-case-declarations': 'error',
        'no-class-assign': 'error',
        'no-compare-neg-zero': 'error',
        'no-cond-assign': 'error',
        'no-const-assign': 'error',
        'no-constant-binary-expression': 'error',
        'no-constant-condition': 'error',
        'no-control-regex': 'error',
        'no-debugger': 'error',
        'no-delete-var': 'error',
        'no-dupe-class-members': 'error',
        'no-dupe-else-if': 'error',
        'no-dupe-keys': 'error',
        'no-duplicate-case': 'error',
        'no-empty': 'error',
        'no-empty-character-class': 'error',
        'no-empty-pattern': 'error',
        'no-empty-static-block': 'error',
        'no-ex-assign': 'error',
        'no-extra-boolean-cast': 'error',
        'no-fallthrough': 'error',
        'no-func-assign': 'error',
        'no-global-assign': 'error',
        'no-import-assign': 'error',
        'no-invalid-regexp': 'error',
        'no-irregular-whitespace': 'error',
        'no-loss-of-precision': 'error',
        'no-misleading-character-class': 'error',
        'no-new-native-nonconstructor': 'error',
        'no-nonoctal-decimal-escape': 'error',
        'no-obj-calls': 'error',
        'no-prototype-builtins': 'error',
        'no-redeclare': 'error',
        'no-regex-spaces': 'error',
        'no-self-assign': 'error',
        'no-setter-return': 'error',
        'no-shadow-restricted-names': 'error',
        'no-sparse-arrays': 'error',
        'no-this-before-super': 'error',
        'no-unreachable': 'error',
        'no-unsafe-finally': 'error',
        'no-unsafe-negation': 'error',
        'no-unsafe-optional-chaining': 'error',
        'no-unused-labels': 'error',
        'no-unused-private-class-members': 'error',
        'no-unused-vars': 'error',
        'no-useless-backreference': 'error',
        'no-useless-catch': 'error',
        'no-useless-escape': 'error',
        'no-with': 'error',
        'require-yield': 'error',
        'use-isnan': 'error',
        'valid-typeof': 'error',
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        'constructor-super': 'off',
        'getter-return': 'off',
        'no-class-assign': 'off',
        'no-const-assign': 'off',
        'no-dupe-class-members': 'off',
        'no-dupe-keys': 'off',
        'no-func-assign': 'off',
        'no-import-assign': 'off',
        'no-new-native-nonconstructor': 'off',
        'no-obj-calls': 'off',
        'no-redeclare': 'off',
        'no-setter-return': 'off',
        'no-this-before-super': 'off',
        'no-unreachable': 'off',
        'no-unsafe-negation': 'off',
        'no-var': 'error',
        'no-with': 'off',
        'prefer-const': 'error',
        'prefer-rest-params': 'error',
        'prefer-spread': 'error',
        'no-array-constructor': 'error',
        'no-unused-expressions': 'error',
        'no-unused-vars': 'error',
        'typescript/ban-ts-comment': 'error',
        'typescript/no-duplicate-enum-values': 'error',
        'typescript/no-empty-object-type': 'error',
        'typescript/no-explicit-any': 'error',
        'typescript/no-extra-non-null-assertion': 'error',
        'typescript/no-misused-new': 'error',
        'typescript/no-namespace': 'error',
        'typescript/no-non-null-asserted-optional-chain': 'error',
        'typescript/no-require-imports': 'error',
        'typescript/no-this-alias': 'error',
        'typescript/no-unnecessary-type-constraint': 'error',
        'typescript/no-unsafe-declaration-merging': 'error',
        'typescript/no-unsafe-function-type': 'error',
        'typescript/no-wrapper-object-types': 'error',
        'typescript/prefer-as-const': 'error',
        'typescript/prefer-namespace-keyword': 'error',
        'typescript/triple-slash-reference': 'error',
      },
      plugins: ['typescript'],
    },
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      rules: {
        'react/display-name': 'off',
        'react/jsx-key': 'error',
        'react/jsx-no-comment-textnodes': 'error',
        'react/jsx-no-duplicate-props': 'error',
        'react/jsx-no-target-blank': 'error',
        'react/jsx-no-undef': 'error',
        'react/no-children-prop': 'error',
        'react/no-danger-with-children': 'error',
        'react/no-direct-mutation-state': 'off',
        'react/no-find-dom-node': 'error',
        'react/no-is-mounted': 'error',
        'react/no-render-return-value': 'error',
        'react/no-string-refs': 'error',
        'react/no-unescaped-entities': 'off',
        'react/no-unknown-property': 'error',
        'react/no-unsafe': 'off',
        'react/react-in-jsx-scope': 'off',
        'promise/always-return': 'off',
        'promise/no-return-wrap': 'error',
        'promise/param-names': 'off',
        'promise/catch-or-return': 'off',
        'promise/no-nesting': 'warn',
        'promise/no-promise-in-callback': 'warn',
        'promise/no-callback-in-promise': 'warn',
        'promise/avoid-new': 'off',
        'promise/no-new-statics': 'error',
        'promise/valid-params': 'warn',
        ...reactDoctorPresetRules,
        'react-doctor/exhaustive-deps': 'off',
        'react-doctor/no-effect-with-fresh-deps': 'off',
        'react-doctor/react-compiler-no-manual-memoization': 'off',
        // we use flashlist v2 so we don't care about this
        'react-doctor/rn-list-missing-estimated-item-size': 'off',
        'import/newline-after-import': [
          'error',
          {
            count: 1,
          },
        ],
        'simple-import-sort/imports': [
          'warn',
          {
            groups: [
              [String.raw`^\u0000`],
              ['^react$', '^react-native$', '^react', '^react-native'],
              [String.raw`^@?\w`],
              ['^@app/', '^@modules/', '^@e2e/'],
              [String.raw`^\.`],
              [String.raw`^.+\.(css|json)$`],
            ],
          },
        ],
        'simple-import-sort/exports': 'warn',
        'no-console': 'off',
        'no-extra-boolean-cast': 'off',
        'no-nested-ternary': 'error',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@sentry/react-native',
                message:
                  'Use src/lib/sentry helpers instead of importing Sentry directly.',
              },
              {
                name: '@app/lib/sentry',
                importNames: ['sentryService'],
                message:
                  'Use recordInfo, recordWarning, recordError, countMetric, startSpan, or showFeedbackWidget instead of sentryService.',
              },
              {
                name: '@react-native-firebase/analytics',
                message:
                  'Use the logAnalyticsEvent / logAnalyticsScreenView helpers in src/hooks/firebase/analytics.ts so every event stays on the analyticsEvents.ts allow-list.',
              },
              {
                name: 'expo-haptics',
                message:
                  'expo-haptics is no longer installed. Use the impact / selection helpers in src/lib/haptics.ts.',
              },
              {
                name: 'react-native-pulsar',
                message:
                  'Use the impact / selection helpers in src/lib/haptics.ts so haptics respect the hapticFeedback preference.',
              },
            ],
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
        'reanimated/js-function-in-worklet': 'error',
        'no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
            ignoreRestSiblings: true,
            varsIgnorePattern: '^_',
          },
        ],
        'react/exhaustive-deps': [
          'warn',
          {
            additionalHooks:
              '(useAnimatedStyle|useDerivedValue|useAnimatedProps)',
          },
        ],
        'react/rules-of-hooks': 'error',
        'typescript/array-type': [
          'error',
          {
            default: 'array',
          },
        ],
        'typescript/no-misused-spread': 'off',
        'typescript/no-require-imports': 'off',
      },
      plugins: ['react', 'promise', 'import', 'typescript'],
    },
    {
      files: ['**/__tests__/**/*.{ts,tsx,js,jsx}', '**/*.test.{ts,tsx,js,jsx}'],
      rules: {
        'typescript/no-require-imports': 'off',
      },
      plugins: ['typescript'],
    },
    {
      files: [
        'src/lib/sentry.ts',
        'src/lib/sentry-image-spans.ts',
        'src/lib/__tests__/sentry-image-spans.test.ts',
        'src/lib/__tests__/sentry.test.ts',
        'src/lib/__tests__/forward-log-to-sentry.test.ts',
        'src/lib/haptics.ts',
        'src/hooks/firebase/analytics.ts',
        'src/hooks/firebase/analytics.test.ts',
        '__mocks__/@react-native-firebase/analytics.ts',
        'src/components/chat/util/__tests__/create-seven-tv-callbacks.test.ts',
        'src/components/stream-player/__tests__/stream-player.test.tsx',
        'src/components/stream-player/__tests__/player-telemetry.test.ts',
        'src/components/stream-player/__tests__/use-player-bridge.stability.test.tsx',
      ],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
    {
      files: [
        'src/context/auth-context.tsx',
        'src/components/chat/components/ChatOverlayController.tsx',
        'src/components/chat/components/chat-overlay-layer.tsx',
        'src/components/ui/input/input.ios.tsx',
        'src/screens/preferences/chat-preference-screen.tsx',
        'src/screens/stream/live-stream-screen.tsx',
        'src/screens/stream/components/live-stream-chat-pane.tsx',
        'src/screens/stream/components/live-stream-video-pane.tsx',
      ],
      rules: {
        'react-doctor/no-giant-component': 'off',
        'react-doctor/no-many-boolean-props': 'off',
      },
    },
    {
      files: ['src/components/bottom-sheet/bottom-sheet.native.tsx'],
      rules: {
        'react-doctor/no-derived-useState': 'off',
        'react-doctor/no-cascading-set-state': 'off',
      },
    },
    {
      files: ['src/components/stream-player/stream-player-poster.tsx'],
      rules: {
        'react-doctor/no-derived-useState': 'off',
      },
    },
    {
      files: ['src/components/stream-player/hooks/use-player-bridge.ts'],
      rules: {
        'react-doctor/no-cascading-set-state': 'off',
      },
    },
    {
      files: ['src/services/twitch-ws-service.ts'],
      rules: {
        'react-doctor/async-await-in-loop': 'off',
        'react-doctor/js-set-map-lookups': 'off',
      },
    },
    {
      files: ['src/utils/string/format-view-count.ts'],
      rules: {
        'react-doctor/js-hoist-intl': 'off',
      },
    },
    {
      files: ['src/screens/dev-tools/synced-emotes-screen.tsx'],
      rules: {
        'react-doctor/rn-no-scrollview-mapped-list': 'off',
      },
    },
    {
      files: ['src/**/*.{ts,tsx}'],
      rules: {
        'no-console': 'error',
      },
    },
    {
      files: ['**/*.{js,jsx,ts,tsx}'],
      rules: {
        'local/blank-line-after-block': 'error',
        'local/blank-line-between-top-level': 'error',
        'local/prefer-alias-imports': 'warn',
      },
    },
    {
      files: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/utils/logger.ts',
        'src/lib/sentry.ts',
        'src/lib/bugsnag.ts',
      ],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['src/components/**/*.{ts,tsx}', 'src/screens/**/*.{ts,tsx}'],
      rules: {
        'local/no-hardcoded-hex-color': 'warn',
      },
    },
    {
      files: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/*StoryFixtures.{ts,tsx}',
        'src/components/brand-icon/**',
        'src/screens/dev-tools/**',
      ],
      rules: {
        'local/no-hardcoded-hex-color': 'off',
      },
    },
    {
      files: [
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
      rules: {
        'anti-slop/no-module-mocking': 'off',
      },
    },
    {
      files: ['src/screens/dev-tools/image-benchmark-screen.tsx'],
      rules: {
        'react-doctor/async-defer-await': 'off',
      },
    },
    {
      files: ['src/app/**/*.tsx'],
      rules: {
        'react-doctor/only-export-components': 'off',
      },
    },
    {
      files: ['__mocks__/expo-image.tsx'],
      rules: {
        'react-doctor/no-react19-deprecated-apis': 'off',
      },
    },
    {
      files: ['src/hooks/queries/use-stream-profile-pictures.ts'],
      rules: {
        'react-doctor/no-derived-state': 'off',
      },
    },
    {
      files: ['src/components/pressable-area/pressable-area.tsx'],
      rules: {
        'react-doctor/rn-pressable-shared-value-mutation': 'off',
      },
    },
  ],
} satisfies LocalOxlintConfig;

export default defineConfig({
  extends: [nkzw],
  jsPlugins: [
    ...(nkzw.jsPlugins ?? []),
    {
      name: 'anti-slop',
      specifier: './tools/oxlint/anti-slop/index.ts',
    },
    {
      name: 'local',
      specifier: './oxlint-rules/index.cjs',
    },
    'eslint-plugin-react-doctor',
    'eslint-plugin-simple-import-sort',
    'eslint-plugin-reanimated',
  ],
  ...local,
  rules: {
    ...local.rules,
    'perfectionist/sort-enums': 'off',
    'perfectionist/sort-heritage-clauses': 'off',
    'perfectionist/sort-interfaces': 'off',
    'perfectionist/sort-jsx-props': 'off',
    'perfectionist/sort-object-types': 'off',
    'perfectionist/sort-objects': 'off',
    'import-x/no-namespace': 'off',
    'unicorn/consistent-function-scoping': 'off',
    '@nkzw/no-instanceof': 'off',
    '@nkzw/ensure-relay-types': 'off',
    '@nkzw/require-use-effect-arguments': 'off',
    'react/immutability': 'off',
    'react/refs': 'off',
    'react/purity': 'off',
    'react/set-state-in-effect': 'off',
    'react/globals': 'off',
    'unicorn/prefer-string-slice': 'off',
    'unicorn/prefer-top-level-await': 'off',
    'unicorn/no-useless-spread': 'off',
    'unicorn/prefer-single-call': 'off',
    'unicorn/prefer-structured-clone': 'off',
    'unicorn/no-abusive-eslint-disable': 'off',
    'unicorn/no-hex-escape': 'off',
    'unicorn/catch-error-name': ['error', { name: 'error' }],
  },
  overrides: [
    ...(local.overrides ?? []),
    {
      files: [
        '**/*.{js,cjs}',
        'plugins/**',
        'oxlint-rules/**',
        'index.js',
        '__mocks__/**',
        'oxlint.config.ts',
      ],
      env: { node: true, jest: true },
      globals: {
        __DEV__: 'readonly',
        requestAnimationFrame: 'readonly',
      },
      rules: {
        'typescript/no-require-imports': 'off',
        'anti-slop/require-safety-comment-for-type-assertion': 'off',
      },
    },
  ],
} satisfies LocalOxlintConfig);
