# React Composition Audit — 2026-07-10

Five-slice audit (screens, shared primitives, chat components, player/context, preferences).
Items marked **[DONE]** are implemented and staged (not committed) as of this session.

## Implemented (staged)

### FlashList — element-type switching on prop presence [DONE]

- **Location:** src/components/FlashList/FlashList.tsx
- **Problem:** Wrapper returned three different element types depending on whether `refreshControl`/`onRefresh` were set; an `onRefresh` appearing after data load remounted the whole list (scroll position, recycled cells lost). 15 importers.
- **Change:** Single `ShopifyFlashList` render path; `onRefresh` gated inline (Android exclusion kept). `FlashListWithRefresh` deleted.

### Text — per-render allocations in the hottest primitive [DONE]

- **Location:** src/components/ui/Text/Text.tsx
- **Problem:** `getFontFamily` allocated a 9-entry font map per render; `getMargin(theme)` built a closure per render. 118 importers, every chat row.
- **Change:** Hoisted italic/upright font maps and the margin resolver to module scope.

### ControlsOverlay — 1 Hz interval re-rendered the whole overlay [DONE]

- **Location:** src/components/StreamPlayer/ControlsOverlay.tsx
- **Problem:** Stream-duration `setInterval` set state on the overlay root; every second the gradients, animated container, and 7+ buttons re-rendered for one label.
- **Change:** File-local `StreamDurationLabel` owns the interval; the tick re-renders one `Text`. Mid-file imports moved to top; `OverlayMetricsState` wrapper deleted.

### useChatRowRenderer — onUsernamePress bypassed the ref mirror [DONE]

- **Location:** src/components/Chat/hooks/useChatRowRenderer.tsx
- **Problem:** Four handlers go through refs so `renderItem` identity survives handler churn; `onUsernamePress` alone was passed directly and sat in the dep array — a latent every-visible-row re-render guarded only by convention three files away.
- **Change:** Routed through the same ref + layout-effect block; dropped from deps.

### LiveStreamScreen — duplicated chat-width clamp [DONE]

- **Location:** src/screens/Stream/LiveStreamScreen.tsx + liveStreamLayout.ts
- **Problem:** Pan gesture reimplemented the min/max clamp inline (max fractions duplicated as screen constants, 0.42 min factor in three places); drag and commit clamps could drift.
- **Change:** Shared `getLandscapeChatWidthBounds` worklet in liveStreamLayout.ts; both `clampLandscapeChatWidth` and the gesture derive from it. Drag keeps its deliberate 0 floor.

### StreamerProfileScreen — cast-based list union [DONE]

- **Location:** src/screens/Stream/StreamerProfileScreen.tsx
- **Problem:** One FlashList served both tabs with `item as TwitchClip` / `as TwitchVideo` based on `activeTab` closure state — a type-safety hole (wrong-renderer bug would typecheck).
- **Change:** `ProfileListItem` is now a discriminated union (`{kind:'clip'}|{kind:'vod'}`) built in a memo; renderItem branches on `item.kind`; `activeTab` dropped from renderItem deps; casts deleted.

### FollowingScreen — copy-pasted skeleton branches + dead interface [DONE]

- **Location:** src/screens/FollowingScreen.tsx
- **Problem:** Three near-identical skeleton blocks (two byte-identical); dead exported `Section` interface (zero importers).
- **Change:** `FollowingSkeleton({showHeader})` extracted; the two identical branches merged (order preserved); `Section` deleted.

### SavedPhrases/BlockedTerms — platform-branch business-logic duplication [DONE]

- **Location:** src/screens/Preferences/SavedPhrasesScreen.tsx, BlockedTermsScreen.tsx
- **Problem:** Save/dedupe/edit rules (and lowercase-normalise rule for terms) copy-pasted verbatim between the iOS SwiftUI branch and the Android branch; a rule change had to be made twice.
- **Change:** `useSavedPhrases().savePhrase(raw, editingId) -> 'added'|'duplicate'|'edited'|'empty'` and `useBlockedTerms().addTerm(raw)`; each branch keeps its own input clearing/editing wiring. Render trees untouched.

### ChatPreferenceDefaultContent — 37-field prop-bag pipe [DONE]

- **Location:** src/screens/Preferences/ChatPreferenceScreen.tsx + ChatPreferenceDefaultContent.tsx
- **Problem:** `ChatPreferenceScreen` spread the entire `useChatPreferenceScreenState()` return into a single-caller child whose props type was `ReturnType<typeof hook>` — plumbing, not a contract; tests already render the wrapper with the hook included.
- **Change:** Component calls the hook itself; props deleted.

### ChatProviderPreferenceSections — component-as-prop with one implementation [DONE]

- **Location:** src/screens/Preferences/ChatProviderPreferenceSections.tsx
- **Problem:** `ProviderPreviewItem` injected as a prop but only one implementation exists and no cycle forces the inversion; local re-declarations of `PreviewProvider`/`ProviderPreviewKey`/`ProviderPreviewValue` triplicated types that exist in chatPreferenceTypes.ts.
- **Change:** Direct import; shared types imported.

### useChatOverlays — duplicated mod handlers + hardcoded timeout [DONE, includes feature]

- **Location:** src/components/Chat/components/useChatOverlays.tsx
- **Problem:** Timeout/ban handler pairs duplicated between message-sheet and user-sheet paths (with optional-chaining drift in target resolution); timeout duration hardcoded to 600s.
- **Change:** `resolveModTarget()` single target rule (also used by canModerate* flags, warn, report); `banSelection()` shared ban path; **feature (user-requested):** timeout now opens a native duration menu (10s/1m/10m/30m/1h/24h) via the existing `showActionMenu` pattern, per-duration i18n keys added, `timeoutUser` label changed 'Timeout for 10m' → 'Timeout…'. New test: useChatOverlays.timeout.test.tsx (menu contents, chosen duration reaches runModCommand, cancel keeps selection, ban stays direct).

## Prioritized worklist — NOT implemented

1. **AuthContext split by change frequency (High / Medium; the big one).** One context bundles `user`, rotating `token` (new identity every 60s refresh tick + foreground), `ready`, and callbacks; ~26 consumers re-render on every token rotation, including Chat.tsx, useChatEmoteLoader, useEmoteSheet. Only twitch-chat-service (deliberate reconnect-on-rotation) and DebugScreen read the token. Split into AuthIdentity/AuthToken/AuthActions contexts under one provider, keep `useAuthContext` compat hook, migrate hot chat consumers. Deferred: AuthContext.test.tsx has uncommitted edits in the working tree; auth ordering is subtle.
2. **useChatOverlays → module-level overlay observable (High / Med-High).** The hook subscribes all of Chat to overlay state (every sheet open re-renders Chat and re-runs useChatSurface, ~50 useCallbacks); ChatOverlayLayer is a 66-prop pass-through relay. Move overlay state to `store/chat/observables/` + actions per repo Legend State layout; render `<ChatOverlayLayer channelId/>` directly; sheets self-subscribe. Kills the prop relay and most of useChatSurface's 15 dead return keys. Must preserve channel-keyed reset and replace-vs-patch semantics.
3. **Sheet scaffolding compound components (High / Medium).** ActionSheet/UserActionSheet/EmotePreviewSheet/BadgePreviewSheet share byte-identical width calc, Done button, action-row list, metadata card, and ~40-line style blocks ×4 (Emote/Badge previews are ~80% the same file). Extract `SheetShell`/`SheetActionList`/`SheetMetadataCard` under `Chat/components/sheet/` (children/slots, not config props). Also: ActionSheet's duplicate id union, splice-based insertion, close-on-select repeated 11×; hand-rolled height models vs computeSheetHeight.
4. **LiveStreamScreen god-component hook extractions (High / Medium).** `useResolvedOrientation()` (147–197), `useChatConnectionReadiness()` (386–419), `useCreateClip()` (792–841), `useLandscapeChatLayoutAnimation()` (486–686 — careful: dep arrays encode past rotation-flicker fixes). Plus: chat-panel JSX ternary sprawl (extract ChatConnectionNotice/ChatResizeHandle/LandscapeChatControls; two hardcoded English strings at ~945); reducer's catch-all `patch` action leaves cycle-action invariants enforced in three component callbacks — replace with semantic actions.
5. **SearchScreen fetch orchestration (High / Medium).** Imperative debounced search has NO stale-response guard (out-of-order resolutions can win) — extracting `useTwitchSearch()` with a request-id guard is a strict bug fix; `useSearchHistory()` extraction; SearchHeader/SearchResultsList render-callback inversion + double casts.
6. **Input/Badge variant-matrix triplication (Medium / Low-Med).** inputVariants.ios.ts already has the factored form; Input.tsx carries a 150-line copy, Badge a third; `ThemedInputProps` declared twice. Promote to platform-neutral module.
7. **Image caching state machine duplicated native/web (Medium / Medium).** Extract `useCachedImageSource` + `.web.ts`; note web leaves expo-image disk cache on (double-cache the native comment warns about) — unifying is a deliberate behavior fix, verify web build.
8. **StreamPlayer → ControlsOverlay prop group (Medium / Medium).** `onBackPress`/`onSharePress`/`onCreateClipPress`/`onSleepTimerPress`/`sleepTimerActive`/`streamInfo` pass through untouched; group into an `overlay` config object forwarded opaquely. Do NOT touch the pointerEvents layering.
9. **SettingsIndexScreen route-table drift (Medium / Medium — needs owner decision).** iOS Form vs Android branch hardcode the settings index twice; already drifted: "My Clips" is Android-only, "Update bundle" gate (`bundleButtonEnabled`, an iOS-keyed config) applies only on iOS. Confirm intent before unifying via a shared descriptor array.
10. **useChatPreferenceScreenState scaffolding (Medium / Medium).** Preview-mirror triple (observable/selector/effect) hand-written 7×; option handler pairs 7× (~250 lines). Local `usePreviewMirror` + handler factory; preserve `samePreviewValues` identity preservation.
11. **Smaller items:** ChatInputShell — extract pure `buildOptimisticChatMessage` to Chat/util (untestable in component closure today); MediaLinkCard — split TwitchClipCard/SevenTvEmoteCard (keep query keys identical); LiveStreamCard — split media/compact trees sharing `useStreamCardHandlers`; ScreenHeader — split HeroHeader, collapse identical 'medium'/'large' (3 call sites); confirmDestructive Alert util (6 copy-pasted call sites, haptic drift); PreferenceListEmptyState (3 identical copies — but leave the InputSections duplicated: three different shapes); ChatOverlayLayer inline object props + dual visible/mount gating; StreamPlayer inline `onWebViewLoaded` + usePlayerBridge fresh callback defeat StreamPlayerWebView's memo (stabilize identity only, keep bodies byte-identical); usePlayerBridge 13-property object built twice; BlockedUsersScreen ListStatePanel `onRefresh` accepted-but-discarded (wire RefreshControl or delete the prop); Text dead TextType members ('5xl'–'12xl', 'subtitle', 'body', 'caption' — zero call sites; own change, typecheck-verified); AuthContext test scaffolding in prod contract (`fetchAnonToken`, NODE_ENV branch, AuthContextTestProvider).

## Deliberately left alone (audited, fine)

- Form.tsx cloneElement/type-sniffing — vendored Expo demo code, dev-tools-only reach (5 importers all under DevTools). Quarantine-comment at most; don't rebuild.
- ChatPreferencesPreview 9-way discriminated union — honest, exhaustively `never`-guarded.
- UserActionSheet's `chatStore$.messages.peek()` scan, useChatRowRenderer extraData composition, RowVisibilityContext per-row provider — documented 60fps discipline.
- StreamPlayer mount gate / layout nudges / webViewSource deps suppression — timing-critical, hard-won.
- VodCard/ClipCard, the three preference InputSections, BlockedUsers vs preference-list screens — genuinely different shapes; merging would create variant explosion.
- SettingsSection — a genuinely good compound component; Icon, Button, BottomSheet — right-sized.
- No HOC/render-prop legacy and no cloneElement outside Form.tsx anywhere in the audited slices.
