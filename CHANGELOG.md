# Changelog

## 1.0.9 (Production)

### 🐛 Bug Fixes

- **chat:** Blank rows, a11y labels, skeleton sizing, comment cleanup ([#881](https://github.com/lhowsam/foam/issues/881))

### 👷 CI/CD

- Remove Cursor review from the PR pipeline ([#878](https://github.com/lhowsam/foam/issues/878))

### 🔧 Miscellaneous Tasks

- **tooling:** Install anti-slop oxlint plugin and clear all in-scope violations ([#876](https://github.com/lhowsam/foam/issues/876))
- **app:** Update expo to latest 57 ([#880](https://github.com/lhowsam/foam/issues/880))

## 1.0.8 (Production)

### 🐛 Bug Fixes

- **player:** Stop the live-sync seek freezing video on android ([#868](https://github.com/lhowsam/foam/issues/868))
- **app:** Empty badge patching
- **app:** Size the auth sheet to its content and align hosted form rows ([#874](https://github.com/lhowsam/foam/issues/874))

### 👷 CI/CD

- Drop the OTA compat check and cut redundant workflow runs ([#867](https://github.com/lhowsam/foam/issues/867))
- Speed up checks and cache the native build's downloads ([#869](https://github.com/lhowsam/foam/issues/869))

### 🔧 Miscellaneous Tasks

- **infrastructure:** Reduce ci mins
- **infrastructure:** Bump actions/cache from 4.3.0 to 6.1.0 ([#871](https://github.com/lhowsam/foam/issues/871))

## 1.0.7 (Production)

### ⏪ Reverted

- **app:** Back out ios native-feel overhaul ([#819](https://github.com/lhowsam/foam/issues/819)) ([#822](https://github.com/lhowsam/foam/issues/822))

### ♻️ Refactor

- **images:** One url decision, dead machinery removed, sealed cache seams ([#854](https://github.com/lhowsam/foam/issues/854))
- **store:** Halve the persisted chat blob, hoist globals, session-scope hot writes ([#855](https://github.com/lhowsam/foam/issues/855))
- **chat:** One enrichment owner, single-writer cosmetics, modules out of hooks ([#856](https://github.com/lhowsam/foam/issues/856))
- **chat:** Commit-path perf campaign, architecture deepening, one emote pipeline ([#864](https://github.com/lhowsam/foam/issues/864))

### ⚡ Performance

- **chat:** Delete dead list-path work, cache badge normalisation, fix sim perf harness ([#849](https://github.com/lhowsam/foam/issues/849))

### ✨ Features

- **app:** Ios native-feel overhaul ([#819](https://github.com/lhowsam/foam/issues/819))
- **chat:** Dev-gated debug details in user, emote and badge sheets ([#851](https://github.com/lhowsam/foam/issues/851))
- **app:** Syncronize emote frames ([#857](https://github.com/lhowsam/foam/issues/857))

### 🐛 Bug Fixes

- **emotes:** Restore expo-image webp codec patch ([#820](https://github.com/lhowsam/foam/issues/820))
- **app:** Dedupe react-native-screens and restore ios native-feel overhaul ([#823](https://github.com/lhowsam/foam/issues/823))
- **app:** Disable synchronous screens updates and freeze, stop shipping cached js in release builds ([#824](https://github.com/lhowsam/foam/issues/824))
- **settings:** Make full row tappable in ios form navigation rows ([#827](https://github.com/lhowsam/foam/issues/827))
- **chat:** 1.0.7 prep - restore the 2x emote floor, delete the dead height estimator, unify the chat scale ([#832](https://github.com/lhowsam/foam/issues/832))
- **app:** Move bench perf fixture back out of **tests** ([#833](https://github.com/lhowsam/foam/issues/833))
- **chat:** Black emote sheet, stop the load freeze, unfreeze the emotes ([#834](https://github.com/lhowsam/foam/issues/834))
- **chat:** Stop animated emotes decoding through dav1d and animating unpaused ([#836](https://github.com/lhowsam/foam/issues/836))
- **chat:** Make refresh drop every cache and put the chat sheets back to custom + black ([#837](https://github.com/lhowsam/foam/issues/837))
- **chat:** Stop blank chat rows when the emote cache drops a ref under a mounted row ([#838](https://github.com/lhowsam/foam/issues/838))
- **chat:** Stop badges rendering as blank slots, keep campaign badge sets, paint ffz badges ([#839](https://github.com/lhowsam/foam/issues/839))
- **sentry:** Keep warns as structured logs, revert badge tint and ref watchdog ([#840](https://github.com/lhowsam/foam/issues/840))
- **chat:** Stop emote messages leaving blank gaps on the flex-wrap path ([#841](https://github.com/lhowsam/foam/issues/841))
- **cosmetics:** Keep 7tv paints on usernames while chat scrolls ([#847](https://github.com/lhowsam/foam/issues/847))
- **chat:** Stop dead badges and transparent paints leaving blank slots ([#848](https://github.com/lhowsam/foam/issues/848))
- **chat:** Make badge render keys collision-proof ([#850](https://github.com/lhowsam/foam/issues/850))
- **chat:** Match the reply header icon to the reference rendering ([#852](https://github.com/lhowsam/foam/issues/852))
- **chat:** Stop blank emote and badge slots under memory pressure ([#853](https://github.com/lhowsam/foam/issues/853))
- **chat:** Patch legend list 3.3.3 render range to stop the blank spacing holes ([#860](https://github.com/lhowsam/foam/issues/860))
- **player:** Resume and re-attach the player when the app comes back ([#861](https://github.com/lhowsam/foam/issues/861))
- **chat:** Bucket chat row item types by content width so the size average stops opening holes ([#862](https://github.com/lhowsam/foam/issues/862))
- **chat:** Render every usernotice and stop the pipeline dropping messages ([#863](https://github.com/lhowsam/foam/issues/863))

### 👷 CI/CD

- Run the PR checks locally and gate merges on gh signoff ([#865](https://github.com/lhowsam/foam/issues/865))

### 🔧 Miscellaneous Tasks

- **infrastructure:** Make self-hosted runner opt-in for deploys ([#821](https://github.com/lhowsam/foam/issues/821))
- **infrastructure:** Bump expo/expo-github-action/preview from 8.2.1 to 9.0.0 ([#845](https://github.com/lhowsam/foam/issues/845))
- **infrastructure:** Bump actions/setup-java from 5.6.0 to 5.7.0 ([#843](https://github.com/lhowsam/foam/issues/843))
- **infrastructure:** Bump 1password/load-secrets-action from 4.0.0 to 5.0.0 ([#842](https://github.com/lhowsam/foam/issues/842))
- **app:** Update legend list ([#846](https://github.com/lhowsam/foam/issues/846))

## 1.0.6 (Production)

### ✨ Features

- **app:** Android release ([#779](https://github.com/lhowsam/foam/issues/779))

### 🐛 Bug Fixes

- **app:** Resolve safe react-doctor findings ([#782](https://github.com/lhowsam/foam/issues/782))
- **infrastructure:** Pin jdk 21 for android native builds ([#786](https://github.com/lhowsam/foam/issues/786))
- **android:** Set MaterialComponents theme for LibsActivity ([#785](https://github.com/lhowsam/foam/issues/785))
- **ci:** Bump react-doctor action to a release with pinned transitive actions ([#791](https://github.com/lhowsam/foam/issues/791))
- **perf:** Only configure the expo-image cache on ios ([#789](https://github.com/lhowsam/foam/issues/789))
- **chat:** Cap concurrent emote picker animations ([#788](https://github.com/lhowsam/foam/issues/788))
- **seventv:** Resolve the channel emote set id from v4 before the v3 deprecation ([#793](https://github.com/lhowsam/foam/issues/793))
- **ci:** Give android a per-variant google services file ([#794](https://github.com/lhowsam/foam/issues/794))

### 👷 CI/CD

- Block merge commits on pr branches ([#787](https://github.com/lhowsam/foam/issues/787))

### 🔧 Miscellaneous Tasks

- **app:** Hide mock changelog from users ([#783](https://github.com/lhowsam/foam/issues/783))
- **infrastructure:** Update reassure ([#784](https://github.com/lhowsam/foam/issues/784))
- **infrastructure:** Create FUNDING.yml ([#790](https://github.com/lhowsam/foam/issues/790))

## 1.0.6 (TestFlight)

### ♻️ Refactor

- **infrastructure:** Speed up ci and fix workflow bugs ([#807](https://github.com/lhowsam/foam/issues/807))

### ⚡ Performance

- **chat:** Stop mention autocomplete rebuilding a collator per comparison ([#804](https://github.com/lhowsam/foam/issues/804))

### 🐛 Bug Fixes

- Android player freeze, android chat long-press, ios emote sheet hang ([#795](https://github.com/lhowsam/foam/issues/795))
- **chat:** Swap bottom sheets onto @expo/ui for the time being ([#798](https://github.com/lhowsam/foam/issues/798))
- **haptics:** Replace expo-haptics with react-native-pulsar ([#801](https://github.com/lhowsam/foam/issues/801))
- **emotes:** Avoid main-thread WebP decoding for FFZ emotes ([#802](https://github.com/lhowsam/foam/issues/802))
- **chat:** Stop the emote sheet freezing on provider tab switch ([#803](https://github.com/lhowsam/foam/issues/803))
- **chat:** Tint the composer caret and selection with the accent ([#805](https://github.com/lhowsam/foam/issues/805))
- **chat:** Match 7tv paint rendering to the reference span model ([#806](https://github.com/lhowsam/foam/issues/806))

### 📦 Dependencies

- **deps:** Bump expo/expo-github-action from 8.2.1 to 9.0.0 ([#809](https://github.com/lhowsam/foam/issues/809))
- **deps:** Bump actions/download-artifact from 4.3.0 to 8.0.1 ([#810](https://github.com/lhowsam/foam/issues/810))
- **deps:** Bump actions/upload-artifact from 4.6.2 to 7.0.1 ([#812](https://github.com/lhowsam/foam/issues/812))
- **deps:** Bump zizmorcore/zizmor-action from 0.5.3 to 0.6.1 ([#811](https://github.com/lhowsam/foam/issues/811))
- **deps:** Bump actions/checkout from 6.0.3 to 7.0.1 ([#808](https://github.com/lhowsam/foam/issues/808))

### 🔧 Miscellaneous Tasks

- **app:** Revert bottom sheet ([#799](https://github.com/lhowsam/foam/issues/799))
- **app:** Try true sheet ([#800](https://github.com/lhowsam/foam/issues/800))
- **ci:** Swift + kotlin linting with commit hooks ([#763](https://github.com/lhowsam/foam/issues/763))
- **infrastructure:** Use infrastructure commit scope for dependabot ([#813](https://github.com/lhowsam/foam/issues/813))
- **infrastructure:** Bump actions/cache/restore from 4.3.0 to 6.1.0 ([#814](https://github.com/lhowsam/foam/issues/814))
- **infrastructure:** Bump actions/cache/save from 4.3.0 to 6.1.0 ([#817](https://github.com/lhowsam/foam/issues/817))
- **infrastructure:** Bump peakoss/anti-slop from 753c51043d0c43564e1df382c173233c56cdb5e4 to 57858eead489d08b255fab2af45a506c2ca6eab2 ([#818](https://github.com/lhowsam/foam/issues/818))
- **infrastructure:** Bump actions/labeler from 4.3.0 to 7.0.0 ([#815](https://github.com/lhowsam/foam/issues/815))
- **infrastructure:** Bump marocchino/sticky-pull-request-comment from 2.9.4 to 3.0.5 ([#816](https://github.com/lhowsam/foam/issues/816))

## 1.0.6 (Internal)

_No changes in this build beyond the TestFlight build._

## 1.0.5 (Production)

### ✨ Features

- **app:** Vexo analytics ([#776](https://github.com/lhowsam/foam/issues/776))
- **perf:** Add iOS signpost module for Instruments profiling ([#775](https://github.com/lhowsam/foam/issues/775))

### 🐛 Bug Fixes

- Chat timestamps, emote/badge failure reasons, remove clip download ([#761](https://github.com/lhowsam/foam/issues/761))

## 1.0.5 (Internal)

### ✨ Features

- **firebase:** Replace statsig with google analytics ([#778](https://github.com/lhowsam/foam/issues/778))

### 🐛 Bug Fixes

- **security:** Restrict https auth callbacks to foam-app.com on native ([#781](https://github.com/lhowsam/foam/issues/781))

### 📝 Other Changes

- Revert "feat(app): vexo analytics" ([#777](https://github.com/lhowsam/foam/issues/777))

### 🔧 Miscellaneous Tasks

- **tooling:** Non-android tooling and cleanup from #764 ([#780](https://github.com/lhowsam/foam/issues/780))

## 1.0.4 (Production)

### 🐛 Bug Fixes

- **app:** Add ast-grep rule for height/width calcs

### 🔧 Miscellaneous Tasks

- **app:** Enable vexo analytics ([#766](https://github.com/lhowsam/foam/issues/766))
- **app:** Disable slide-in animation by default ([#765](https://github.com/lhowsam/foam/issues/765))

## 1.0.4 (Internal)

### ✨ Features

- **app:** Android release ([#738](https://github.com/lhowsam/foam/issues/738))

### 🐛 Bug Fixes

- Chat timestamps, emote/badge failure reasons, remove clip download ([#749](https://github.com/lhowsam/foam/issues/749))
- **twitch:** Handle undefined access_token in getDefaultToken ([#745](https://github.com/lhowsam/foam/issues/745))

### 🔧 Miscellaneous Tasks

- **ci:** Swift + kotlin linting with commit hooks ([#750](https://github.com/lhowsam/foam/issues/750))
- **app:** Disable slide-in animation by default ([#754](https://github.com/lhowsam/foam/issues/754))
- **app:** Enable vexo analytics ([#756](https://github.com/lhowsam/foam/issues/756))

## 1.0.2 (Production)

### ✨ Features

- **devtools:** Add environment variables viewer ([#698](https://github.com/lhowsam/foam/issues/698))

### 🐛 Bug Fixes

- **player:** Make login-required content gate tappable on custom player ([#697](https://github.com/lhowsam/foam/issues/697))
- **app:** Emote menu perf ([#695](https://github.com/lhowsam/foam/issues/695))
- **updates:** Drain in-flight fetches before applying an OTA update ([#701](https://github.com/lhowsam/foam/issues/701))
- **app:** V1 mop up ([#702](https://github.com/lhowsam/foam/issues/702))
- **devtools:** Prevent App Store lookup for non-production iOS builds ([#703](https://github.com/lhowsam/foam/issues/703))
- **chat:** Fix 7TV badges/cosmetics loading and emote sheet ([#704](https://github.com/lhowsam/foam/issues/704))
- **updates:** Patch expo-modules-jsi for OTA reload JSI crash ([#706](https://github.com/lhowsam/foam/issues/706))
- **infrastructure:** Fix size analysis upload step
- **infrastructure:** Fix tsc
- **ai:** Improve adversarial agent loops

### 🔧 Miscellaneous Tasks

- **infrastructure:** Add runner input ([#705](https://github.com/lhowsam/foam/issues/705))
- **ai:** Add claude review prompt ([#709](https://github.com/lhowsam/foam/issues/709))
- **infrastructure:** Wire Sentry Size Analysis into native builds ([#708](https://github.com/lhowsam/foam/issues/708))
- **ai:** Add Codex PR review workflow and mention trigger ([#712](https://github.com/lhowsam/foam/issues/712))
- **app:** Simplify hot paths and remote-config Twitch embed parent ([#707](https://github.com/lhowsam/foam/issues/707))
- **stream:** Gate embed changes via ff ([#713](https://github.com/lhowsam/foam/issues/713))

## 1.0.2 (TestFlight)

_No changes in this build beyond the Production build._

## 1.0.2 (Internal)

### 🔧 Miscellaneous Tasks

- **stream:** Gate embed changes via ff ([#713](https://github.com/lhowsam/foam/issues/713))

## 1.0.1 (Production)

### ♻️ Refactor

- **chat:** Improve bottom sheet
- **infrastructure:** Improve GHA workflows ([#657](https://github.com/lhowsam/foam/issues/657))
- **app:** Align 7tv caching strategy ([#690](https://github.com/lhowsam/foam/issues/690))

### ⚡ Performance

- **chat:** Index badge lookups and trim per-message hot-path work ([#689](https://github.com/lhowsam/foam/issues/689))

### ✨ Features

- **app:** I8n
- **app:** I8n ([#633](https://github.com/lhowsam/foam/issues/633))
- **app:** Vod screen ([#644](https://github.com/lhowsam/foam/issues/644))
- **app:** Improve chat settings ui
- **emotes:** Split subscriber emotes by channel and add 7tv personal emotes to the picker ([#686](https://github.com/lhowsam/foam/issues/686))
- **chat:** Add slash command autocomplete to composer ([#688](https://github.com/lhowsam/foam/issues/688))

### 🐛 Bug Fixes

- **app:** Fix wkwebview compositor silent fail ([#628](https://github.com/lhowsam/foam/issues/628))
- **chat:** Emote cut off, composer clip, safe area ([#631](https://github.com/lhowsam/foam/issues/631))
- **chat:** Chat height calc
- **chat:** Chat height calc
- **app:** Fix build
- **app:** Auth expiry ([#640](https://github.com/lhowsam/foam/issues/640))
- **chat:** Fix chat clipping height ([#642](https://github.com/lhowsam/foam/issues/642))
- **chat:** Width aware chat window
- **app:** Release patches ([#645](https://github.com/lhowsam/foam/issues/645))
- **chat:** Hide captions ([#646](https://github.com/lhowsam/foam/issues/646))
- **player:** Captions persisting
- **player:** Captions persisting
- **app:** Player captions
- **app:** Image perf
- **app:** Image perf
- **perf:** Reduce animated emote decode cpu
- **perf:** Improve chat perf ([#651](https://github.com/lhowsam/foam/issues/651))
- **perf:** Perf sweep ([#653](https://github.com/lhowsam/foam/issues/653))
- **perf:** Perf sweep pt 2
- **perf:** Perf sweep pt 2
- **perf:** Perf sweep pt 2 ([#654](https://github.com/lhowsam/foam/issues/654))
- **perf:** Perf sweep
- **app:** Debug missing images ([#660](https://github.com/lhowsam/foam/issues/660))
- **perf:** Correct reanimated worklets babel plugin order ([#661](https://github.com/lhowsam/foam/issues/661))
- **app:** Stray unicode chars ([#662](https://github.com/lhowsam/foam/issues/662))
- **app:** Crash after excessive nav actions ([#663](https://github.com/lhowsam/foam/issues/663))
- **app:** Player intermitent pausing ([#664](https://github.com/lhowsam/foam/issues/664))
- **chat:** Player lag emote scale ([#665](https://github.com/lhowsam/foam/issues/665))
- **app:** Patch ref warning ([#666](https://github.com/lhowsam/foam/issues/666))
- **app:** Fix import error
- **infrastructure:** Fix metadata not showing
- **app:** Offline banner
- **app:** Fix auth after magic link support
- **app:** Infinite push on magic link receive ([#674](https://github.com/lhowsam/foam/issues/674))
- **app:** Magic link based tokens
- **app:** Fix review comments ([#677](https://github.com/lhowsam/foam/issues/677))
- **app:** Fix review comments
- **app:** Unit tests
- **app:** Delete acc
- **app:** Delete acc
- **app:** Fix sentry pods
- **app:** Oom images ([#679](https://github.com/lhowsam/foam/issues/679))
- **app:** Fix tsc
- **infrastructure:** Pull before commit changelog
- **infrastructure:** Per env changelogs ([#687](https://github.com/lhowsam/foam/issues/687))
- **infrastructure:** Drop invalid --depth=0 from OTA base fetch ([#691](https://github.com/lhowsam/foam/issues/691))

### 👷 CI/CD

- **infrastructure:** Run OTA compat check on main push + add local ota:check script ([#693](https://github.com/lhowsam/foam/issues/693))

### 🔧 Miscellaneous Tasks

- **app:** Improve accesibility ([#629](https://github.com/lhowsam/foam/issues/629))
- Upgrade bun to 1.3.14
- Upgrade bun to 1.3.14 in CI
- **app:** Update legend list ([#641](https://github.com/lhowsam/foam/issues/641))
- **ai:** Update skills
- **chat:** Tidy up scroll activity
- **infrastructure:** Swap sentry org ([#658](https://github.com/lhowsam/foam/issues/658))
- **app:** Tidy up delay options ([#667](https://github.com/lhowsam/foam/issues/667))
- **app:** Analytics opt out + pii scrub ([#668](https://github.com/lhowsam/foam/issues/668))
- **infrastructure:** Populate all env vars in ci ([#671](https://github.com/lhowsam/foam/issues/671))
- **infrastructure:** Update vaults ([#673](https://github.com/lhowsam/foam/issues/673))
- **app:** Improve search results ([#675](https://github.com/lhowsam/foam/issues/675))
- **docs:** Add pr template
- **ai:** Add claude md
- **docs:** Update app review notes
- **infrastructure:** Change to self-hosted runner
- **app:** Update to expo 57 ([#678](https://github.com/lhowsam/foam/issues/678))
- **app:** Sync lockfile with sentry deps ([#680](https://github.com/lhowsam/foam/issues/680))
- **app:** Ui improvements ([#681](https://github.com/lhowsam/foam/issues/681))
- **infrastructure:** Add OTA compat check

## 1.0.1 (TestFlight)

### 🐛 Bug Fixes

- **chat:** Send 7tv bridge cosmetics lookups by username ([#694](https://github.com/lhowsam/foam/issues/694))

## 1.0.1 (Internal)

_No changes in this build beyond the TestFlight build._

## 1.0.0 (Production)

### ⚡ Performance

- **chat:** Cut emote + badge perf overhead ([#626](https://github.com/lhowsam/foam/issues/626))

### ✨ Features

- **chat:** Blocked terms CRUD in settings ([#623](https://github.com/lhowsam/foam/issues/623))
- **release:** ASO store metadata and in-app review prompts
- **monitoring:** Global fatal handler, query error routing, friendlier error screen
- **settings:** Shake to report a problem
- **app:** Prepare for 1.0 ([#627](https://github.com/lhowsam/foam/issues/627))

### 🐛 Bug Fixes

- **app:** Fall back to anon auth on bootstrap failures ([#625](https://github.com/lhowsam/foam/issues/625))
- **infrastructure:** OTA
- **infrastructure:** Missing S3 variables
- **app:** Only persist successful queries
- **infrastructure:** Source token in scripts

### 🔧 Miscellaneous Tasks

- **test:** Full e2e coverage

## 1.0.0 (TestFlight)

_No changes in this build beyond the Production build._

## 1.0.0 (Internal)

_No changes in this build beyond the TestFlight build._

## 0.0.42 (TestFlight)

### ♻️ Refactor

- **app:** Native feel + folder org ([#616](https://github.com/lhowsam/foam/issues/616))
- **infrastructure:** Tidy up deploy actions

### ⚡ Performance

- **app:** Enable bundle mode ([#606](https://github.com/lhowsam/foam/issues/606))
- **chat:** Migrate to v4 ([#615](https://github.com/lhowsam/foam/issues/615))

### 🐛 Bug Fixes

- **app:** Composer + chat provider timeout caching ([#609](https://github.com/lhowsam/foam/issues/609))
- **app:** Performance audit ([#611](https://github.com/lhowsam/foam/issues/611))
- **app:** Fix auth fail on startup ([#614](https://github.com/lhowsam/foam/issues/614))
- **infrastructure:** Fix ci
- **infrastructure:** Add testflight + int services
- **infrastructure:** Changelog deploy step
- **infrastructure:** Fix changelog action
- **app:** Go back to axios from nitro-fetch
- **infrastructure:** Deploy concurrency

### 📝 Other Changes

- WIP - fix(chat): observable perf improvements + ux ([#610](https://github.com/lhowsam/foam/issues/610))
- WIP - feat(infrastructure): S3 expo/fingerprint cache ([#617](https://github.com/lhowsam/foam/issues/617))

### 🔧 Miscellaneous Tasks

- **app:** Update rozenite ([#612](https://github.com/lhowsam/foam/issues/612))
- **infrastructure:** Update action versions ([#618](https://github.com/lhowsam/foam/issues/618))

## 0.0.42 (Internal)

### 🐛 Bug Fixes

- **app:** Sentry initialization
- **app:** Sentry initialization

## 0.0.41 (Production)

### ♻️ Refactor

- **app:** Perf improvements ([#602](https://github.com/lhowsam/foam/issues/602))
- **chat:** Player orientation improvements

### ✨ Features

- **app:** Pinned messages

### 🐛 Bug Fixes

- **app:** Improve irc perf ([#575](https://github.com/lhowsam/foam/issues/575))
- **app:** Improve irc perf ([#601](https://github.com/lhowsam/foam/issues/601))
- **app:** Swipe to dismiss webview
- **app:** Fix webview player overhead ([#605](https://github.com/lhowsam/foam/issues/605))

### 🔧 Miscellaneous Tasks

- **app:** Update to sdk 56 ([#572](https://github.com/lhowsam/foam/issues/572))
- **app:** Refine observability standards ([#573](https://github.com/lhowsam/foam/issues/573))
- **app:** Release 0.0.41
- **tooling:** Update commitlint

## 0.0.40 (Production)

### ♻️ Refactor

- **app:** Blank screen during splash
- **app:** Move refresh token to auth proxy
- **app:** Move to RN stylesheet ([#538](https://github.com/lhowsam/foam/issues/538))
- **auth:** Sheet presentation for auth screen
- **chat:** Improve perf of chat ([#562](https://github.com/lhowsam/foam/issues/562))
- **app:** Tidy up utils + perf tests
- **app:** Tidy up utils + perf tests
- **app:** Refactor error layout

### ✨ Features

- **app:** Move to native tabs ([#515](https://github.com/lhowsam/foam/issues/515))
- **app:** Custom haptics module ([#517](https://github.com/lhowsam/foam/issues/517))
- **app:** Add react-native-ease ([#525](https://github.com/lhowsam/foam/issues/525))
- **app:** Support paints in reply body
- **app:** Enhance chat design ([#540](https://github.com/lhowsam/foam/issues/540))
- **app:** Settings preview ([#542](https://github.com/lhowsam/foam/issues/542))
- **app:** Redesign ([#545](https://github.com/lhowsam/foam/issues/545))
- **chat:** Load recent irc msgs ([#561](https://github.com/lhowsam/foam/issues/561))

### 🐛 Bug Fixes

- **app:** Orientation lock
- **app:** Live stream player rotation fps drops
- **infrastructure:** Change to macos 26
- **infrastructure:** Fall thru in if statement
- **infrastructure:** Fall thru in if statement
- **app:** Android improvements
- **app:** Android lint fixes
- **app:** Emote sheet + badge sheet improvements
- Add reply button to RichChatMessage to fix test failures
- **app:** Dont trim max messages
- **app:** Reanimated perf ([#526](https://github.com/lhowsam/foam/issues/526))
- **app:** Blank chat re-renders fix
- **app:** Fix webview going to ttv after background
- **app:** Hide native player icon
- **app:** Redesign refactor tidy ([#547](https://github.com/lhowsam/foam/issues/547))
- **app:** Web support ([#549](https://github.com/lhowsam/foam/issues/549))
- **app:** Chat list scroll + auth expr
- **app:** Changelog mod + auth patches ([#556](https://github.com/lhowsam/foam/issues/556))
- **chat:** Resizing chat landscape + toggles ([#558](https://github.com/lhowsam/foam/issues/558))
- **infrastructure:** Zizmor security fixes ([#559](https://github.com/lhowsam/foam/issues/559))
- **app:** Player bootsplash ([#567](https://github.com/lhowsam/foam/issues/567))
- **app:** Player latency + chat settings ([#569](https://github.com/lhowsam/foam/issues/569))

### 📝 Other Changes

- Ota native test failure ([#523](https://github.com/lhowsam/foam/issues/523))
- Chat re-render issue ([#528](https://github.com/lhowsam/foam/issues/528))

### 🔧 Miscellaneous Tasks

- **infrastructure:** Tidy up deploy-ota-or-native
- **app:** Refresh agent skills
- **app:** Tidy up dead code ([#535](https://github.com/lhowsam/foam/issues/535))
- **app:** Update skills
- **app:** Update expo-glass-effect
- **app:** Update sentry ([#536](https://github.com/lhowsam/foam/issues/536))
- **docs:** Update readme
- **security:** Set min release age to 7d
- **ci:** Disable deploy on push
- **security:** Add zizmor
- **infrastructure:** Add sonarcube ([#560](https://github.com/lhowsam/foam/issues/560))
- **documentation:** Simplify proxy server

## ota-c42ee437-f55f-4a6e-93b8-7fb765721c2d

### ♻️ Refactor

- **app:** Tidy up chat store ([#508](https://github.com/lhowsam/foam/issues/508))

### ✨ Features

- **app:** Improve stream overlay

### 🐛 Bug Fixes

- **app:** Fix android build
- **infrastructure:** Fix clearing OTA ids
- **app:** Improve unmuting of webview ([#510](https://github.com/lhowsam/foam/issues/510))
- **infrastructure:** Limit concurrency of deploy-ota-or-native workflow
- **app:** Improve stream delay

### 🔧 Miscellaneous Tasks

- **app:** Upgrade deps ([#509](https://github.com/lhowsam/foam/issues/509))
- **app:** Remove interactionManager

## ota-9dc97786-4ff2-40e0-83b9-19be83418ed1

### 🐛 Bug Fixes

- **app:** Fix crash on rotate

## ota-8b3783c1-ee13-4bf3-8d2d-b68cf79a0655

### ♻️ Refactor

- **app:** Simplify chat LOC

### 🐛 Bug Fixes

- **app:** Chat flickering
- **app:** Fix unit tests
- **app:** Unit test fixes

### 🔧 Miscellaneous Tasks

- **app:** Fix build
- **app:** Fix build

## ota-1ffa7bd3-e434-4400-9364-90da567dcf68

### 🐛 Bug Fixes

- **app:** Fix stream muted ([#492](https://github.com/lhowsam/foam/issues/492))
- **app:** Fix stream muted ([#493](https://github.com/lhowsam/foam/issues/493))

### 🔧 Miscellaneous Tasks

- **app:** Update agent skills

## ota-0831b9f9-5fce-43bb-8b70-fe9c4633601b

### ✨ Features

- **app:** Ensure chat + video is in sync ([#488](https://github.com/lhowsam/foam/issues/488))

## ota-a0aa7b2d-23b7-4b57-b1eb-f6f96acb3718

### 🔧 Miscellaneous Tasks

- **infrastructure:** Refresh agents

## ota-aae23856-f62e-4417-aa6b-efcef6d920b6

### 🐛 Bug Fixes

- **app:** Fix inf re-render loop
- **app:** Fix changelogs

## ota-09afb2ac-dbdf-4b7d-996c-6beeaef68082

### 🐛 Bug Fixes

- **app:** Volume muted on webview
- **infrastructure:** Fix fingerprint failing in CD

### 🔧 Miscellaneous Tasks

- **app:** Remove old native player
- **app:** Improve gh release format
- **infrastructure:** Improve slack msg

## ota-c3493b6f-a9f2-4896-9a64-fb2d956e8245

### 🐛 Bug Fixes

- **app:** Webview improvements ([#487](https://github.com/lhowsam/foam/issues/487))
- **app:** Fix player muted

### 🔧 Miscellaneous Tasks

- **app:** Refresh agent skills
- **infrastructure:** Slack noti fix
- **infrastructure:** Fix deploy-ota-or-native

## 0.0.39 (Production)

### ♻️ Refactor

- **chat:** Move to v4 stv ([#485](https://github.com/lhowsam/foam/issues/485))

### 🐛 Bug Fixes

- **infrastructure:** OTA runtime version
- **app:** Chat perf + videos
- **app:** Fix unit tests

### 🔧 Miscellaneous Tasks

- **app:** Add hls switch for debugging
- **test:** E2e tests ([#480](https://github.com/lhowsam/foam/issues/480))
- **infrastructure:** Add sentry size analysis
- **app:** Change policy to fingerprint
- **app:** Migrate to husky
- **app:** Update deps
- **app:** Increase test speed
- **infrastructure:** Slack notifications

## ota-0.0.38-27

### 🐛 Bug Fixes

- **infrastructure:** OTA runtime version

### 🔧 Miscellaneous Tasks

- **infrastructure:** Don't pr a changelog

## ota-b578613f-7fd1-4d05-a6fc-10a2c2fff773

### 🐛 Bug Fixes

- **infrastructure:** Improve release notes generation

## ota-1054ebce-6b29-4342-ad1f-030bfca5d82b

### ♻️ Refactor

- **app:** Make reply indicator more minimalist

### ✨ Features

- **app:** Setup deep-linking
- **app:** Integrate video player (webview approach) ([#472](https://github.com/lhowsam/foam/issues/472))

### 🐛 Bug Fixes

- **app:** Fix emotes not loading on init
- **app:** Content classification
- **app:** Scrollable content classification
- **infrastructure:** Fix release
- **infrastructure:** Support all tag formats in git-cliff
- **infrastructure:** Fix release
- **infrastructure:** Fix release
- **infrastructure:** Fix release
- **infrastructure:** Handle empty tag lists in release action

### 🔧 Miscellaneous Tasks

- **app:** Run bunx expo-doctor
- **app:** Patch ts errors in expo-file-system
- **infrastructure:** Optimise jest speed
- **infrastructure:** Optimise jest speed
- **app:** Refresh agents
- **app:** Automate changelog ([#474](https://github.com/lhowsam/foam/issues/474))

## 0.0.38 (Production)

### ✨ Features

- **app:** 7tv paints ([#460](https://github.com/lhowsam/foam/issues/460))
- **app:** Integrate pressto ([#464](https://github.com/lhowsam/foam/issues/464))
- **infrastructure:** Try OTA
- **infrastructure:** Try OTA
- **infrastructure:** Try OTA

### 🐛 Bug Fixes

- **chat:** Load paints on first load ([#462](https://github.com/lhowsam/foam/issues/462))
- **app:** OTA
- **app:** Fix unit tests
- **app:** Fix ci
- **app:** Fix ci
- **infrastructure:** Load secrets properly
- **infrastructure:** Load secrets properly
- **infrastructure:** Load secrets properly

### 🔧 Miscellaneous Tasks

- Tidy up entrypoint
- **app:** Add cursor and clauge instructions
- **app:** Add cursor and clauge instructions
- **app:** Fix OTA updates
- **app:** Testing native update
- **app:** Testing native update
- **app:** Testing OTA

## 0.0.36 (Production)

### ✨ Features

- **infrastructure:** Tidy up release tag

### 🐛 Bug Fixes

- **infrastructure:** OTA
- **infrastructure:** OTA
- **infrastructure:** OTA

## 0.0.37 (Production)

### ♻️ Refactor

- **app:** Remove screen wrapper ([#437](https://github.com/lhowsam/foam/issues/437))
- **app:** Remove screen wrapper ([#438](https://github.com/lhowsam/foam/issues/438))
- **firebase:** Change version format ([#441](https://github.com/lhowsam/foam/issues/441))
- **app:** Tidy up update modal
- **app:** Tidy up update modal
- **app:** Refactor typography ([#448](https://github.com/lhowsam/foam/issues/448))

### ✨ Features

- **app:** Enforce minimum version ([#439](https://github.com/lhowsam/foam/issues/439))
- **chat:** Handle first time messages
- **chat:** Settings menu ([#442](https://github.com/lhowsam/foam/issues/442))
- **app:** Add reply support to chat ([#449](https://github.com/lhowsam/foam/issues/449))
- **app:** Add blocked users screen ([#451](https://github.com/lhowsam/foam/issues/451))
- **infrastructure:** Add experimental ci/cd OTA
- **infrastructure:** Add experimental ci/cd OTA
- **infrastructure:** Add experimental ci/cd OTA
- **infrastructure:** Add experimental ci/cd OTA
- **infrastructure:** Add experimental ci/cd OTA
- **infrastructure:** Add experimental ci/cd OTA
- **infrastructure:** Add experimental ci/cd OTA
- **infrastructure:** Base64 encode google secrets
- **infrastructure:** Push to expo
- **infrastructure:** Push to expo

### 🐛 Bug Fixes

- **chat:** Fix emotes not loading on first load
- **app:** Fix top insets
- **app:** Fix update modal not opening testflight
- **app:** Refactor chat ([#445](https://github.com/lhowsam/foam/issues/445))
- **app:** Remove onPressIn for live streams
- **app:** Prevent tab flicker on intial load

### 🔧 Miscellaneous Tasks

- **chat:** Display welcome message
- **app:** Add firebase debug screen
- **app:** Add firebase debug screen
- **storybook:** Add badge variants
- **app:** Prompt to confirm logout ([#443](https://github.com/lhowsam/foam/issues/443))
- **app:** Add .easignore
- **infrastructure:** Test self hosted runner ([#454](https://github.com/lhowsam/foam/issues/454))

## 0.0.34 (Production)

### ♻️ Refactor

- **app:** Rework error screen

### ✨ Features

- **app:** Settings expansion ([#432](https://github.com/lhowsam/foam/issues/432))
- **app:** Improve profile screen ([#435](https://github.com/lhowsam/foam/issues/435))
- **app:** Improve settings screen ([#436](https://github.com/lhowsam/foam/issues/436))

### 🐛 Bug Fixes

- **app:** Fix runtime errors
- **app:** Fix query error on initial load
- **chat:** Fix initial loading of emotes
- **chat:** Emoji sheet ([#431](https://github.com/lhowsam/foam/issues/431))

### 🔧 Miscellaneous Tasks

- **app:** Fix storybook
- **app:** Install expo-insights

## 0.0.33 (Production)

### ♻️ Refactor

- **app:** Social-app style query provider ([#420](https://github.com/lhowsam/foam/issues/420))

### ⚡ Performance

- **chat:** Refactor to legend state ([#399](https://github.com/lhowsam/foam/issues/399))
- **app:** Remove barrel imports ([#413](https://github.com/lhowsam/foam/issues/413))

### ✨ Features

- **infrastructure:** Setup op sdk ([#390](https://github.com/lhowsam/foam/issues/390))
- **chat:** Handle usernotices ([#391](https://github.com/lhowsam/foam/issues/391))
- **app:** Improve header + main screen styles ([#393](https://github.com/lhowsam/foam/issues/393))
- **app:** Improve header + main screen styles ([#394](https://github.com/lhowsam/foam/issues/394))
- **search:** Improve search screen design ([#395](https://github.com/lhowsam/foam/issues/395))
- **app:** Improve settings screen ([#396](https://github.com/lhowsam/foam/issues/396))
- **app:** Cache images to disk ([#402](https://github.com/lhowsam/foam/issues/402))
- **app:** Convert to native tabs ([#414](https://github.com/lhowsam/foam/issues/414))
- **app:** Add remote config ([#427](https://github.com/lhowsam/foam/issues/427))

### 🐛 Bug Fixes

- **app:** Fix query logic ([#400](https://github.com/lhowsam/foam/issues/400))
- **chat:** Unescape irc message in replies
- **app:** Fix insets ([#415](https://github.com/lhowsam/foam/issues/415))

### 🔧 Miscellaneous Tasks

- **app:** Tidy up rq usage ([#397](https://github.com/lhowsam/foam/issues/397))
- **tooling:** Add hermes release profiler ([#416](https://github.com/lhowsam/foam/issues/416))
- **tooling:** Patch expo-file-system tsc ([#418](https://github.com/lhowsam/foam/issues/418))
- **sentry:** Adjust sentry rates ([#419](https://github.com/lhowsam/foam/issues/419))

## 0.0.32 (Production)

### 🐛 Bug Fixes

- **app:** Improve perf of profilePicture query
- **chat:** Resolve perf issues in chat ([#381](https://github.com/lhowsam/foam/issues/381))

### 🔧 Miscellaneous Tasks

- **ci:** Add deploy-testflight self-hosted workflow
- **ci:** Add deploy-testflight self-hosted workflow
- **ci:** Add deploy-testflight self-hosted workflow
- **ci:** Add deploy-testflight self-hosted workflow
- **ci:** Add deploy-testflight self-hosted workflow
- **ci:** Add deploy-testflight self-hosted workflow
- **infrastructure:** Tidy up ci/cd ([#385](https://github.com/lhowsam/foam/issues/385))

## 0.0.31 (Production)

### 🐛 Bug Fixes

- **app:** Remove barrel imports for services ([#374](https://github.com/lhowsam/foam/issues/374))
- **app:** Tidy up nav structure ([#376](https://github.com/lhowsam/foam/issues/376))
- **app:** Fix loading historical changes on load

### 🔧 Miscellaneous Tasks

- **app:** Add expo-atlas
- Add refined plugin

## 0.0.30 (Production)

### ✨ Features

- **app:** Listen for WS changes in chat ([#364](https://github.com/lhowsam/foam/issues/364))

### 🐛 Bug Fixes

- **app:** Fix permissions
- **app:** Fix xcode build
- **infrastructure:** Fix typo in eas.json

### 🔧 Miscellaneous Tasks

- **infrastructure:** Preview set up
- **infrastructure:** Remove dead code

## 0.0.29 (Production)

### ✨ Features

- **chat:** Improve image caching performance ([#354](https://github.com/lhowsam/foam/issues/354))
- **ci:** Add eas pipeline
- **chat:** Add cachePolicy to images
- **chat:** Add cachePolicy to images
- **app:** Update to expo 54 ([#355](https://github.com/lhowsam/foam/issues/355))
- **chat:** Improve chat layout ([#356](https://github.com/lhowsam/foam/issues/356))

### 🐛 Bug Fixes

- **chat:** Fix and clean up image caching code ([#358](https://github.com/lhowsam/foam/issues/358))

### 🔧 Miscellaneous Tasks

- **app:** Tidy up caching code
- Revert deploy.sh

## 0.0.27 (Production)

### ♻️ Refactor

- **app:** Kebab-case services ([#315](https://github.com/lhowsam/foam/issues/315))

### ✨ Features

- **app:** New splash/app icon ([#316](https://github.com/lhowsam/foam/issues/316))
- **app:** Improve text component heuristics ([#331](https://github.com/lhowsam/foam/issues/331))
- **app:** Redesign V2 ([#339](https://github.com/lhowsam/foam/issues/339))

### 🐛 Bug Fixes

- **security:** Protect auth lambda with api key ([#328](https://github.com/lhowsam/foam/issues/328))

### 🔧 Miscellaneous Tasks

- **documentation:** Update setup docs ([#329](https://github.com/lhowsam/foam/issues/329))

## 0.0.26 (Production)

### ✨ Features

- **app:** Custom switch component ([#313](https://github.com/lhowsam/foam/issues/313))

### 🐛 Bug Fixes

- **app:** Fix safe view flickering

### 🔧 Miscellaneous Tasks

- **app:** Remove auth loading screen ([#314](https://github.com/lhowsam/foam/issues/314))

## 0.0.25 (Production)

### ♻️ Refactor

- **app:** Tidy up entrypoint ([#302](https://github.com/lhowsam/foam/issues/302))

### ✨ Features

- **chat:** Create emoji menu ([#296](https://github.com/lhowsam/foam/issues/296))
- **infrastructure:** Testing ci/cd ([#299](https://github.com/lhowsam/foam/issues/299))
- **infrastructure:** Testing ci/cd ([#300](https://github.com/lhowsam/foam/issues/300))
- **infrastructure:** Testing ci/cd ([#301](https://github.com/lhowsam/foam/issues/301))
- **infrastructure:** Testing ci/cd
- **infrastructure:** Testing ci/cd
- **infrastructure:** Testing ci/cd
- **infrastructure:** Testing ci/cd
- **app:** Add OTA info
- **app:** Add OTA hook
- **app:** Setup background task
- **app:** Setup background task
- **app:** Upgrade to unistyles v3 ([#303](https://github.com/lhowsam/foam/issues/303))

### 🔧 Miscellaneous Tasks

- **tooling:** Migrate to lefthook ([#304](https://github.com/lhowsam/foam/issues/304))
- **tooling:** Update eslint ([#305](https://github.com/lhowsam/foam/issues/305))
- **app:** Remove unused deps ([#309](https://github.com/lhowsam/foam/issues/309))
- **app:** Update deps ([#310](https://github.com/lhowsam/foam/issues/310))
- **app:** Update core RN deps ([#311](https://github.com/lhowsam/foam/issues/311))

## 0.0.24 (Production)

### ✨ Features

- **chat:** Chat wrap up tasks ([#288](https://github.com/lhowsam/foam/issues/288))
- **docs:** Improve readme
- **docs:** Improve readme

### 🐛 Bug Fixes

- **app:** Fix diagnostics screen
- **chat:** Improve sheet typography

## 0.0.23 (Production)

### ✨ Features

- **app:** Add start activity module ([#283](https://github.com/lhowsam/foam/issues/283))

### 🔧 Miscellaneous Tasks

- Update .gitignore

## 0.0.22 (Production)

### ✨ Features

- **chat:** Chat other tasks ([#257](https://github.com/lhowsam/foam/issues/257))

### 🐛 Bug Fixes

- **scripts:** Add exec perms to deploy

### 🔧 Miscellaneous Tasks

- Fix eas build
- Fix eas build
- Fix build
- Fix build
- **docs:** Update .env.example

## 0.0.21 (Production)

### ✨ Features

- **app:** Chat parsing

### 🐛 Bug Fixes

- **infrastructure:** Install node.js OTA
- **app:** Fix app variant config

### 🔧 Miscellaneous Tasks

- **infrastructure:** Add OTA ci/cd

## 0.0.20 (Production)

### ✨ Features

- **ui:** Add style helpers
- **streams:** Improve chat ui
- **app:** Cleanup nav structure

### 🐛 Bug Fixes

- **app:** Lock orientation on certain screens

### 🔧 Miscellaneous Tasks

- **app:** Lock orientation on search
- **app:** Compress images
- **app:** Compress Images

## 0.0.19 (Production)

### ✨ Features

- **app:** Add react-query devtools

## 0.0.18 (Production)

### 🐛 Bug Fixes

- **app:** Fix toasts + settings modal

### 🧪 Testing

- **auth:** Improve auth tests

## 0.0.17 (Production)

### 🔧 Miscellaneous Tasks

- **app:** Refactor online manager

## 0.0.16 (Production)

### ✨ Features

- **app:** Add cheaper deploy workflow

### 🐛 Bug Fixes

- **app:** Fix auth ctx persistence issues

## 0.0.15 (Production)

### 🐛 Bug Fixes

- **app:** Fix auth crashes

## 0.0.14 (Production)

### ✨ Features

- **app:** Add diangostics table
- **app:** Add sooner notifications + auth ctx fix

### 🧪 Testing

- **ci:** Test alternate ci/cd workflow
- **ci:** Test alternate ci/cd workflow
- **ci:** Test alternate ci/cd workflow
- **ci:** Test alternate ci/cd workflow
- **ci:** Test alternate ci/cd workflow
- **ci:** Test alternate ci/cd workflow
- **ci:** Test alternate ci/cd workflow
- **ci:** Test alternate ci/cd workflow
- **ci:** Test alternate ci/cd workflow

## 0.0.13 (Production)

### ♻️ Refactor

- **app:** Settings screen
- **app:** Settings screen

### 🐛 Bug Fixes

- **app:** More debugging for auth issues
- **app:** Cleanup warnings

### 🔧 Miscellaneous Tasks

- **app:** Debug auth issues
- **app:** Debug auth issues

## 0.0.12 (Production)

### 🔧 Miscellaneous Tasks

- **app:** Debug auth

## 0.0.11 (Production)

### 🐛 Bug Fixes

- **app:** Speculative crash fix around fonts

## 0.0.9 (Production)

### ✨ Features

- **app:** Add nr logging
- **app:** Nr log
- **app:** Nr log

### 🐛 Bug Fixes

- **app:** Comment out fb

## 0.0.8 (Production)

### 🐛 Bug Fixes

- **app:** Fix crash on start

## 0.0.7 (Production)

### 🔧 Miscellaneous Tasks

- **app:** Debug release
- **app:** Debug release
- **app:** Debug release

## 0.0.6 (Production)

### 🔧 Miscellaneous Tasks

- **app:** Debug release

## 0.0.5 (Production)

### 🐛 Bug Fixes

- **app:** Navigation state in prod

## 0.0.4 (Production)

### ✨ Features

- **app:** Debug screen

## 0.0.3 (Production)

### 🐛 Bug Fixes

- **app:** Fix commmitlint

## 0.0.2 (Production)

### 🔧 Miscellaneous Tasks

- **app:** Gs services file

## 0.0.1 (Production)

### ♻️ Refactor

- **app:** Refactor landscape utils
- **app:** Use @tamagui/lucide-icons in favor of @expo/vector-icons
- **app:** Re-work project structure

### ✨ Features

- **app:** Add deps
- **app:** Setup base apis
- **app:** Finish setting up requires api services
- **ci:** Add initial build CI
- **app:** Setup basic routing
- **app:** Add additional methods to twitchService
- **app:** Add additional methods to twitchService
- **app:** Setup global themeing
- **app:** Enhance navigation
- **app:** Base design system
- **app:** Authenticate with Twitch API
- **app:** Authenticate with Twitch API
- **app:** Search screen
- **app:** General Following style improvements
- **app:** Add bottom modal for logout on settings
- **app:** Add bottom modal for logout on settings
- **infra:** Add build-prerelease.yml
- **infra:** Add build-prerelease.yml
- **app:** Faster images with expo-image
- **app:** Base live stream screen
- Add kodiak
- **app:** Cleanup package.json
- **app:** Update README
- **ci:** Add previews to PRs
- **app:** Add release workflows
- **app:** Design system
- **app:** Convert following screen to react-query
- **app:** Add basic chat
- **app:** Style home bottom tabs
- **app:** Add new relic logging
- **app:** Browse categories screen
- **app:** Handle screen orientation changes
- **app:** Tamagui theming
- **app:** Connect to chat when streamer is offline
- **app:** Add utility components
- **app:** Add carousel components
- **app:** Support dark mode
- **app:** Replace activity indicators with custom tamagui spinners
- **app:** Support absolute imports
- **app:** Search on dark mode
- **app:** Support parsing of 7tv and twitch emotes
- **app:** Convert to turborepo + pnpm workspace monorepo
- **ci:** Cache deps
- **ci:** Setup remote caching with turbo repo
- **app:** Animated emote support
- **app:** Update dependencies
- **app:** Improve styling of chat message
- **app:** Convert to bare RN styles
- **app:** Ui cleanup
- **app:** Base chat component
- **app:** Chat integration
- **app:** Design system
- **app:** Add retry functionality to failed requests
- **app:** Swipe up to refetch
- **app:** Cursor based pagination
- **app:** Stack stream layout
- **app:** Settings screen enhancement
- **app:** Migrate to app config
- **app:** Add styling to bar bar
- **chat:** Improve chat message styling
- **infra:** Add deploy ci/cd
- **infra:** Add eas build profiles
- **app:** Offline view
- **chat:** Enhance chat styling + parsing
- **ci:** Deploy to test flight

### 🐛 Bug Fixes

- **app:** Fix getTopStreams query
- **app:** Fix majority of ts errors
- **app:** Add ScrollView to follow, top & search screens
- **app:** Fix key warnings on search screen
- **ci:** Fix running previews on push
- **app:** Fix tag styling on dark mode
- **app:** Fix stream info styling
- **app:** Fix padding on top screens
- **app:** Fix startup metro issues
- **app:** Fix startup errors
- **app:** Design + auth fixes
- **app:** Duplicate setting of search state
- **app:** Improve project structure + chat
- **infra:** Fix deploy infra
- **infra:** Fix deploy workflow
- **ci:** Correct owner ID
- **ci:** Only deploy to test-flight

### 👷 CI/CD

- **security:** Add codeql workflows

### 📚 Documentation

- Add README
- **app:** Update README
- **app:** Update readme and contributing guides

### 📝 Other Changes

- Initial commit
- --wip-- [skip ci]
- --wip-- [skip ci]
- --wip-- [skip ci]
- Create dependabot.yml
- Update dependabot.yml

### 📦 Dependencies

- **deps:** Bump axios from 1.5.1 to 1.6.4

### 🔧 Miscellaneous Tasks

- **app:** Add .gitkeep files
- **app:** Add util and setup unit tests
- Add postman collection to project
- **ci:** Remove build step
- **ci:** Remove build step
- **app:** Remove tamagui
- **app:** Remove unused dependencies
- **app:** Add debug tools
- **app:** Remove react-native-fast-image due to xcode issues
- Create LICENSE
- **app:** Cleanup files
- **app:** Add dependabot
- **app:** Remove dependabort
- **app:** Remove dependabort
- **app:** Remove dependabort
- **app:** General cleanup
- **app:** General cleanup
- **app:** General cleanup
- **app:** General cleanup
- **app:** General cleanup
- **app:** Update oauth scopes
- **app:** General cleanup
- **app:** General cleanup
- **app:** Cleanup tamagui types
- **app:** Update dependencies
- **app:** Update readme
- **app:** Ignore turborepo
- **app:** Update readme
- **docs:** Update README notes on oauth
- **app:** Remove unused files
- **docs:** Update README
- **docs:** Update README
- **app:** Util to delete tokens
- **app:** Update deps
- **app:** Update pnpm
- **infrastructure:** Run clear-cache every month
- **tooling:** Update deps
- **documentation:** Update readme
- **infrastructure:** Update actions
- **documentation:** Update readme
- **app:** Update build details alignment
- **ci:** Disable build workflows
- **app:** Run expo-doctor

### 🧪 Testing

- **app:** Add missing util unit tests
