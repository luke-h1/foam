Thank you for reviewing Foam. These notes explains what the app does, how to
sign in and the key flows worth checking.


What Foam is

Foam is a third-party mobile client for Twitch.tv. It offers a cleaner,
faster way to browse and watch live Twitch streams on mobile, and adds support
for the third-party chat emote extensions (7TV, BetterTTV, FrankerFaceZ) that
many Twitch viewers use.

Foam is an independent project and is not affiliated with or endorsed by
Twitch Interactive, Inc. All stream video, channel data, and chat are provided
by Twitch through Twitch's official public APIs and embedded player.

Main areas of the app

- Top - live streams and categories/games currently live on Twitch.
- Following - channels the signed-in user follows (requires sign-in).
- Search - find streamers and categories.
- Settings - appearance, chat, and account options.


How to sign in

Foam signs users in through Twitch's own OAuth login, which enforces Twitch
two-factor authentication (2FA). Because we cannot share working 2FA codes with
the review team, we provide a one-tap magic sign-in link that logs the app
in as a dedicated, low-privilege Twitch test account.

You can use this link: <MAGIC_LINK_URL> to sign in and test the authenticated features. Please adhere to Twitch's terms of service (https://legal.twitch.com/en/legal/terms-of-service/) when using features where you can interact with other users (such as chat), otherwise you are liable to get the account banned

Steps

1. Install the app
2. Open Safari on the same device.
3. Paste this magic link <MAGIC_LINK_URL> into the address bar and go.
4. Safari shows a brief "Signing in…" page and prompts to **Open in Foam** - tap 'Open'.
5. Foam opens, completes sign-in automatically, and lands on the Following tab as a logged-in user


Browsing without signing in

Most of the app works without an account. You can open the Top and
Search tabs, watch any live stream, and read chat without logging in.
Sign-in is only required for account-specific features (Following, sending chat
messages etc.).


What to check

1. Browse live content - open Top → Streams and Top → Categories; tap any live channel to open the player.
2. Watch a stream - confirm the Twitch player loads and plays video, and that live chat appears alongside it with emotes rendering.
3. Search - search for a streamer or game and open a result.
4. Sign in - follow the magic-link steps above and confirm the Following tab populates with the test account's followed channels.
5. Settings - review appearance and chat settings; confirm the app can be signed out from here.


Content & moderation notes

- All video and chat are live third-party content served by Twitch. Foam does
  not host, store, or generate this content.
- Chat messages are subject to Twitch's own moderation. Foam additionally lets
  users block and report users and hide messages.
- The third-party emote sets (7TV/BTTV/FFZ) are user-installed cosmetic overlays
  fetched from those public services and rendered in chat.


Test account

- Account type: a dedicated, low-privilege Twitch account created solely for
  review. It owns no channel of value and is dedicated for apple reviews only.
- Why a magic link instead of a username/password? - Twitch login enforces
  2FA, so static credentials alone cannot complete sign-in. The magic link
  completes the OAuth step on the reviewer's behalf using a securely stored token
  for this test account.


Account deletion

Foam has no accounts of its own - signing in uses Twitch's OAuth, and the only
account involved is the user's Twitch account, which is owned and managed by
Twitch. The in-app account deletion option is at:

Settings tab -> Account (profile card) -> Delete Account

Tapping it explains that account deletion is handled by Twitch and opens Twitch's
Security and Privacy settings (https://www.twitch.tv/settings/security), where
the user can disable or delete their Twitch account. The adjacent "Log out"
option removes the saved Twitch token from the device.


Privacy & tracking

Foam does not track users as defined by App Tracking Transparency. It does not
use the IDFA/advertising identifier, does not collect a Device ID for tracking,
and does not share data with third-party advertisers or data brokers. Product
analytics (Statsig) are first-party, keyed on the Twitch account ID rather than a
device identifier, and can be turned off in Settings -> Other. Crash reporting
(Sentry) is sent with PII scrubbed. The app's privacy manifest declares
NSPrivacyTracking = false, so no ATT prompt is required.


Background audio

The app does not provide persistent background audio; the previously declared
"audio" UIBackgroundMode has been removed.


Contact

For any questions during review, please reach out via the contact details in the
App Store Connect submission and we will respond promptly.