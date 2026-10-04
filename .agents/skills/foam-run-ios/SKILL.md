---
name: foam-run-ios
description: >-
  Run Foam's dev build on the iOS simulator and drive it with argent: start
  metro, connect the dev client, open a screen or a single Storybook story,
  tap, swipe and screenshot. Use when you need to see a change on the
  simulator, screenshot a story, or the dev client will not load the bundle.
---

# Run Foam on the iOS simulator

Use `argent`, not `agent-device`. Every step below runs as Bash.

## Facts

- Dev bundle id: `foam-tv-dev`. URL scheme: `foam`.
- Metro: `bun run start` (development variant, dev client). Storybook is on for the development variant.
- `D` below is the simulator UDID: `xcrun simctl list devices booted`. `S` is your scratchpad directory.

## 1. Start metro

Run metro in the background with its log in your scratchpad, then wait for it:

```sh
(bun run start > $S/metro.log 2>&1 &)
until curl -s -o /dev/null --max-time 3 http://localhost:8081/status; do sleep 3; done
```

Wait on a condition, not a fixed `sleep`. A plain `sleep 25` is blocked.

## 2. Connect the dev client

```sh
argent run launch-app --udid $D --bundleId foam-tv-dev
argent run open-url --udid $D --url 'foam://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081'
```

The bundle is ready when `iOS Bundled` shows in the log. Wait for it in the background: `until grep -q 'iOS Bundled' $S/metro.log; do sleep 3; done`. A cold bundle after `--clear` takes minutes.

If the dev client shows its launcher, tap the dev server entry. If the bundle never loads, run `argent run stop-simulator-server --udid $D`, then `argent run boot-device --udid $D --force`, and connect again. Restart metro with `--clear` only after that fails.

## 3. Open a screen or a story

- A route: `argent run open-url --udid $D --url 'foam://<route>'`.
- Storybook: `foam://storybook` (route `src/app/storybook.tsx`, config `.rnstorybook/`).

To show one story, set `initialSelection`. Tapping through the sidebar and calling `view._setStory` from the debugger both proved unreliable.

1. Add `initialSelection: '<story-id>'` to the `getStorybookUI({...})` call in `.rnstorybook/index.ts`.
2. Reload: `argent run debugger-reload-metro --device_id $D`, then open `foam://storybook`.
3. Revert `.rnstorybook/index.ts` before you commit.

A story id is the story `title` lowercased with `/` turned into `-`, then `--` and the kebab-cased export name. For `title: 'components/Chat/ChatInputSection'` and `export const Empty`, the id is `components-chat-chatinputsection--empty`.

Metro rewrites `.rnstorybook/storybook.requires.ts` on start. Revert it with `git checkout` unless you added or removed a story file. If you did, run `bun run storybook:generate` and commit the result.

## 4. Drive and capture

- Read the screen: `argent run describe --udid $D`. Coordinates are fractions of the screen (0 to 1), not pixels.
- Tap: `argent run gesture-tap --udid $D --x 0.5 --y 0.9`.
- Swipe: `argent run gesture-swipe --udid $D --fromX 0.5 --fromY 0.3 --toX 0.5 --toY 0.95 --durationMs 300`.
- Screenshot: `argent run screenshot --udid $D --out $S/shot.png`, or `xcrun simctl io booted screenshot $S/shot.png`.
- Debugger tools take `--device_id`, not `--udid`: `argent run debugger-connect --device_id $D`, `argent run debugger-evaluate --device_id $D --expression '...'`.

Run `argent run <tool> --help` before the first use of any other tool.
