# Reference apps and screens (Mobbin, iOS)

Appllama MCP was not connected this session, so Mobbin is the reference engine. Screen IDs are durable; image links expire. Re-open via mobbin.com/screens/<id>.

## Shortlist (live streaming / live chat / creator)

Twitch, YouTube (Live), Whatnot, Fanatics Live, eBay Live, TikTok Live, Weverse, Binance Live, DAZN, Telegram (emote/sticker sheet), Slack (reactions sheet).

## Home / followed / live-now

| App           | Screen                               | What it does well                                                                                                                                                                                      |
| ------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Twitch        | b499a80c-089d-4355-a203-97f96a21b13e | Full-width thumbnail cards, LIVE chip top-left, viewer count bottom-left of thumbnail, avatar + name + title + category + language chip under it. Segmented "Categories / Live Channels" under search. |
| Whatnot       | 68a933d8-8915-4844-8039-bad734c3af92 | Two-column grid, "Live · 263" pill on the card, one accent (yellow) spent on the active tab and one CTA.                                                                                               |
| eBay Live     | e752b22a-42ec-4363-ac2d-dfcea0e09910 | Horizontal "Live now" rail with LIVE pill + count, then "by category" grid. Same shape as the untracked LiveNowRail WIP.                                                                               |
| DAZN          | 8ee1cc30-e68e-46d6-9079-48a63eeb26a6 | Horizontal rails of 16:9 cards, LIVE chip, title + subtitle + "Started at" meta. Filter chips row under the header.                                                                                    |
| Fanatics Live | 09cb884b-e129-4565-8b97-e3d5d61749c6 | Hero card with viewer pill and two CTAs, chips row above.                                                                                                                                              |
| Netflix       | 41c4b912-b947-478d-bda7-34ccd841d08f | Rails, "Live Now" red chip on poster.                                                                                                                                                                  |

## Player + chat (portrait)

| App           | Screen                               | Pattern                                                                                                                    |
| ------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Weverse       | a7971332-55a7-4865-a533-bea8d0fc9326 | Player on top, stats row, chat list with name + time on one line and message below, pill input with reaction button right. |
| Whatnot       | 96f375a4-ec2f-4063-b65b-aaf1a6031f4a | Chat overlays the video, avatar + name + message, input pill with send arrow, keyboard pushes chat up.                     |
| YouTube Live  | 99a45f00-d630-473d-936e-d7d6c9c58ba4 | Chat over video, avatar + name (muted) + message (bright), input pill with emoji button.                                   |
| Fanatics Live | 145576dd-587d-4927-9708-24a6d88b680d | Follow pill next to name in header, viewer pill top right, chat gradient over video.                                       |
| TikTok Live   | 89f7f3a3-39b7-4b23-af1f-5f965b099082 | Follow pill, viewer count top right, comment pill with emoji button.                                                       |
| Binance Live  | d8b0b5c2-8776-4acd-a3bf-46e23368e4d7 | Chat rows as translucent chips, "Chat" pill button bottom-left.                                                            |

Common rules: LIVE chip is red or accent, viewer count uses an eye or person glyph and lives at the top right of the player; message input is a pill with a right-side emote button; usernames are muted, message text bright; the follow action is a compact pill next to the channel name.

## Emote / sticker picker

| App          | Screen                               | Pattern                                                                                                                                |
| ------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram     | 84ae4ce3-eb7f-4600-800a-25d9ef6c72ed | Provider strip at top (recent, favourites, packs), search under it, section headers in caps, sticker/emoji segmented toggle at bottom. |
| Slack        | 2c5ade1c-a40c-4e0c-a754-0ad03d58cd9d | Top tabs (Reactions/Effects/Stickers), search, "Frequently used" first.                                                                |
| Character AI | af6154dc-7de2-4e3f-b746-ccd444c124c5 | Dark sheet, grabber, close + search row, category chips, 5-col grid.                                                                   |
| Bump         | 0855f85c-07bc-4606-97fe-7a3f208cdcdc | Bottom category segmented (Recent/Trending/Stickers/GIFs).                                                                             |

Common rules: search first, recent/frequent first section, category strip is icons not text, grid is 5 to 8 columns, sheet has a grabber and can be dragged.

## Settings (dark media apps)

| App        | Screen                               | Pattern                                                                                                                             |
| ---------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Google TV  | 13577f13-8ff2-4789-ab1b-5a95a0df46d8 | Inset grouped cards, tinted icon tile per row, title + one-line subtitle, native switch. Large "Settings" title, Done at top right. |
| Disney+    | 4359011b-7088-46e8-8271-bae092e350ed | Caps section headers, value + chevron rows, destructive row in red-muted.                                                           |
| Hulu       | 9feaabb1-5467-4139-b9d4-448cef9cde3b | Toggle rows with a value echoed in the title ("Autoplay Next Video: Off").                                                          |
| Skillshare | 58510a3c-e2b2-43dc-9ae0-dee7fb61e933 | Video options as a half sheet: icon + label + value, Done.                                                                          |

## Empty states

| App      | Screen                               | Pattern                                                                                         |
| -------- | ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Twitch   | 4595d310-71ad-4e6d-b9c4-fce1604e4ab8 | Illustration, one-line headline, two-line body, single accent CTA. Segmented tabs stay visible. |
| Plex     | 1765cfb5-7492-47f0-bdf0-25ff56ebfaf4 | Headline + body + pill CTA, no illustration.                                                    |
| SiriusXM | 02d714d2-ee7a-48c7-a4c4-545276deacaa | Left-aligned headline under filter chips, outlined CTA.                                         |
| Tubi     | 2d0ed1e0-cf91-4fdc-91d6-cc4ff9deac83 | Glyph in a circle, headline, body, full-width accent CTA.                                       |

Common rule: the empty state says what will appear here and gives one action that fills it. Chips and tabs stay in place above it.

## Search

| App         | Screen                               | Pattern                                                                                          |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Plex        | 45643ee4-2314-43c6-af8f-1ad832f62c4e | Search field, filter chips (Films/TV/Live TV/People), result rows with thumbnail + title + meta. |
| Prime Video | 9eea0ab0-05f6-4ffe-b652-58065258e32f | Search field, "More to explore" links, genre grid of tiles.                                      |
| Apple TV    | 2440ea8e-1967-4e6c-8243-9dd06069aabc | Category tile grid, search bar docked at bottom.                                                 |
| TikTok      | 4577fbec-ac5c-4826-9b62-22b0dbf44be5 | Scope tabs under the field, "Others searched for" chips.                                         |

Common rule: idle search shows categories or recents, never blank. Results are rows with a thumbnail, a title and one meta line.
