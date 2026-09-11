# Foam design rules

The locked rules for every screen. Load this before you touch UI. Where a rule conflicts with a general design skill, this file wins. Rationale lives in `research/foam-design/`.

## Theme

- One theme: `foam-dark`. `Appearance.setColorScheme('dark')` is set at boot (PR #886). Do not add light-mode branches.
- Android matches iOS colours. No Material You, no dynamic colour. Compose controls are pinned to the iOS-matched palette.

## Accent

- One accent: `theme.colorPrimary` (`#2E86FF`, pressed `#5AA1FF`). Spend it on the primary action, the selected segment, links and progress.
- LIVE is red (`theme.colorRed`). Chat usernames keep their Twitch colours. No other hue appears in chrome.
- Status colours (amber, red, teal, violet) are for notices and badges only, never for buttons.

## Greys

- One grey family: `zinc` (cool). Surfaces come from `theme.color.background`, `backgroundSecondary`, `backgroundTertiary`, `surface`, `surfaceElevated`. Do not reference `Color.zinc[n]` from a screen; use the semantic token.
- Chat sheets use `#0A0A0B` as their background by decision.

## Radius scale

| Use                                       | Radius | Token             |
| ----------------------------------------- | ------ | ----------------- |
| Chips, tags, badges                       | 4      | `borderRadius4`   |
| Inputs, small buttons, thumbnails in rows | 8      | `borderRadius8`   |
| Inner cards, emote tiles, previews        | 12     | `borderRadius12`  |
| Cards, list groups                        | 16     | `borderRadius16`  |
| Sheets, modals                            | 28     | `borderRadius28`  |
| Pills, avatars                            | 999    | `borderRadius999` |

Every rounded rectangle also sets `borderCurve: 'continuous'`. Pills and the 2 to 3 px drag handle may skip it. Radii are not scaled on iPad. The other radius tokens (6, 10, 14, 18, 20, 32, 34, 40, 45, 80) are legacy; do not add new uses.

## Spacing

- Base unit 4. Tokens `spacing.xs` to `spacing.xl` are multiples of it. Use `gap` instead of margin stacks. ScrollView padding goes in `contentContainerStyle`.
- Chat row padding, emote size, font size and line height come from `getChatScale` and `getChatTextStyles`. Never a literal in a chat renderer.

## Type

- One family: Montserrat (400, 500, 600, 700). No serif, no second sans.
- Ramp is the `Text` component's `type` prop: `title` 32/40, `xl` 22/28, `lg` 20/28, `md` 18/28, `sm` 16/24, `body` 14/20, `caption` 12/16, `xxs` 12/16. One display size per screen.
- Navigation titles belong to the navigator. Tab roots use `nativeStackTabRootScreenOptions` (large title that collapses). Pushed screens use `nativeStackScreenOptions`.
- Counts, times and prices use `tabular` on `Text`.

## Icons

- SF Symbols through `SymbolView` on iOS and the `sfSymbolToAndroid` map for Material Symbols on Android. Tab icons pass `sf` and `md` pairs. No vector-icon packages, no emoji in chrome.

## Shadows and materials

- `boxShadow` only, never `shadow*` or `elevation`. One elevation: sheets and floating chips. Cards are flat.
- Blur and glass: `GlassView` behind `isLiquidGlassAvailable()`, `BlurView` fallback. No glass on cards or list rows.

## Motion

- Platform defaults for tabs, push, sheets and keyboard. Springs only where a finger was involved. Timed motion under 300 ms with a strong ease-out.
- Every animation reads `useReducedMotion` and collapses to a cross-fade or a static frame.
- Chat rows animate in only when the "New message animation" preference is on and the message is not historical.

## Haptics

- Through `src/lib/haptics.ts` only, gated by the haptics preference. One per user action: `selection` on segment and toggle changes, `impact('light')` on send and follow, `impact('medium')` on delete and on a mention (rate-limited to one per 2.5 s). Never in scroll handlers or render loops.

## Controls

- Native first: `@expo/ui` Form, Switch, Picker, SegmentedControl, context menus, system share sheet and image picker. Chat sheets are custom `@expo/ui` bottom sheets with detents and a grabber, never `ActionSheetIOS`. Toasts stay on sonner-native.

## States

- Every data screen ships loading (skeleton that matches the final shape), empty (headline, one line of body, one action that fills it), error (inline, specific, with Retry) and long content (`numberOfLines` on titles and names).
- Destructive actions confirm the same way on both platforms.

## Numbers and text

- Viewer counts `12.4K`, uptime `3h 12m`, dates localised. Usernames and channel names are selectable where copying is useful.
