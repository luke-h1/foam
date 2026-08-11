# One emote resolution pipeline; the preview predicts live chat

`processEmotesWorklet` (`utils/chat/emoteProcessor.ts`) is the only
text-to-emote resolver. The preferences preview
(`ChatPreferencesPreview.tsx`) calls it directly; `replaceTextWithEmotes`
and its private support code (`findEmotesInText`, `getEmoteMatchIndex`,
`splitTextWithTwemoji`, `sanitizeInput`) are deleted.

The two pipelines were separate implementations of "resolve this text against
the channel's emotes" and their matching semantics had drifted:

- zero-width overlays composed in the live pipeline only;
- trailing punctuation (`Kappa!`) matched in the preview only;
- `original_name` aliases resolved in the preview only;
- the preview also matched emotes as substrings inside words.

The decision on which semantics win: **live is canonical**. A preferences
preview exists to show what chat will render, so any preview-only match is a
lie about the product. Exact whitespace-delimited token matching also mirrors
how Twitch and 7TV render chat, so the preview-only behaviours were bugs of
generosity, not features. The one preview behaviour folded into the worklet is
the FE0F-stripped emoji fallback - standalone emoji are keyed without the
variant selector in the dataset (`2764` for ❤️), which is a data-format quirk,
not a semantics fork.

`utils/chat/__tests__/emoteProcessor.test.ts` pins the unified semantics
(alias non-resolution, trailing punctuation, shortcode and FE0F emoji paths);
`emoteProcessor.overlays.test.ts` pins zero-width composition. The former
divergence-pinning suite (`emoteResolutionDivergence.test.ts`) is gone with
the divergence. Link/clip/7TV-link words are handled by the shared
`utils/chat/parseWordLinkParts/`, which both this pipeline and
`MediaLinkCard` consume.

## Consequences

Per ADR-0010, the worklet is on the ingest hot path: any new matching
behaviour is added to the one implementation and must state its per-message
allocation cost (the FE0F retry allocates only on the non-ASCII miss branch).
Surfaces may no longer reach for a second resolver to get looser matching; if
a surface genuinely needs different semantics, that is a product decision to
record here first.
