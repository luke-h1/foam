# Foam design audit (Plan A, Phase 3)

Date: 2026-09-11. Build: development client on iPhone 17 Pro simulator (iOS 26.1, liquid glass tab bar), Metro dev bundle. Android emulator pass is deferred until the Plan B agent releases the Pixel 9 emulator (see the bottom of this file).

Severity: P0 blocker, P1 clear defect, P2 polish. Evidence is a screenshot name under the session scratchpad `shots/` directory or a `file:line`. "Inventory" means the finding comes from the code walk in `inventory.md` and was not reproduced on screen.

Project decisions that override the skill (see `research/skills-digest.md`): dark theme only, no Material You on Android, chat sheets stay custom, toasts stay sonner, auth code is off limits, chat render literals come from `chatScale.ts`.

## Findings

| # | Screen | Law violated | Sev | Evidence | Proposed fix |
|---|---|---|---|---|---|
| 1 | Streamer profile | Navigation titles belong to the navigator; back label leaks a route name | P1 | `dl_streams_streamer-profile_caedrel.png` shows back button "live-stream/[id]". `src/app/streams/_layout.tsx:10-12` sets `headerShown: false` and no `title` on the live-stream screen. | Set `title: ''` on `live-stream/[id]` in `streams/_layout.tsx`, or `headerBackButtonDisplayMode: 'minimal'` on `streamer-profile/[id]`. |
| 2 | Onboarding | Motion: Reduce Motion respected | P2 | `grep -rn useReducedMotion src` returns nothing, but Reanimated 4 already disables layout animations and `withTiming`/`withRepeat` under the system setting (`ReduceMotion.System` default, `animation/util.js:104`), so Skeleton, chat rows, onboarding fades and the pinned banner are covered. The one gap is `EnergyOrb`, driven by `useFrameCallback`, which keeps running. | `useReducedMotion` gate on the orb's frame callback. Done in Wave 1. |
| 3 | Search | Full state cycles: no loading, no empty for zero results | P1 | Inventory: `SearchScreen.tsx` has no `isLoading` branch after the 400 ms debounce and no empty state for a query with zero hits. | Add a skeleton row set matching `StreamerCard` and an `EmptyState` "No channels match" with the query echoed. |
| 4 | Live stream | Full state cycles: no offline or error state | P1 | Inventory: `LiveStreamScreen.tsx` shows the poster plus spinner forever when the channel is offline or the stream query fails. `dl_streams_live-stream_caedrel.png` shows a black player with no message. | Add an offline panel (avatar, "channel is offline", Follow, "View VODs") and an error panel with Retry above the chat. |
| 5 | Top streams | Full state cycles: error shown as empty | P1 | Inventory: `TopStreamsScreen.tsx` never reads `isError`; a failed request renders "No Top Streams found". | Branch on `isError` to the retry `EmptyState` already used in `CategoryScreen.tsx:127-135`. |
| 6 | Blocked Terms, Saved Phrases, Blocked Users (iOS) | Destructive actions confirm | P1 | Inventory: iOS `List.ForEach onDelete` removes with no confirm while the Android path shows an `Alert`. Chat Highlights confirms on both. | Match Chat Highlights: confirm on both platforms, or make iOS swipe-delete undoable via toast with Undo. Pick one and use it on all four screens. |
| 7 | Blocked Terms, Saved Phrases, Chat Highlights (iOS) | Empty state composed, not defaulted | P1 | `dl_tabs_settings_blocked-terms.png`, `dl_tabs_settings_saved-phrases.png`: text field then black void. Inventory: iOS omits the list Section with no copy (`BlockedTermsScreen.tsx:190-204`). | Render the existing JS `EmptyState` copy inside a `Section` footer or a `ContentUnavailableView` under the field on iOS, as Android already does. |
| 8 | Onboarding | One accent, locked | P2 | `dl_onboarding.png`: the orb renders cyan while the CTA and every other accent use `#2E86FF`. `EnergyOrb/conf.ts:54-56` feeds the accent tokens in, so the shader is shifting the hue. | Tune the orb shader so the visible core stays within the accent hue, or drop the orb for the app icon mark. |
| 9 | Onboarding, Feedback, Auth sheet | Gradients without a brand reason | P2 | `dl_onboarding.png`, `dl_feedback.png`: two different glow gradients (cyan orb, green-blue arc). `LinearGradient` in `AuthSheetScreen.tsx`. | Decide whether the glow is the brand. If yes, one orb component with one colour ramp on all three. If no, remove. Record the decision in `DESIGN.md`. |
| 10 | Emotes & Badges | Native controls; one segmented style per screen | P2 | `dl_tabs_settings_emotes-and-badges.png`: two stacked `SegmentedControl` (`EmoteBadgeViewerScreen.tsx:164, 345`) of the same component but the provider row reads as a different control (four segments, smaller). | Keep the native top segment (Emotes / Badges); turn the provider row into scrolling filter chips like the emote sheet's provider strip. |
| 11 | Emote sheet | One label per intent; abbreviations in chrome | P2 | `sheet_emote.png`: set chips at the bottom read "CE" and "GE". | Use the set name ("Channel", "Global") or the provider icon plus a short name. |
| 12 | Streamer profile | Debug text in chrome | P2 | `dl_streams_streamer-profile_caedrel.png`: "20 loaded" under the segmented control (`StreamerProfileScreen.tsx:227`). | Remove. Show a count only in the empty state ("No VODs"). |
| 13 | Category detail | Native controls: a one-item segmented control | P2 | `dl_category_509658.png`: "Live Channels" rendered as a lone segment. | Replace with a section header, or add the second scene it was built for. |
| 14 | Top tab | Navigation titles: only tab root without a large title | P2 | `top_streams.png`; `tabs/top/_layout.tsx:12-16` sets `headerTransparent: false` and no large title while Following, Search and Settings use `nativeStackTabRootScreenOptions`. | Use `nativeStackTabRootScreenOptions` on Top so all four roots collapse the same way, and move the segmented control into `headerSearchBarOptions`-style header content or keep it as the first list header. |
| 15 | `/tabs/top/streams`, `/tabs/top/categories` | Dead routes | P2 | Inventory: pushed copies of the two Top scenes, unreachable from UI. | Delete the two route files and their `Stack.Screen` entries. |
| 16 | Auth callback | Loading state designed, not defaulted | P2 | `dl_auth.png`: "Completing sign in…" centred text, no spinner, no timeout, black background differs from `theme.color.background.dark`. Auth logic is off limits; this is the view only. | Add the shared `LoadingState` spinner and the app background. Leave `AuthCallbackScreen` logic alone. |
| 17 | `+not-found` | One accent | P2 | `+not-found.tsx:17` `color='blue'` while links elsewhere use `accent`. | `color='accent'`. |
| 18 | `/index` boot gate | Skeleton matches final layout | P2 | Inventory: six `LiveStreamCardSkeleton` on a screen that redirects and never shows a list (`index.tsx:26`). | Use the splash-matching blank or the `FollowingSkeleton` the destination actually shows. |
| 19 | Appearance | Native controls: picker with one option | P2 | `dl_tabs_settings_appearance.png`: "Theme" picker shows no value; "Mode: Dark" beneath. `/preferences/theming` has no controls. | Collapse to one `LabeledContent` "Theme: Foam Dark" until a second theme exists; remove the theming route. |
| 20 | FAQ, Licenses | Navigation: a route that only opens a browser | P2 | `dl_other_faq.png`: card that repeats the link after the browser auto-opens on mount. | Make FAQ a `Link` row in Settings Other that opens the browser directly; delete the route. Same for Licenses: call `launchLicenseListScreen` from the row. |
| 21 | Changelog | Fake content reachable | P2 | Inventory: `ChangelogScreen.tsx:8-42` ships a hard-coded 2023 `mockChangelog`, reachable by deep link. | Delete the JS screen; the native changelog module already exists. |
| 22 | Chat sheets, player chrome | Semantic colours where a token exists | P2 | Inventory: 152 `rgba(` literals outside `src/styles`, concentrated in `UserActionSheet` (11), `ControlsOverlay` (10), `PinnedMessageBanner` (9), `UserCardHeader` (8), `EmotePreviewSheet` (8), `BadgePreviewSheet` (8). Most are white or black at an alpha the theme already has (`colorBlackOverlay`, `colorSurfaceAlpha`, `colorBorderSecondary`). | Replace each with the existing alpha token where one matches; add at most two new alpha tokens for the rest. AGENTS.md allows a one-off literal, so only replace where a token exists. |
| 23 | Preferences list screens | Semantic colours | P2 | Inventory: ~40 direct `Color.zinc[n]` palette refs in `BlockedTermsScreen`, `SavedPhrasesScreen`, `ChatHighlightsScreen`. | Route through `theme.color.*` tokens. |
| 24 | Whole app | Shape lock: continuous corners | P2 | 21 non-dev files set `borderRadius` with no `borderCurve` (list in the Phase 3 grep: `Input`, `Badge`, `EmptyState`, `ChatComposer`, `ChatMessagePressable`, `SavedPhrasesSheet`, `ChannelPollCard`, `ChannelPredictionCard`, `SheetDragHandle`, `EmoteMenuIcon`, `OnboardingScreen`, `SearchHistoryV2`, `ChatImageShimmer`). | Add `borderCurve: 'continuous'` beside each. Pills (`999`) and the 2 to 3 px handle can skip it. |
| 25 | Whole app | Shape lock: one radius scale | P2 | Distinct literal radii: 2, 2.5, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 34, 36, 48, 999. `themes.ts:325-340` also defines 16 radius tokens (4 to 999), so the token set is not a scale either. | Write the scale in `DESIGN.md` (proposal: 4 chip, 8 input, 12 inner, 16 card, 28 sheet, 999 pill) and map the rest onto it per component. Radii stay raw literals on iPad by decision. |
| 26 | Lists with counts | Tabular numerals | P2 | `LiveStreamCard.tsx:153` viewer count and uptime use the plain `Text`; `tabular` is only set in chat timestamps and poll cards. Counts shift width as they update. | Pass `tabular` on the uptime · viewers line in `LiveStreamCard`, `StreamerProfileScreen` stat chips and `CategoryScreen` viewer count. |
| 27 | Live stream | Haptics platform-guarded, punctuation only | ok | `mentionHaptics.ts` rate-limits to one per 2.5 s; `Button` fires one selection per press; no haptics in scroll handlers. | No change. |
| 28 | Tab bar | Native tabs, one icon family | ok | `tabs/_layout.tsx` uses `NativeTabs` with `sf` and `md` pairs; 55 files use the `SymbolView` wrapper; zero vector-icons or lucide. | No change. Keep the `sfSymbolToAndroid` map as the only Android mapping. |
| 29 | Settings, Chat preferences, About, Profile | Native controls | ok | `settings.png`, `live_stream.png` (Chat preferences): `@expo/ui` Form with native Switch, Picker, large title. | No change. |
| 30 | Emote sheet | Sheet with drag and cancel mid-drag | ok | `sheet_emote.png`: SwiftUI `.sheet` with detent 0.78 and a grabber. | No change. |
| 31 | Chat row | Row layout, emotes inline, no flash of empty then emote | ok on sim | `dl_streams_live-stream_caedrel.png`, `sheet_user.png`: badges, coloured names, inline emotes at line height, clip cards, notice rows. Emote first-paint could not be judged on the simulator (memory-backed, never evicts). | Verify on a device during the chat wave. |
| 32 | Chat | New-message affordance when scrolled up | not reproduced | The chat delay pill ("16.8s") is visible; the scroll-up "resume" pill was not exercised because the simulator run had no touch scroll in this pass. | Exercise in the chat wave full-motion pass. |
| 34 | Chat | Blank one-row gaps, blank badge slots, blank emote slots | P0 | Reproduced on the simulator (`gap_found.png`, user screenshot). Native hierarchy at the instant of a gap: the LegendList item container is `hidden=YES` with a fully laid-out row inside. RN 0.86.2 `RCTViewComponentView.prepareForRecycle` resets `_layoutMetrics = {}` so a recycled view that was last `display: 'none'` keeps `hidden`. Upstream fix facebook/react-native#57590 (2026-07-23) is not in 0.86.2. | `patches/react-native@0.86.2.patch` backports #57590 (native, needs a rebuild). Also stop feeding the pool from Foam: replace `display: 'none'` in `ControlsOverlay` with a conditional render. |
| 33 | Live stream | Player controls fade timing, landscape, PiP | not reproduced | Player renders black on the simulator (WebView Twitch embed). | Exercise on a device in the player wave. |

## Anti-slop pre-flight (whole app, mechanical)

| Count | Value | Verdict |
|---|---|---|
| Distinct accent hues in chrome | 1 (`#2E86FF`) plus the cyan orb on onboarding | Fix #8 |
| Distinct corner radii | 16 literal values, 3 tokens | Fix #25, write the scale |
| Emoji in chrome | 0 (two "✓" strings in dev tools only) | ok |
| Gradients without a brand reason | 3 surfaces (onboarding orb, feedback arc, auth sheet) plus skeleton shimmer and player scrim, which have a reason | Decide #9 |
| Duplicate labels for one intent | "Get started" / "Skip" call the same handler; "CE" / "GE" | Fix #11, rename Skip or drop it |
| Grey family | one, cool (`zinc`) | ok |
| Icon families | one (SF via `SymbolView`, Material via `sfSymbolToAndroid`) | ok |
| `Dimensions.get` | 0 | ok |
| Legacy `shadow*` props | 0, 13 `boxShadow` | ok |

## Chat-specific notes

- Row density and font scale go through `chatScale.ts`, so Dynamic Type XL is a ramp change, not a per-row literal. Not re-tested here.
- The composer is an uncontrolled `TextInput` driven by a controller (`useChatComposerController`), and the keyboard is handled by `react-native-keyboard-controller`. Matches the state-architecture law.
- The emote sheet, message actions, user card, chatters and saved phrases sheets are all `@expo/ui` sheets with detents. The emote long-press sheet is the only one with no detent (content-sized), which is fine for a short menu.
- Chat delay pill and pinned message banner both use `FadeInUp`; both need the Reduce Motion gate (#2).

## Android parity pass

Partial (Pixel 9 emulator, dev client, `and_top.png`, `and_live.png`). The Top list matches iOS card for card: LIVE chip, name, two-line title, `2h 21m · 22K watching`, category. Differences seen:

- The segmented control is a Material segmented button with an accent-filled selected segment; iOS shows the grey native segment. Both are the platform control, so this is expected, but the accent fill makes the segment the loudest element on the screen. Consider the outlined Material variant.
- The layout toggle sits as a lone icon button in the header on Android and in the native header bar on iOS. Fine.
- The live stream screen on the emulator never leaves the poster spinner (WebView player does not play in the emulator) and chat shows "Chat will connect when the stream starts". That empty state is the designed one and reads well.
- The `foam://tabs/settings` deep link did not navigate on Android while the app was already on Top; iOS did. Check `+native-intent` handling for warm-start links.

Known from the inventory before the on-device pass:

- `SettingsSection.android.tsx` renders Material `ListItem`s but bypasses the shared `Switch` wrapper, so switch colours can drift from the iOS-matched palette (project rule: Android matches iOS, no Material You).
- Chat preferences are implemented three times (SwiftUI Form, JS sections, Compose rows). Any copy change must land in all three.
- Force update on Android is an RN `Modal`; on iOS a looping `Alert`. Both should become the platform alert.
- Edge-to-edge, predictive back and the API 36 target are covered by the existing `docs/android-premium-checklist.md` and were not re-audited here.
