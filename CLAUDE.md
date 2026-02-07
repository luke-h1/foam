# CLAUDE.md - Foam Codebase Guide

## Project Overview

**Foam** is a React Native + Expo mobile application (iOS, Android, Web) for viewing Twitch streams with rich third-party emote support (7TV, BTTV, FFZ). It features real-time chat via WebSocket, HLS video streaming, and comprehensive emote/badge rendering.

- **Package manager**: Bun (`bun install`, `bun run <script>`)
- **Runtime**: React Native 0.81+ with Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Not a monorepo** — single package, all source in `src/`

## Key Commands

```bash
# Development
bun run start                     # Start Expo dev client
bun run ios                       # Run on iOS
bun run android                   # Run on Android

# Code quality
bun run lint                      # ESLint with auto-fix
bun run prettier:fix              # Format code
bun run ts:check                  # TypeScript type-check (tsc --noEmit)

# Testing
bun run test                      # Jest unit tests
bun run test:coverage             # Jest with coverage
bun run test:perf                 # Reassure performance tests
bun run maestro:test              # E2E tests (Maestro)
bun run maestro:test:smoke        # E2E smoke suite
bun run maestro:test:critical     # E2E critical path suite

# Code generation
bun run gql:codegen               # Generate GraphQL types from .gql files

# Building
bun run build:preview             # EAS preview build
bun run build:production          # EAS production build
```

## Source Structure

```
src/
├── components/        # Reusable UI components (PascalCase folders)
├── screens/           # Screen-level components
├── navigators/        # React Navigation setup & param types
├── services/          # Domain services (twitch, seventv, bttv, ffz, storage, api)
├── hooks/             # Custom React hooks (use* prefix)
├── store/             # State management (Zustand + Legend State)
├── queries/           # React Query definitions
├── graphql/           # GraphQL .gql files + codegen output
├── context/           # React Context definitions
├── Providers/         # App-level provider composition
├── styles/            # Unistyles theme, colors, spacing, radii, fonts
├── types/             # Shared TypeScript type definitions
├── utils/             # Utility functions
├── hocs/              # Higher-order components
├── plugins/           # Plugin configuration
├── config/            # App configuration
├── constants/         # Constants
├── test/              # Test utilities & setup
└── App.tsx            # Root component
```

## Architecture & Patterns

### Component Structure

Components live in PascalCase folders matching their name:
```
components/Button/
├── Button.tsx
├── Button.stories.tsx       # Optional Storybook story
└── Button.test.tsx          # Or in __tests__/Button.test.tsx
```

- **Named exports only** — no default exports
- Props typed with `interface` or `type` using `{ComponentName}Props` suffix
- Props extend base RN/library types when wrapping (e.g., `interface ImageProps extends ExpoImageProps`)
- Use `forwardRef` with `displayName` when refs are needed
- Use `function` declarations or `const` with named function expressions

```typescript
// Preferred patterns:
export function Button({ label, disabled, ...rest }: ButtonProps) { ... }
export const Text = forwardRef<RNText, TextProps>(({ ... }, ref) => { ... });
Text.displayName = 'Text';
```

### Restricted Imports

ESLint enforces these — **do not import directly from react-native or expo-image**:

| Banned Import | Use Instead |
|---|---|
| `Text` from `react-native` | `@app/components/Text` |
| `Image` from `react-native` or `expo-image` | `@app/components/Image` |
| `FlatList` from `react-native` | `@shopify/flash-list` FlashList |
| `Button`, `Pressable` from `react-native` | Custom `Button` / `PressableArea` |
| `TouchableOpacity` from `react-native` | Avoid entirely (use `PressableArea` / `PressableScale`) |
| `Animated` from `react-native` | `react-native-reanimated` |
| `Switch` from `react-native` | `@app/components/Switch` |

### Styling

Uses **React Native Unistyles** (not StyleSheet from RN directly, not Tailwind):

```typescript
import { StyleSheet } from 'react-native-unistyles';

// Static styles
const styles = StyleSheet.create({
  container: { flex: 1 },
});

// Dynamic styles with theme + runtime values (insets, dimensions)
const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.blue.accent,
    paddingTop: rt.insets.top,
  },
}));
```

- Access theme via `useUnistyles()` hook when needed in component logic
- Theme has `dark` and `light` variants with adaptive switching
- Colors come from `createPallete()` based on Radix UI color scales
- Spacing, radii, and font are defined as constants in `src/styles/`
- **No inline styles** — enforced by ESLint (`react-native/no-inline-styles`)

### ESLint Plugin: `eslint-plugin-refined`

Custom rules enforced for React Native quality:
- `border-radius-with-curve` — use proper border radius
- `prefer-hairline-width` — use hairline width for borders
- `prefer-box-shadow` — use boxShadow over shadow* properties
- `require-hitslop-small-touchables` — touchables need adequate hit area
- `spring-config-consistency` — Reanimated v4 spring configs
- `avoid-touchable-opacity` — banned, use Pressable-based components

### Data Fetching

**Three data-fetching systems in use:**

1. **React Query** (TanStack Query) — REST APIs (Twitch)
   - Query definitions in `src/queries/` as object factories returning `UseQueryOptions`
   - QueryKey includes parameters for cache granularity
   - Persisted with MMKV via `@tanstack/query-persist-client-core`

2. **Apollo Client** — GraphQL (7TV v4 API)
   - Client defined in `src/services/gql/client.ts`
   - `.gql` files in `src/graphql/seventv/`
   - Types generated via `bun run gql:codegen` into `src/graphql/generated/gql.tsx`
   - Codegen config in `codegen.ts` — generates TypeScript types + operations (no hooks)

3. **Axios** — HTTP client for REST services
   - Custom `Client` class in `src/services/api/Client.ts` with interceptors
   - Supports request/response interceptors, generic typed responses
   - Instances exported from `src/services/api/index.ts`

### Services

Object singleton pattern with `as const` for stateless services:
```typescript
export const twitchBadgeService = {
  listSanitisedChannelBadges: async (channelId: string): Promise<SanitisedBadgeSet[]> => { ... },
  listSanitisedGlobalBadges: async (): Promise<SanitisedBadgeSet[]> => { ... },
} as const;
```

Class-based pattern for stateful clients (e.g., `Client` in `services/api/`).

Test fixtures live in `services/__fixtures__/` organized by domain.

### State Management

- **Legend State** (`@legendapp/state`) — complex real-time state (chat store)
  - Observable pattern with `.peek()` for sync reads
  - Batch updates for performance
  - Persisted subsets via `persistObservable()`
  - Selector hooks: `useSelector(chatStore$.messages)`

- **Zustand** — simpler preference state
  - `create()` with `persist` middleware
  - MMKV storage adapter in `src/store/util/zustardStorage.ts`
  - Actions inline with state definition

### Custom Hooks

- Prefixed with `use` (e.g., `useDebouncedCallback`, `useAppNavigation`)
- Generic type parameters for reusability
- Return types explicitly typed and exported
- Located in `src/hooks/` (flat) or `src/hooks/ws/` for WebSocket-related

### Navigation

- **React Navigation** with Native Stack
- Type-safe param lists in `src/navigators/`
- `AppStackParamList` as the root type
- Helper type: `AppStackScreenProps<T>`
- `useAppNavigation<T>()` generic hook for typed navigation

### Environment & Configuration

- Environment variables inlined at build time via `transform-inline-environment-variables` babel plugin
- `APP_VARIANT` controls app variant: `development`, `preview`, `test`, `e2e`, `production`
- Firebase Remote Config for feature flags
- App config in `app.config.ts` with variant-based switching

## Path Aliases

```
@app/* → ./src/*
@e2e/* → ./e2e/*
```

Configured in `tsconfig.json` and `babel.config.js` (module-resolver).

## TypeScript Configuration

- Extends `expo/tsconfig.base`
- **Strict mode**: `strictNullChecks`, `noImplicitAny`, `noImplicitReturns`, `noUncheckedIndexedAccess`
- `noUnusedParameters` and `noUnusedLocals` enabled
- JSX: `react-jsx` (automatic runtime — do not import React for JSX)

## Formatting (Prettier)

```json
{
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all"
}
```

## Import Ordering

ESLint enforces grouped, alphabetized imports:
1. Built-in / external / internal (`react`, third-party libs, `@app/*`)
2. Parent imports (`../`)
3. Sibling imports (`./`)
4. Index imports

```typescript
// 1. React + external
import { forwardRef, ReactNode } from 'react';
import { View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

// 2. Internal (@app alias)
import { ThemeColor } from '@app/styles';
import { getMargin } from '@app/styles/spacing';

// 3. Relative
import { helperFn } from './utils';
```

## Testing

- **Jest** with `jest-expo` preset and jsdom environment
- **React Native Testing Library** for component tests
- Tests in `__tests__/` directories adjacent to source, or co-located as `*.test.ts(x)`
- Mock factories for complex test data (e.g., `createMockMessage()`)
- `describe/it` blocks with `"should ..."` naming pattern
- `beforeEach` with `jest.clearAllMocks()`, `afterAll` for cleanup
- Use `getByTestId` for element selection
- Coverage threshold: 60% lines minimum
- E2E via Maestro in `.maestro/` and `e2e/` directories

## Commit Conventions

**Conventional Commits** enforced via commitlint + lefthook:

```
type(scope): subject
```

**Types**: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`, `release`

**Scopes**: `app`, `ci`, `test`, `docs`, `infrastructure`, `chat`, `twitch`, `seventv`, `bttv`, `ffz`, `stream`, `auth`, `tooling`, `documentation`, `security`, `sentry`, `monitoring`, `perf`, `firebase`, `remote-config`, `release`, `storybook`

Subject limit: 100 characters. Custom scopes allowed.

## Pre-commit Hooks (Lefthook)

Runs in parallel on staged files:
- ESLint with `--fix` on `*.{ts,tsx,js,jsx}`
- Prettier on `*.{js,jsx,ts,tsx,css,scss,html}`
- SVGO optimization on `assets/icons/**/*.svg`
- Expo image optimization on `*.{png,jpg,jpeg,gif}`

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- **jest.yml** — unit tests on PR
- **lint.yml** — ESLint on PR
- **prettier.yml** — formatting check on PR
- **typescript.yml** — type-check on PR
- **e2e.yml** — Maestro E2E with iOS builds, fingerprint caching
- **deploy-ota-or-native.yml** — OTA or native deploy (manual dispatch)
- **preview-build.yml** — preview builds
- **codeql.yml** — security scanning

Builds via **EAS Build** with profiles: `development`, `preview`, `test`, `e2e`, `production`.

## Domain Context

- **Twitch API** — streams, users, chat, authentication (OAuth)
- **7TV API** — emotes, badges, paints, cosmetics (GraphQL v4)
- **BTTV** — emotes, badges (REST)
- **FFZ** — emotes (REST)
- **Chatterino** — badge service integration

Services follow a domain-based naming pattern: `{domain}-{concern}-service.ts` (e.g., `twitch-badge-service.ts`, `bttv-emote-service.ts`).

## Things to Know

- Run `bun run gql:codegen` after modifying any `.gql` file in `src/graphql/`
- The generated file `src/graphql/generated/gql.tsx` is auto-generated — never edit manually
- MMKV is the primary storage engine (high-performance, synchronous)
- Sentry + NewRelic are integrated for error tracking and performance monitoring
- The app supports OTA updates via Expo Updates
- Storybook is available via `bun run storybook` for component development
- Performance testing uses Reassure (`bun run test:perf`)
