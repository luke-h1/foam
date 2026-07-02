# ast-grep rules

Structural lint rules that encode codebase conventions ESLint cannot easily
express. They run locally via `bun run lint:ast-grep` and in CI on every
pull request (`.github/workflows/ast-grep.yml`).

ast-grep parses `.ts` and `.tsx` as different languages, so rules that apply
to both exist in a `-ts` and a `-tsx` variant.

## Rules

| Rule                            | Why                                                                                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-partial-object-matchers-ts` | `.ts` tests assert exact shapes with `toEqual`; `toMatchObject` / `expect.objectContaining` let fields drift silently. (`.tsx` test files are excluded.) |
| `no-inline-renderitem-tsx`      | An inline `renderItem` creates a new function identity per render, defeating list row memoization. Hoist it or wrap in `useCallback`.                    |
| `no-react-native-flatlist-*`    | Lists use `LegendList` (chat) or `FlashList`; core `FlatList`/`SectionList`/`VirtualizedList` regress scroll perf.                                       |
| `prefer-create-mmkv-*`          | MMKV instances are created through `createMMKV` (see `src/lib/mmkv.ts`) so ids/modes stay centralised.                                                   |

## Adding a rule

1. Add `ast-grep/rules/<id>.yml` (one per language where relevant).
2. Add `ast-grep/rule-tests/<id>-test.yml` with `valid` / `invalid` snippets.
3. Run `bun run test:ast-grep` and `bun run lint:ast-grep`.
