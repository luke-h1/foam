# Category design language: live streaming and live chat (iOS)

Synthesised from the reference screens in `apps.md` (Mobbin). Pattern, not pixels. Where Foam already matches, that is noted so the audit does not invent work.

## Layout skeletons

**Home / followed / top.** One vertical list of full-width cards, or a two-column grid for shopping-style live apps. A card is: thumbnail (16:9) with a LIVE chip top-left and a viewer count chip bottom-left, then avatar, channel name, title (2 lines max), category, and a small language or tag chip. Filter chips or a segmented control sit directly under the header. Foam's `LiveStreamCard` matches this skeleton; the thumbnail is narrower (list style) with the meta to the right, which is the Twitch "compact list" variant.

**Live now rail.** A horizontal rail of portrait or 16:9 cards with a "LIVE · 91" pill is the norm for shopping-style live apps and for "followed live now" above a longer list. The untracked `LiveNowRail` work in progress follows this.

**Category browse.** Three-column grid of portrait box art with the name under it. Foam matches. Category detail: hero with the box art, name, viewer count, then the same live card list. Foam matches; the blurred box art behind the header is a nice touch none of the references use, keep it.

**Player + chat, portrait.** Player pinned at the top at 16:9. Below it either a stats row (viewers, uptime) then the chat list, or chat drawn over the lower third of the video with a gradient. The composer is a pill input with an emote button on the right and a send arrow. Foam uses the split layout (player, then chat, then composer) which is the Twitch and Weverse pattern and the right one for an emote-first client.

**Chat row.** Timestamp optional and muted, badges, username in the user colour, message text in the primary text colour, emotes inline at line height. Notices (sub, raid, mode changes) are a full-width tinted row. Foam matches; its rows are denser than every reference, which is a product decision (Chatterino-like), not a defect.

**Emote picker.** Sheet with a grabber, provider strip as icons across the top, search field under it, "recent" or channel set first, caps section headers, 5 to 8 column grid, set chips docked at the bottom. Foam matches the Telegram shape almost exactly.

**Settings.** iOS inset grouped list, tinted SF Symbol per row, title plus optional one-line subtitle, native Switch or value plus chevron, caps or sentence-case section headers with a footer note. Foam's `@expo/ui` Form screens match. The three JS-list settings screens (Emotes & Badges, Feedback, Channel Surfing) do not.

**Search.** Idle state is never blank: recent searches, suggested chips, or a category grid. Scope chips under the field. Results are rows with a thumbnail, a title and one meta line. Foam has suggested chips and a search history component but the idle screen is mostly empty space.

**Empty state.** Headline, one or two lines of body that say what will appear here, one CTA that fills it. Tabs and chips stay visible above. Twitch uses an illustration; Plex, SiriusXM and Tubi use a glyph or nothing. Foam's `EmptyState` (native `ContentUnavailableView` on iOS 17+) matches the glyph variant.

## Information hierarchy

1. Live-ness first: a red or accent LIVE chip on every live thumbnail, viewer count next to it.
2. Who: channel name is the heaviest text on the card.
3. What: stream title, two lines, truncated.
4. Where: category and language as the quietest line.

Foam's card order is name, title, uptime · viewers, category. Viewer count sits in the meta line instead of on the thumbnail, which is fine for the list variant.

## Where the accent is spent

References spend one accent on: the active tab, the primary CTA, the LIVE chip (when not red), progress, and the selected segment. Usernames in chat are the one place many hues appear and every reference accepts that. Foam's accent is `#2E86FF`. The LIVE chip is red, the CTA is accent. The onboarding orb renders as cyan on screen; that is the only place a second accent hue appears in chrome.

## How live-ness is communicated

- LIVE chip: pill, red or accent fill, white caps text, sometimes with a dot.
- Viewer count: eye or person glyph plus a compact number (`14K`).
- Uptime: `3h 12m` or "Started at 19:00".
- Ended state: "was live" or a VOD thumbnail with duration.

Foam matches on chip, count and uptime. It has no ended or offline state on the live stream screen.

## Illustration versus plain text

Only Twitch uses an illustration in an empty state. Everyone else uses a glyph or plain text. Onboarding is the one screen where every app uses a hero visual. Foam's use of an illustration only on onboarding is in line with the category.

## Motion conventions observed

- Sheets: system sheet with grabber and drag to dismiss. No custom spring.
- Tabs: no slide.
- Chat: new rows appear at the bottom without animation at high rate; a small fade or slide only when the rate is low. Foam's "New message animation" preference (off by default) matches.
- Player controls: fade out after 3 to 4 seconds, fade in on tap.
