# Changelog

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
## 0.0.39

### ♻️ Refactor

- **chat:** Move to v4 stv ([#485](https://github.com/lhowsam/foam/issues/485))

### 🐛 Bug Fixes

- **infrastructure:** Ota runtime version
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

- **infrastructure:** Ota runtime version

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
## 0.0.38

### ✨ Features

- **app:** 7tv paints ([#460](https://github.com/lhowsam/foam/issues/460))
- **app:** Integrate pressto ([#464](https://github.com/lhowsam/foam/issues/464))
- **infrastructure:** Try ota
- **infrastructure:** Try ota
- **infrastructure:** Try ota

### 🐛 Bug Fixes

- **chat:** Load paints on first load ([#462](https://github.com/lhowsam/foam/issues/462))
- **app:** Ota
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
- **app:** Fix ota updates
- **app:** Testing native update
- **app:** Testing native update
- **app:** Testing ota
## 0.0.36

### ✨ Features

- **infrastructure:** Tidy up release tag

### 🐛 Bug Fixes

- **infrastructure:** Ota
- **infrastructure:** Ota
- **infrastructure:** Ota
## 0.0.37

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
- **infrastructure:** Add experimental ci/cd ota
- **infrastructure:** Add experimental ci/cd ota
- **infrastructure:** Add experimental ci/cd ota
- **infrastructure:** Add experimental ci/cd ota
- **infrastructure:** Add experimental ci/cd ota
- **infrastructure:** Add experimental ci/cd ota
- **infrastructure:** Add experimental ci/cd ota
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
## 0.0.34

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
## 0.0.33

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
## 0.0.32

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
## 0.0.31

### 🐛 Bug Fixes

- **app:** Remove barrel imports for services ([#374](https://github.com/lhowsam/foam/issues/374))
- **app:** Tidy up nav structure ([#376](https://github.com/lhowsam/foam/issues/376))
- **app:** Fix loading historical changes on load

### 🔧 Miscellaneous Tasks

- **app:** Add expo-atlas
- Add refined plugin
## 0.0.30

### ✨ Features

- **app:** Listen for WS changes in chat ([#364](https://github.com/lhowsam/foam/issues/364))

### 🐛 Bug Fixes

- **app:** Fix permissions
- **app:** Fix xcode build
- **infrastructure:** Fix typo in eas.json

### 🔧 Miscellaneous Tasks

- **infrastructure:** Preview set up
- **infrastructure:** Remove dead code
## 0.0.29

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
## 0.0.27

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
## 0.0.26

### ✨ Features

- **app:** Custom switch component ([#313](https://github.com/lhowsam/foam/issues/313))

### 🐛 Bug Fixes

- **app:** Fix safe view flickering

### 🔧 Miscellaneous Tasks

- **app:** Remove auth loading screen ([#314](https://github.com/lhowsam/foam/issues/314))
## 0.0.25

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
- **app:** Add ota info
- **app:** Add ota hook
- **app:** Setup background task
- **app:** Setup background task
- **app:** Upgrade to unistyles v3 ([#303](https://github.com/lhowsam/foam/issues/303))

### 🔧 Miscellaneous Tasks

- **tooling:** Migrate to lefthook ([#304](https://github.com/lhowsam/foam/issues/304))
- **tooling:** Update eslint ([#305](https://github.com/lhowsam/foam/issues/305))
- **app:** Remove unused deps ([#309](https://github.com/lhowsam/foam/issues/309))
- **app:** Update deps ([#310](https://github.com/lhowsam/foam/issues/310))
- **app:** Update core RN deps ([#311](https://github.com/lhowsam/foam/issues/311))
## 0.0.24

### ✨ Features

- **chat:** Chat wrap up tasks ([#288](https://github.com/lhowsam/foam/issues/288))
- **docs:** Improve readme
- **docs:** Improve readme

### 🐛 Bug Fixes

- **app:** Fix diagnostics screen
- **chat:** Improve sheet typography
## 0.0.23

### ✨ Features

- **app:** Add start activity module ([#283](https://github.com/lhowsam/foam/issues/283))

### 🔧 Miscellaneous Tasks

- Update .gitignore
## 0.0.22

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
## 0.0.21

### ✨ Features

- **app:** Chat parsing

### 🐛 Bug Fixes

- **infrastructure:** Install node.js OTA
- **app:** Fix app variant config

### 🔧 Miscellaneous Tasks

- **infrastructure:** Add OTA ci/cd
## 0.0.20

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
## 0.0.19

### ✨ Features

- **app:** Add react-query devtools
## 0.0.18

### 🐛 Bug Fixes

- **app:** Fix toasts + settings modal

### 🧪 Testing

- **auth:** Improve auth tests
## 0.0.17

### 🔧 Miscellaneous Tasks

- **app:** Refactor online manager
## 0.0.16

### ✨ Features

- **app:** Add cheaper deploy workflow

### 🐛 Bug Fixes

- **app:** Fix auth ctx persistence issues
## 0.0.15

### 🐛 Bug Fixes

- **app:** Fix auth crashes
## 0.0.14

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
## 0.0.13

### ♻️ Refactor

- **app:** Settings screen
- **app:** Settings screen

### 🐛 Bug Fixes

- **app:** More debugging for auth issues
- **app:** Cleanup warnings

### 🔧 Miscellaneous Tasks

- **app:** Debug auth issues
- **app:** Debug auth issues
## 0.0.12

### 🔧 Miscellaneous Tasks

- **app:** Debug auth
## 0.0.11

### 🐛 Bug Fixes

- **app:** Speculative crash fix around fonts
## 0.0.9

### ✨ Features

- **app:** Add nr logging
- **app:** Nr log
- **app:** Nr log

### 🐛 Bug Fixes

- **app:** Comment out fb
## 0.0.8

### 🐛 Bug Fixes

- **app:** Fix crash on start
## 0.0.7

### 🔧 Miscellaneous Tasks

- **app:** Debug release
- **app:** Debug release
- **app:** Debug release
## 0.0.6

### 🔧 Miscellaneous Tasks

- **app:** Debug release
## 0.0.5

### 🐛 Bug Fixes

- **app:** Navigation state in prod
## 0.0.4

### ✨ Features

- **app:** Debug screen
## 0.0.3

### 🐛 Bug Fixes

- **app:** Fix commmitlint
## 0.0.2

### 🔧 Miscellaneous Tasks

- **app:** Gs services file
## 0.0.1

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
- **infra:** Add eas  build profiles
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

