# Foam design backlog (Plan A, Phase 4)

Findings from `audit.md` grouped into shippable waves. Each wave is one PR, one simulator recording, one before/after. Ordered by user-visible impact divided by risk. Sequencing rule from the plan: no wave starts editing `src/` until the Plan B baseline is recorded, because the two agents share one working tree.

## Wave 1: Foundations (touch nothing else in the same PR)

Status 2026-09-11: shipped `DESIGN.md`, continuous corners (#24), tabular numerals (#26), not-found link colour (#17) and the orb Reduce Motion gate (#2). The alpha-literal and palette-ref replacements (#22, #23) are deferred to a follow-up PR because each site needs a per-surface visual check in the chat sheets.

| Finding | Change | Risk |
|---|---|---|
| #25 radius scale | Write the scale in `DESIGN.md`. Add the missing tokens to `src/styles/themes.ts`. Map the off-scale literals (6, 14, 18, 20, 34, 36, 48) onto the scale per component. | Low. Visual only. iPad keeps raw literals by decision. |
| #24 continuous corners | `borderCurve: 'continuous'` beside every non-pill `borderRadius` in the 13 listed files. | None. |
| #22 alpha literals | Replace `rgba(` literals with existing alpha tokens in the six worst files; add at most two tokens. | Low. Chat sheets are custom by decision; only the colour source changes. |
| #23 palette refs | `Color.zinc[n]` to `theme.color.*` in the three Preferences list screens. | Low. |
| #26 tabular numerals | `tabular` on viewer count and uptime in `LiveStreamCard`, `StreamerProfileScreen`, `CategoryScreen`. | None. |
| #17 not-found link colour | `color='accent'`. | None. |
| #2 Reduce Motion | One `useReducedMotion` gate in `Skeleton`, `EnergyOrb`, `OnboardingScreen`, `PinnedMessageBanner`, the chat slide-in gate and the chat delay pill. | Low. Reanimated `useReducedMotion` is already in the installed version. Chat gate must not touch the commit path timing. |

Recording: onboarding, Top list scroll, a chat sheet open and close, with Reduce Motion on and off.

## Wave 2: Chat

| Finding | Change | Risk |
|---|---|---|
| #11 set chips | Label the emote sheet set chips with the set name, not "CE" / "GE". | None. |
| #32 resume pill | Exercise scroll-up, new-message pill, scroll-to-bottom in the full-motion pass; fix what the recording shows. | Unknown until recorded. |
| #31 emote first paint | Device-only check for empty-then-emote flash (simulator never evicts). | Read-only unless a flash is found. |
| Dynamic Type XL | Set the font scale preference to its largest value and record a busy chat. | Read-only unless wrap breaks. |

Recording: open a top channel, scroll up during a burst, tap the resume pill, open the emote sheet, pick an emote, open the user card, dismiss mid-drag, keyboard open and close.

## Wave 3: Player and channel

| Finding | Change | Risk |
|---|---|---|
| #1 back label | `title: ''` on `live-stream/[id]` in `streams/_layout.tsx`. | None. |
| #4 offline and error panels | Offline panel (avatar, message, Follow, VODs) and error panel with Retry in `LiveStreamScreen`. | Medium. Touches the screen that hosts the player mount gate; keep the panels outside the player subtree. |
| #12 "20 loaded" | Remove. | None. |
| #13 lone segment | Section header instead of a one-item `SegmentedControl` in `CategoryScreen`. | None. |
| #33 controls, landscape, PiP | Device-only recording. | Read-only unless the recording shows a defect. |

Recording on device: open a live channel, controls fade, rotate, PiP, back with the edge swipe, open the profile from the header.

## Wave 4: Home and discovery

| Finding | Change | Risk |
|---|---|---|
| #3 search states | Skeleton rows after debounce; empty state for zero hits with the query echoed. | Low. |
| #5 Top error | `isError` branch to the retry `EmptyState`. | None. |
| #14 Top large title | `nativeStackTabRootScreenOptions` on the Top root so all four tab roots behave the same. | Low. Check the segmented control sits under the collapsing header without a jump. |
| #15 dead routes | Delete `tabs/top/streams.tsx` and `tabs/top/categories.tsx` and their `Stack.Screen` entries. | None. |
| #18 boot skeleton | Replace the six card skeletons on `/index` with the destination's skeleton or nothing. | None. |
| Search idle | Show recent searches (the `SearchHistoryV2` component already exists) above the suggested chips. | Low. |

Recording: cold open to Top, pull to refresh, switch to Categories, search with hits, search with no hits, open a result.

## Wave 5: Settings and system

| Finding | Change | Risk |
|---|---|---|
| #6 destructive confirm | Same confirm (or undo toast) on iOS and Android for Blocked Terms, Saved Phrases, Blocked Users. | Low. |
| #7 iOS empty copy | Empty-state copy under the field on iOS for the three list screens. | Low. |
| #10 provider row | Emotes & Badges provider row as filter chips. | Low. |
| #16 auth callback view | Spinner and app background. View only; auth logic untouched. | None. |
| #19 theme picker | Collapse to a labelled value; remove `/preferences/theming`. | None. |
| #20 FAQ and Licenses routes | Replace with link rows; delete the routes. | None. |
| #21 mock changelog | Delete the JS changelog screen. | None. |
| #8, #9 orb and gradients | Decide in `DESIGN.md`; tune or remove. | Low. |

Recording: Settings root to every sub-screen and back, add and delete a blocked term, feedback sheet open, type, dismiss.

## Wave 6: Android parity

Run the audit table on the Pixel 9 emulator once Plan B releases it. Known items: the Android `SettingsSection` bypasses the shared `Switch`; chat preferences exist three times; force update modal differs per platform. Add rows to `audit.md` from the emulator pass before opening the PR.
