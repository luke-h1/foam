# Skills digest (Plan A, Phase 0)

What each loaded skill enforces, and where the project decision overrides Appllama guidance. Project skill wins on every conflict.

1. `appllama-app-design-skill` - native fidelity laws (semantic colours, native controls, one icon family, type ramp, continuous corners, boxShadow, 4/8 grid, safe areas, navigator-owned titles, haptics as punctuation), anti-slop counts, motion frequency gate, simulator full-motion loop, per-screen definition of done.
2. `appllama-usage` - research playbook. The Appllama MCP is not connected in this session (added to `.mcp.json` for the next one). Mobbin MCP is connected and is used as the reference engine instead. Same rule: pattern, not pixels.
3. `react-native-best-practices` (Software Mansion) - New Architecture, Reanimated worklets on UI thread, gesture handler, no JS-thread hops in gestures.
4. `vercel-react-native-skills` - FlashList/LegendList virtualisation, memoised list rows, transform/opacity only, native stack and native tabs, expo-image, Pressable over Touchable, native menus and modals.
5. `react-coding-style` - leaf-local updates, stable identities, minimal effects, no speculative memoisation.
6. `legend-state-best-practices` and `legend-list-best-practices` - fine-grained selectors; observables split into observables/actions/react (AGENTS.md layout).
7. `expo-ui` and `expo-native-ui` - @expo/ui SwiftUI/Compose trees for forms, sheets, menus, pickers; Host gotchas (ignoreSafeArea, no frame maxHeight).
8. `foam-chat-performance-audit` - the frontier format Plan B must output; xctrace is broken on the simulator.
9. `codebase-design` / `improve-codebase-architecture` - deep modules, seams; no thin wrappers.
10. `react-doctor` - lint gate; the unused-export rules are off project-wide on purpose.

## Conflicts resolved in favour of the project

- **Light + dark both themes.** Appllama says both. Foam locks `Appearance.setColorScheme('dark')` at boot (PR #886) and `Theme = 'foam-dark'`. Audit checks dark only. Light is out of scope unless the owner reverses #886.
- **Material dynamic colour on Android.** Appllama says Material You. Project rule: Android matches iOS colours, no Material You (Compose controls pinned to iOS-matched colours).
- **System action sheets for chat.** Chat sheets stay custom @expo/ui bottom sheets with `#0A0A0B` background, never ActionSheetIOS.
- **Toasts.** Stay on sonner-native.
- **Auth code.** `useTwitchSignIn`, `AuthContext` and token paths are off limits for this audit's fixes.
- **Chat render path literals.** Every chat font, line height, emote size and padding comes from `getChatScale` / `getChatTextStyles`. A literal there is a regression, not a simplification.
- **Inline single-use literals.** AGENTS.md prefers an inline one-off literal over a named constant, so "hard-coded hex" is only a finding where a semantic token already exists in `src/styles/themes.ts`.
- **Radii.** `borderRadius` tokens stay raw literals on iPad (not scaled); fix concentric mismatches per component.
- **Prefetch cache policy.** expo-image prefetch stays `'disk'`, never `'memory-disk'`.
- **Comments.** No added explanatory comments in source; rationale goes in the PR.
