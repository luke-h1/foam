# Paint parity harness

Pixel-diffs the Skia painted-username renderer against Chrome rendering the
7TV website's own paint markup, over every paint in
`src/components/Chat/components/ChatMessage/__fixtures__/sevenTvPaints.fixture.ts`.

Both sides use the same font, font size, device scale, and box, so a difference
in the numbers is a difference in paint semantics rather than layout.

- `renderSkia.ts` runs the real `skiaPaintedUsernameRasterizer` under headless
  CanvasKit (`@shopify/react-native-skia/lib/commonjs/web`) and composites the
  layer slots the way `PaintedUsernameSkia` does, one PNG per paint.
- `renderRef.ts` builds the website's markup (`paint.svelte`: one clipped span
  per layer, `background-size: 100% 100%`, shadow filter on the first layer),
  screenshots it in headless Chrome, and crops it to the Skia bitmap boxes.
- `diff.ts` scores each pair (mean absolute error, shift-tolerant) and writes
  stacked ref-over-skia strips for the worst offenders.

## Running

```bash
bun --tsconfig-override ./scripts/paintParity/tsconfig.json scripts/paintParity/renderSkia.ts
bun --tsconfig-override ./scripts/paintParity/tsconfig.json scripts/paintParity/renderRef.ts
bun --tsconfig-override ./scripts/paintParity/tsconfig.json scripts/paintParity/diff.ts
```

Order matters: the reference cells are laid out from the Skia bitmap sizes, so
re-run `renderRef.ts` whenever the rasterizer's shadow insets change.
`PAINT_IDS=<id,id>` or `PAINT_LIMIT=<n>` narrows a run, `STRIPS=<n>` controls
how many strips `diff.ts` writes. Output lands in `scripts/paintParity/out/`
(gitignored). Requires Chrome at the standard macOS path.

The tsconfig override maps `react-native` and `@shopify/react-native-skia` to
the stubs in `shim/`, which is what lets the app's own rasterizer module run
outside the app.

## Reading the numbers

Both sides render on transparent, so the score is split in two:

- `coverage` - mean alpha difference. SkParagraph and Chrome rasterize type
  differently, so this never reaches zero. The `control` row (the same username
  with no paint) is the floor to read it against, currently ~8.6.
- `colour` - mean RGB difference over pixels both sides painted. High-frequency
  paints (tight repeating gradients, glow halos) score badly here for a
  half-pixel shift even when they are visually identical, so treat it as a
  ranking signal, not a verdict.
- `colourFlat` - colour over pixels whose 3x3 neighbourhood is flat on both
  sides, i.e. away from glyph edges. This is the real "is it the same paint"
  number: the control is 0.00 and gradients currently sit at ~0.2/255.

Paints with an animated texture are labelled `(animated)` and excluded from any
verdict - each renderer is on whatever frame it happened to reach, so a still
comparison is meaningless for them.

## Checking the app itself, not just the rasterizer

`deviceCompare.ts` closes the loop: it takes a screenshot of the running app,
crops one painted name out of it, and diffs it against the Chrome reference for
the same paint.

```bash
# Storybook's components/Chat/PaintParityPoc renders each paint through all
# three renderers with the username "Preview".
xcrun simctl launch booted foam-tv-dev && xcrun simctl openurl booted foam://storybook
agent-device screenshot /tmp/app.png

PAINT_USERNAME=Preview PAINT_IDS=<id> bun --tsconfig-override ./scripts/paintParity/tsconfig.json scripts/paintParity/renderSkia.ts
PAINT_USERNAME=Preview bun --tsconfig-override ./scripts/paintParity/tsconfig.json scripts/paintParity/renderRef.ts
bun --tsconfig-override ./scripts/paintParity/tsconfig.json scripts/paintParity/deviceCompare.ts /tmp/app.png <id> <x> <y> <w> <h>
```

Dismiss the Storybook story-list sheet before capturing - while it is presented
iOS dims everything behind it by ~25%, which reads as a colour error in every
column.
