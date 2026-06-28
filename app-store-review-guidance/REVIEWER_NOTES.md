# Foam — App Review Notes

Thank you for reviewing Foam. This document explains what the app does, how to
sign in (including a one-tap reviewer sign-in that bypasses Twitch two-factor
authentication), and the key flows worth checking.

---

## What Foam is

Foam is a third-party mobile client for **Twitch.tv**. It offers a cleaner,
faster way to browse and watch live Twitch streams on mobile, and adds support
for the third-party chat emote extensions (7TV, BetterTTV, FrankerFaceZ) that
many Twitch viewers use but that the official app does not render.

Foam is an independent project and is **not affiliated with or endorsed by
Twitch Interactive, Inc.** All stream video, channel data, and chat are provided
by Twitch through Twitch's official public APIs and embedded player.

### Main areas of the app (bottom tabs)

- **Top** — live streams and categories/games currently live on Twitch.
- **Following** — channels the signed-in user follows (requires sign-in).
- **Search** — find streamers and categories.
- **Settings** — appearance, chat, and account options.

---

## How to sign in (for App Review)

Foam signs users in through **Twitch's own OAuth login**, which enforces Twitch
two-factor authentication (2FA). Because we cannot share working 2FA codes with
the review team, we provide a **one-tap magic sign-in link** that logs the app
in as a dedicated, low-privilege Twitch test account.

> The exact magic link (it contains a secret key) is provided in the
> **App Review Information → Notes** field of this submission in App Store
> Connect. It is intentionally **not** committed to source control.

### Steps

1. Install and open Foam at least once (so the app registers its `foam://` URL
   scheme), then return to the Home Screen.
2. Open **Safari** on the same device.
3. Paste the magic link from the review notes into the address bar and go:
   ```
   https://auth.foam-app.com/api/magic?key=<KEY_PROVIDED_IN_REVIEW_NOTES>
   ```
4. Safari shows a brief "Signing in…" page and prompts to **Open in Foam** —
   tap **Open**.
5. Foam opens, completes sign-in automatically, and lands on the **Following**
   tab as a logged-in user. No username, password, or 2FA code is required.

If the link is opened a second time, the app safely ignores the duplicate and
will not loop or re-navigate.

### Browsing without signing in

Most of the app works **without** an account. You can open the **Top** and
**Search** tabs, watch any live stream, and read chat without logging in.
Sign-in is only required for account-specific features (Following, sending chat
messages, channel points).

---

## What to check

1. **Browse live content** — open **Top → Streams** and **Top → Categories**;
   tap any live channel to open the player.
2. **Watch a stream** — confirm the Twitch player loads and plays video, and
   that live chat appears alongside it with emotes rendering.
3. **Search** — search for a streamer or game and open a result.
4. **Sign in** — follow the magic-link steps above and confirm the **Following**
   tab populates with the test account's followed channels.
5. **Settings** — review appearance and chat settings; confirm the app can be
   signed out from here.

---

## Content & moderation notes

- All video and chat are live third-party content served by Twitch. Foam does
  not host, store, or generate this content.
- Chat messages are subject to Twitch's own moderation. Foam additionally lets
  users **block** and **report** users and hide messages.
- The third-party emote sets (7TV/BTTV/FFZ) are user-installed cosmetic overlays
  fetched from those public services and rendered in chat.

---

## Test account

- **Account type:** a dedicated, low-privilege Twitch account created solely for
  review. It owns no channel of value and can be revoked after review.
- **Why a magic link instead of a username/password:** Twitch login enforces
  2FA, so static credentials alone cannot complete sign-in. The magic link
  completes the OAuth step on the reviewer's behalf using a securely stored token
  for this test account.

If you would prefer traditional username/password credentials for a non-2FA test
account, we are happy to provide them on request through Resolution Center.

---

## Contact

For any questions during review, please reach out via the contact details in the
App Store Connect submission and we will respond promptly.
