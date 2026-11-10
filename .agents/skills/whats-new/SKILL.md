---
name: whats-new
description: Write the App Store "What's New" release notes for a Foam version so they read like a Twitch viewer wrote them, not a changelog. Use when preparing a release, when the whatsNew field is empty or says "bug fixes and improvements", or when the user asks for release notes or patch notes.
---

# Foam "What's New"

Write the App Store release notes for a version. The goal is notes a viewer
wants to read: specific, warm, and alive. Someone who watches Twitch and lives
in chat wrote this, and they are telling you what is better this time.

The notes live in the `whatsNew:` field of each
`appeeky/store/app-store/<locale>.yaml`. Appeeky stores and pushes that field;
it does not write it. That is this skill's job. A `whatsNew` change needs a new
App Store version (see the push step).

## The smell to kill

These are defects. If the draft reads like any of them, rewrite it.

- "Bug fixes and performance improvements." Says nothing. Name the fix.
- The raw commit log, the current `whatsNew` smell: "Add Iphone DUO support.
  Add support for 7tv paints." Lowercase, internal, no benefit named.
- SaaS voice: "We're excited to announce", "seamless", "revolutionary",
  "level up your viewing experience", "stay tuned".
- Internal words a viewer never sees: refactor, sync layer, worklet, Legend
  State, Fabric, patch, migration, CI, typecheck, tokens.
- Hype and mannered metaphors. Alive is not the same as flowery.
- Em dashes (use a plain dash), exclamation stacks, Title Case Every Word.

## 1. Find what actually changed

Read, in this order:

1. The top section of `CHANGELOG.md` (conventional commits, already grouped by
   Features, Bug Fixes, Refactor and so on).
2. `git log --oneline <last-version-tag>..HEAD`, or the commits since the last
   release file in `appeeky/releases/`.
3. Merged PRs if the git history is thin.

Then filter hard. Keep only what a viewer notices while watching:

- A new feature they can use (7TV paints, reply threads, pinned messages,
  blocked terms, category browse, a player control).
- A fix to something that annoyed them (a chat freeze, a frozen player, dropped
  emotes, a slow list, a crash).
- A real improvement they will feel (smoother chat on busy channels, faster
  startup, steadier playback).

Drop everything internal: refactors, tooling, tests, deploy, type changes,
dependency bumps, store setup. If a whole version is internal, say one honest
human line ("Under the hood this time, so chat is quicker and steadier") rather
than inventing a feature.

## 2. The voice

- Sound like a viewer talking to viewers. Plain, concrete, calm.
- One idea per sentence. Short sentences. Active voice.
- Lead with the single change that matters most this version. Put it first.
- Name the thing. Not "improved chat" but "7TV paints now stay on while chat
  scrolls."
- Say what it does for them, not how it was built. Not "tuned the ingest
  buffer" but "Chat keeps up on the busiest channels now."
- Warmth is allowed and wanted: a light, true touch is fine when it fits. Never
  force it, never twice in one note.
- Follow the repo writing rules in AGENTS.md: plain English, no em dash, no AI
  slop, no mannered prose.

## 3. Shape

Keep it short and scannable. Most versions need three to six lines.

- A one-line headline for the main change, or a short lead sentence.
- A tiny bullet list for the rest, each line a benefit, newest first.
- Close with a human line only if it earns its place (a thank-you for a reported
  bug, a nod to what is next). Optional.

Hard limit is 4000 characters, but aim for well under 500. People skim this.

## 4. Write both storefronts

Edit `whatsNew` in every live locale, keeping the substance identical:

- `en-US`: American spelling and phrasing (favorite, color).
- `en-GB`: British spelling and phrasing (favourite, colour).

Foam is the same app in both regions, so there is little else to change. Adjust
only spelling and small idioms. Do not change which features shipped.

## 5. Example

A version that added 7TV paints that persist while scrolling, fixed a chat gap
bug and a silent player freeze. The raw changelog had ten lines, most of them
internal.

Bad:

> Add Iphone DUO support. Add support for 7tv paints.

Good (en-US):

> 7TV paints now stay on while chat scrolls, so names keep their color instead
> of flashing back to plain text.
>
> - Fixed a stream that could freeze mid-watch with no way back
> - Tidied the gap between badges and names in chat
>
> Thanks to everyone who reported the freeze.

Good (en-GB), same version:

> 7TV paints now stay on while chat scrolls, so names keep their colour instead
> of flashing back to plain text.
>
> - Fixed a stream that could freeze mid-watch with no way back
> - Tidied the gap between badges and names in chat
>
> Thanks to everyone who reported the freeze.

## 6. Check and ship

1. `cd` to the repo root. Run `npx @appeeky/spec check --json` (no errors).
2. `whatsNew`, name, subtitle and keywords only change with a new App Store
   version. Push with the next version:
   `npx @appeeky/spec push --store app-store --create-version <x.y.z> --yes --note "<the change>"`
   (match `<x.y.z>` to `VERSION` in `app.config.ts`).
3. Pushing is live. Do it only when asked. Commit the release file appeeky
   writes under `appeeky/releases/`.
