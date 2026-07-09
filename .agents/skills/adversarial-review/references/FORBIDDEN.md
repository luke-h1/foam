# Forbidden patterns (adversarial contract review)

Reviewers must **reject** changes that introduce these patterns. If a paragraph-long comment is needed to justify a workaround, the code is wrong — fix the code.

## Tests

| Pattern | Required instead |
| --- | --- |
| `expect.objectContaining` | `toEqual` on the full expected object (or a smaller extracted object) |
| `toMatchObject` | `toEqual` |
| `it('...')` | `test('...')` |
| Fixtures in generic shared folders | `__tests__/__fixtures__/{thing}.fixture.ts` beside the tests |
| New `$TSFixMe` or `// ts-expect-error` | Fix the type; tsfixme count must not increase |

## Implementation shortcuts

| Pattern | Why reject |
| --- | --- |
| Stubbed function bodies to silence compiler/test errors | Hides real bugs; fix root cause |
| `@ts-ignore` | Same as above |
| Empty catch blocks swallowing errors | Masks failures |
| Comment paragraphs explaining why unsafe code is "fine" | Smell; redesign or fix |

## React Native / UI

Contract review covers repo-documented patterns. **react-doctor** (run separately in adversarial-review) owns the full RN/React rule set — performance, a11y, compiler, list patterns, etc. Do not duplicate react-doctor findings in the contract reviewer; contract review catches AGENTS.md and FORBIDDEN.md items react-doctor does not encode.

| Pattern | Required instead |
| --- | --- |
| `TouchableOpacity`, `TouchableHighlight` | `Pressable` |
| `{value && <Component />}` when value may be `""` or `0` | Ternary or `!!value` |
| Strings as direct children of `View` | Wrap in `Text` |

## Legend State

| Pattern | Why reject |
| --- | --- |
| `useCallback` wrapping store `.set()` / `.peek()` mutations | Unless a React API (ref, effect deps) needs a stable reference |
| Module-level `Map` caches for session chat data | Belongs on `chatStore$` |
| Barrel imports under `store/chat` | Import module paths directly |

## Git / parallel loops

When multiple agent loops share a repo, reject commits that use:

- `git stash`, `git reset`, `git clean`
- Whole-tree `git checkout .` / `git restore .`

Prefer `git add <specific-files>` and one commit per logical slice.
