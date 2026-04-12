# Foam mobile app

A new way to experience Twitch.tv on mobile

## Why?

To improve my React native skills and learn various other tech

The native Twitch app experience doesn't quite line up with the desktop experience and it lacks support for third-party extensions that many people use to express themselves in chat. This project aims to be a mobile alternative that supports these extensions and provides a cleaner and more intuitive UI.

# Table of contents

- [Foam mobile app](#foam-mobile-app)
- [Why](#why)
- [Table of contents](#table-of-contents)
- [Project structure](#project-structure)
- [Store links](#store-links)
- [Features](#features)
- [Getting started](#getting-started)
- [Contributing](#contributing)
- [CI/CD](#cicd)
- [Release process](#release-process)
- [Testers management](#testers-management)
- [Debugging](#debugging)
- [Managing access to the project and associated services](#managing-access-to-the-project-and-associated-services)
- [API dependencies](#api-dependencies)
- [Markdown writing guide](#markdown-writing-guide)
- [Bug reports](#bug-reports)

# Project structure

This is a [React Native app](https://reactnative.dev). This repository powers the mobile app and several [Expo app variants](https://docs.expo.dev/tutorial/eas/multiple-app-variants/) (see [`app.config.ts`](app.config.ts)):

1. **`production`** — TestFlight / Play internal testing today, with a path toward full store releases.
2. **`preview`** — Internal distribution builds for sharing work in progress.
3. **`development`** — Local development and dev-client installs.
4. **`e2e`** (and related Maestro profiles) — Deterministic UI tests with a mock server.

Each variant uses different iOS bundle identifiers and Android application ids so multiple builds can be installed on one device.

Core dependencies:

| Library                                          | Category                       | Version | Description                                             |
| ------------------------------------------------ | ------------------------------ | ------- | ------------------------------------------------------- |
| [bun](https://bun.sh/)                           | Package manager & node runtime | 1.3.5 ([`.bun-version`](.bun-version)) | Fast package manager and Node-compatible runtime        |
| [React Native](https://reactnative.dev/)         | Mobile framework               | 0.81.5  | Cross-platform mobile framework                         |
| [React](https://react.dev/)                      | UI framework                   | 19.1.0  | Most popular UI framework worldwide                     |
| [TypeScript](https://www.typescriptlang.org/)    | Language                       | 5.9.2   | Static typechecking                                     |
| [Expo](https://expo.dev/)                        | SDK                            | ~54.0.33 | React Native framework / Expo modules                   |
| [React Navigation](https://reactnavigation.org/) | Navigation                     | 7.x     | Routing and navigation library                          |
| [Maestro](https://maestro.mobile.dev/)           | E2E testing                    | 1.40.1  | Declarative UI testing                                  |
| [EAS](https://expo.dev/eas)                      | CI/CD                          | N/A     | Build the app binaries and submit the app to the stores |
| [Storybook](https://storybook.js.org/)           | UI preview                     | 8.4.4   | UI development & preview tool for React Native          |

Additional inspiration on how this project is structured is coming from: [Obytess React Native Starter](https://starter.obytes.com/), [Aetherspace Green Stack Starter](https://github.com/Aetherspace/green-stack-starter-demo#readme), [online docs as Storybook website](https://main--62c9a236ee16e6611d719e94.chromatic.com/?path=/story/aetherspace-quickstart--page), [Infinite Red cookbook for React Native](https://ignitecookbook.com/).

## Store links

TBA

## Features

TBA

# Getting started

You will need the following in order to run the project locally:

- [Node.js](https://nodejs.org/en/)
- [NVM](https://github.com/nvm-sh/nvm)
- [Xcode](https://developer.apple.com/xcode/)
- [Android Studio](https://developer.android.com/studio)
- [bun](https://bun.sh/)

See [Expo React Native project](https://docs.expo.dev/get-started/set-up-your-environment/), on how to prepare your environment first. (For more-in-depth understanding of React Native projects navigate to [React Native docs](https://reactnative.dev/) and [Expo docs](https://docs.expo.dev/)).

1. Clone this repository

- `git clone https://github.com/luke-h1/foam`

2. Install `bun`

- ```bash
    version=$(cat .bun-version)
    curl -fsSL "https://bun.sh/install" | bash -s "bun-v$version"
  ```

3. Ensure you're on the correct Node version

- ```bash
  nvm use
  nvm install
  ```

4. Install dependencies

- `cd foam`
- `bun install`

5. Acquire Twitch API credentials

- Create a Twitch account if you do not have one already
- Enable 2FA on your account otherwise you'll not be able to create apps via the developer console
- Go to the [Twitch developer console](https://dev.twitch.tv/console/apps/create) and create a new application. Your OAUTH redirect settings need to look like the following (in order for it to work with the authentication proxy):

<img src='.github/docs/twitch-settings.png' alt='Twitch app settings' />

- Copy the client ID and client secret and paste them into a `.env` file in the root of the project. See `.env.example` for an example of what this file should look like

- If you're on Linux or windows, you'll need to setup Android studio and install a device to run the app.

- If you're on Mac you can just use the iOS simulator (via Xcode) to run the app

6. Start the proxy server
   The proxy server is responsible for proxying authentication requests to Twitch. This is due to a new requirement where Twitch do not let you proxy non `http` URLs. Locally this is just a simple Express server for developer convenience. In TestFlight, TestTrack and production, an AWS lambda backed by API gateway is responsible for performing this proxying.

- `bun run start:proxy`

7. Install development build on your simulator

- `bun run prebuild`

8. Run the app

- `bun run ios`
- `bun run android`

## Recommended dev environment

1. Mac - due to being able to run xcode and android simultaneously

_IOS_:

- Any IOS commands requires Xcode to be installed.
  - A simulator must be preconfigured in Xcode settings.
    - if no iOS versions are available, install the iOS runtime at `Xcode > Settings > Platforms`.
    - if the simulator download keeps failing you can download it from the developer website.
      - [Apple Developer](https://developer.apple.com/download/all/?q=Simulator%20Runtime)
      - `sudo xcode-select -s /Applications/Xcode.app`
      - `xcodebuild -runFirstLaunch`
      - `xcrun simctl runtime add "~/Downloads/iOS_17.4_Simulator_Runtime.dmg"` (adapt the path to the downloaded file)
  - In addition, ensure Xcode Command Line Tools are installed using `xcode-select --install`.
- Expo will require you to configure Xcode Signing. We use automatic signing which let's expo deal with the signing so we don't have to do it manually.
- Make sure you do have automatic signing setup properly. Open the project in xcode (`cd ios && xed .`) > select the project > Signing & Capabilities > check `Automatically manage signing` and select a team + unique bundle identifier

_Android_:

- Install "Android Studio"
  - Make sure you have the Android SDK installed (Android Studio > Tools > Android SDK).
    - In "SDK Platforms": "Android x" (where x is Android's current version).
    - In "SDK Tools": "Android SDK Build-Tools" and "Android Emulator" are required.
    - Add `export ANDROID_HOME=/Users/<your_username>/Library/Android/sdk` to your `.zshrc` or `.bashrc` (and restart your terminal).
  - Setup an emulator (Android Studio > Tools > Device Manager).

## Tips

- To run on your phone (ensure connected via a cable) add `-- --device` to your command (i.e. `bun run ios -- --device`).
- If the Android simulator frequently hangs or is very slow, [bump its memory limit](https://stackoverflow.com/a/40068396)

## Running `development` version of the app locally

In order to run the `development` variant of the app locally you will need to run:

1. `bun run prebuild` - prebuilds the native part of the app (generates `ios` & `android` folders)
2. `bun run ios` - Builds the native part of the app & runs it on iOS
3. `bun run android` - Builds the native part of the app and runs it on Android
4. `bun run start` - once the native part of the project is installed on the emulator/simulator/your physical device you can run the JS metro server
   - this will start the JS server that bundles and serves a hot-reloaded version of the JS app
   - JS server will start automatically when running `bun run ios` or `bun run android`

## Storybook

Storybook is currently configured to preview UI components on app. Eventually the plan is to deploy this storybook somewhere on web

> [!WARNING]
> If you add a new `.stories.tsx` file, you need to run `bun run storybook:generate` to re-generate the list of all available stories.

## Running `production` variant of the app locally

To run the `production` variant of the app locally, you'll need to follow these steps. This is useful for testing the production build configuration, verifying store-ready builds, or debugging production-specific issues.

> [!WARNING]
> The production variant uses different bundle identifiers and package names, so it can be installed alongside the development version on the same device.

### Prerequisites

1. **Environment Setup**: Ensure you have all the development environment requirements from the [Getting started](#getting-started) section
2. **Production Credentials**: You'll need production-specific credentials and configuration files:
   - Production Google Services files (`GoogleService-Info-prod.plist` for iOS, `google-services-prod.json` for Android)
   - Production environment variables in your `.env` file
   - Valid Apple Developer account and signing certificates for iOS

### Steps

1. **Set up production environment variables**

   Ensure your `.env` file contains the correct values

2. **Start the proxy server** (if needed for local testing and not using the auth proxy lambda)

   ```bash
   bun run start:proxy
   ```

3. **Run the production app**

   **For iOS:**

   ```bash
   bun run ios:production
   ```

   **For Android:**

   ```bash
   bun run android:production
   ```

   These commands will:
   - Build the native app with production configuration
   - Install it on your simulator/device
   - Start the Metro bundler for the JavaScript code

### Alternative: Using EAS Build for Local Testing

If you want to test the exact production build that would be submitted to the stores, you can use EAS Build:

1. **Build locally with EAS**

   ```bash
   # For iOS
   eas build --profile production --platform ios --local

   # For Android
   eas build --profile production --platform android --local
   ```

2. **Install the built app**

   The built `.ipa` (iOS) or `.apk` (Android) files will be in the `builds/` directory and can be installed on your device.

### Troubleshooting

- **Bundle identifier conflicts**: If you get signing errors, ensure your Apple Developer account has the production bundle identifier (`foam-tv`) registered
- **Missing credentials**: Verify all production Google Services files are present and valid
- **Environment variables**: Double-check that all required production environment variables are set correctly
- **Build failures**: Check the EAS build logs for detailed error information

### Key Differences from Development

- Uses production bundle identifier (`foam-tv` for iOS, `com.lhowsam.foam` for Android)
- App name shows as "Foam" (without dev suffix)
- No development badge on the app icon
- Uses production API endpoints and credentials
- Optimized for performance and store submission

## Running `preview` variant locally

Use the same prerequisites as production (correct Google services files, env vars, signing), but point at the **preview** Firebase / config files from [`app.config.ts`](app.config.ts) (`GoogleService-Info-preview.plist`, `google-services-preview.json`). Then run with `APP_VARIANT=preview`, for example:

```bash
APP_VARIANT=preview expo run:ios
APP_VARIANT=preview expo run:android
```

For store-parity binaries, use `eas build --profile preview` (cloud or `--local`) as in [Local EAS build](#local-eas-build).

# Contributing

## Commit strategy - conventional commits

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. [Husky](https://github.com/typicode/husky) is used to execute scripts according to git hooks in order to test if a developer is following the various linting rules and conventional commits. Run `bun commit` to start an interactive commit. Please familiarize yourself with the [specification](https://www.conventionalcommits.org/en/v1.0.0/#specification).

Example:

```
feat(chat): improve readability of username
chore(deps): update `react-native` to `0.80.0`
fix(streams): fix crash on `LiveStreamScreen`
```

## Git flow & pull requests

1. For every change, create a new branch from `main`
2. Use conventional commits for your commits and other good practices to help ease the review process
3. Open a PR against `main` & title it using the pattern mentioned in [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
   - Provide a proper description of the changes
   - Include some screenshots/videos of the change if applicable
   - Ensure to test your changes on a physical device as sometimes the simulator works but on a real device it breaks

4. Assign a reviewer to the PR
5. After the PR is approved & the checks pass, merge it to `main`
6. Merging to `main` runs [`deploy-ota-or-native.yml`](.github/workflows/deploy-ota-or-native.yml), which publishes a production [EAS Update](https://docs.expo.dev/eas-update/introduction/) when native fingerprints are unchanged, or builds and submits store binaries when native code changes (see [Deploy flows](#deploy-flows)). For ad-hoc **preview** or **production** cloud builds without going through that pipeline, use the manual workflow [`eas-deploy.yml`](.github/workflows/eas-deploy.yml) in GitHub Actions.

## Import aliases

We use [tsconfig-paths](https://github.com/dividab/tsconfig-paths) to alias imports.

## dev-builds

Sometimes you may want to run the app on your device to check your changes, see how it looks on a real device etc. In order to do this you need to run some steps to configure your device for the first time.

1. Connect your phone via cable to your laptop/machine (you must ensure both devices are on the same network, otherwise this will not work.). Make sure to trust the phone/laptop when prompted.

2. Open the project in Xcode: `cd ios && xed .` Make sure to login to xcode if you haven't already

3. Your phone will then pair + connect to xcode. Let that complete

4. When prompted select the project and click the 'hide code' button in the top-right

5. Navigate to signing & capabilities

6. Select your team, ensure the bundle identifier matches the dev variant (for example `foam-tv-dev` from [`app.config.ts`](app.config.ts), or another unique id) and select your device from the dropdown `Foam > YourPhoneName`

7. Run a build by clicking the play button

8. The app will then install on your device and run. Hot reloading will also work

If you get an error such as `no development servers found` then this means the laptop and/or phone is on a different network.

# CI/CD

## CI

Pull requests run checks in [`.github/workflows/`](.github/workflows/):

| Workflow | Purpose |
| -------- | ------- |
| [`typescript.yml`](.github/workflows/typescript.yml) | `bun run ts:check` |
| [`lint.yml`](.github/workflows/lint.yml) | ESLint (`bun run lint`) |
| [`prettier.yml`](.github/workflows/prettier.yml) | Prettier (`bun run prettier:check`) |
| [`cz.yml`](.github/workflows/cz.yml) | Commitlint on the latest commit |
| [`jest.yml`](.github/workflows/jest.yml) | Jest (see workflow for the exact command) |
| [`detect-fp-changes.yml`](.github/workflows/detect-fp-changes.yml) | Compares Expo native fingerprints for `production` and `preview` against the PR base |
| [`label.yml`](.github/workflows/label.yml) | Applies labels via [labeler](https://github.com/actions/labeler) |
| [`tsfixme-progress.yml`](.github/workflows/tsfixme-progress.yml) | Tracks `$TSFixMe` progress on PRs to `main` |
| [`self-hosted-runner.yml`](.github/workflows/self-hosted-runner.yml) | Optional ESLint on the `foam` runner when the PR has the `self-hosted-test` label |

Scheduled [CodeQL](.github/workflows/codeql.yml) runs weekly on the default branch.

```mermaid
flowchart LR
  PR[Pull request] --> TS[typescript.yml]
  PR --> Lint[lint.yml]
  PR --> Prettier[prettier.yml]
  PR --> CZ[cz.yml]
  PR --> Jest[jest.yml]
  PR --> FP[detect-fp-changes.yml]
  PR --> Label[label.yml]
  PR --> TSFix[tsfixme-progress.yml]
  PR -->|label self-hosted-test| SH[self-hosted-runner.yml]
```

## CD

We use [EAS](https://docs.expo.dev/build-reference/eas/) to build, submit, and ship [EAS Update](https://docs.expo.dev/eas-update/introduction/) payloads.

There are three installable [variants](https://docs.expo.dev/tutorial/eas/multiple-app-variants/) today (each has distinct iOS bundle id and Android application id so they can sit side by side on one device):

1. **`production`** — TestFlight / Play internal testing today; store profiles live in [`eas.json`](eas.json) (`production` build profile, `production` update channel).
2. **`preview`** — Internal distribution builds for trying changes from branches/PRs (`preview` profile and channel). iOS devices must be [registered for ad hoc](https://docs.expo.dev/build/internal-distribution/) builds.
3. **`development`** — Local dev and dev-client installs only (`development` profile); not distributed from CI.

Additional build profiles (for example `e2e`, `e2e-dev`) are used for Maestro and CI; see [`eas.json`](eas.json).

## Deploy flows

Production delivery is mostly automated on the default branch; preview/store-style builds can still be kicked off by hand.

| Workflow | When | What it does |
| -------- | ---- | ------------- |
| [`deploy-ota-or-native.yml`](.github/workflows/deploy-ota-or-native.yml) | Push to `main`, or **Run workflow** with optional `deploy_type` / `platform` / `dry_run` | Runs tests, compares [native fingerprints](https://docs.expo.dev/eas-update/fingerprint/) to the last cached values, then either runs **`eas update`** on the `production` channel (JS-only) or **`eas build --local`** + **`eas submit`** for iOS/Android (native change). Creates a GitHub Release and can notify Slack. Needs `EXPO_TOKEN`, `GITHUB_TOKEN`, `OP_SERVICE_ACCOUNT_TOKEN` (1Password secrets for env files, Google services plist/json, Sentry, Slack, etc.). |
| [`eas-deploy.yml`](.github/workflows/eas-deploy.yml) | **Run workflow** only | Cloud EAS build + auto-submit for **`production`** or **`preview`**, per chosen platform (`all` / `ios` / `android`). Uses `bun run build:<variant>:ios|android`. Requires `EXPO_TOKEN`. |
| [`rollout-ota.yml`](.github/workflows/rollout-ota.yml) | **Run workflow** | Progresses staged rollout percentage for an existing update group (`eas update:edit --rollout-percentage`). |
| [`rollback-ota.yml`](.github/workflows/rollback-ota.yml) | **Run workflow** | Rolls the `production` or `preview` channel back to **`embedded`** (native bundle) or **republishes** a previous update group. |
| [`e2e.yml`](.github/workflows/e2e.yml) | **Run workflow** | Fingerprinted iOS `e2e` profile build (local EAS on the self-hosted `foam` runner when the cache misses), artifact or cache restore, optional `eas update` on the `e2e` channel when the build is skipped, then Maestro on `macos-latest` (see workflow for full steps). |
| [`clear-cache.yml`](.github/workflows/clear-cache.yml) | **Run workflow** | Deletes GitHub Actions caches except OTA fingerprint / OTA id keys (see script in workflow). |

There is also a draft [EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/) file at [`.eas/deploy-prod.yml`](.eas/deploy-prod.yml) (mostly commented / experimental); **GitHub Actions above are the source of truth** for how this repo deploys today.

### Default branch: native build vs OTA

```mermaid
flowchart TD
  A[Push to main] --> P[prepare version from app.config.ts]
  A --> T[bun run test:ci and ts:check]
  P --> D[detect-changes fingerprints]
  T --> D
  D -->|fingerprint changed or force build| B[build local EAS production + submit stores]
  D -->|fingerprint unchanged or force OTA| U[eas update production channel]
  B --> R[release GitHub tag and changelog]
  U --> R
  R --> S[Slack notify]
```

### Manual EAS deploy (preview or production)

```mermaid
flowchart LR
  H[GitHub Actions eas-deploy.yml] --> C[Choose variant production or preview]
  C --> PL[Choose platform all ios android]
  PL --> E[bun run build variant platform]
  E --> EAS[EAS cloud build and auto-submit]
```

### OTA rollout and rollback

```mermaid
flowchart TD
  subgraph rolloutWf["rollout-ota.yml"]
    R1[Inputs update group id and target percent] --> R2[eas update:edit rollout percentage]
  end
  subgraph rollbackWf["rollback-ota.yml"]
    B1{rollback target}
    B1 -->|embedded| B2[eas update:roll-back-to-embedded per platform]
    B1 -->|group id| B3[eas update:republish to channel]
  end
```

## E2E testing

We use [Maestro](https://maestro.mobile.dev/) for E2E testing. Tests run against a mock server for deterministic results.

### Quick start (dev client - recommended for local dev)

Uses a development build with Metro for hot reload during test development:

```bash
# Install Maestro (one-time)
curl -Ls "https://get.maestro.mobile.dev" | bash

# Build the E2E dev client (one-time, or when native code changes)
bun run e2e:dev:ios

# Run tests (three terminals)
bun run e2e:mock-server:dev                           # Terminal 1: Mock server
APP_VARIANT=e2e npx expo start --dev-client --localhost  # Terminal 2: Metro
bun run maestro:test                                  # Terminal 3: Tests
```

### Standalone build (for CI)

Creates a self-contained app with bundled JS - no Metro needed:

```bash
# Build standalone E2E app
bun run e2e:build:ios

# Run tests (two terminals)
bun run e2e:mock-server:dev  # Terminal 1
bun run maestro:test         # Terminal 2
```

### Commands

| Command                       | Description                          |
| ----------------------------- | ------------------------------------ |
| `bun run e2e:dev:ios`         | Build dev client (local development) |
| `bun run e2e:build:ios`       | Build standalone app (CI)            |
| `bun run e2e:build:android`   | Build standalone app (Android)       |
| `bun run maestro:test`        | Run all tests                        |
| `bun run maestro:test:smoke`  | Run smoke tests only                 |
| `bun run maestro:studio`      | Interactive test editor              |
| `bun run e2e:mock-server:dev` | Start mock server (auto-reload)      |

### OTA updates for E2E

The standalone E2E app supports OTA updates via the `e2e` channel, eliminating the need to rebuild for JS-only changes:

```bash
# Push JS update to E2E builds (no native rebuild needed)
eas update --channel e2e --message "Fix E2E test"
```

Only rebuild (`bun run e2e:build:ios`) when native code changes. Use fingerprinting to detect this automatically in CI.

### Build caching (EAS)

Local builds use EAS build caching to speed up `npx expo run:ios/android`. Builds are cached by fingerprint and reused when native code hasn't changed.

**How it works:**

- On `npx expo run:ios`, Expo checks EAS for a cached build matching the project fingerprint
- If found, downloads and uses it (skips compilation)
- If not found, compiles normally and uploads to EAS for future runs

No setup required - just ensure you're logged in with `eas login`.

## Local EAS build

Use this when you want binaries on your machine (parity with CI) or to avoid queue wait during iteration. Requires [EAS CLI](https://docs.expo.dev/build/setup/) and `eas login`.

```bash
# Cloud build (wait for Expo builders)
eas build --profile production --platform ios
eas build --profile preview --platform android

# Compile on this machine (artifacts under ./build-artifacts or default EAS output)
eas build --profile production --platform ios --local
eas build --profile production --platform android --local
```

Profiles and channels are defined in [`eas.json`](eas.json). See [EAS Build](https://docs.expo.dev/build/introduction/) for credentials, credentials.json, and `--local` requirements (Xcode / Android SDK).

# Release process

The public app is distributed via the stores and is not in wide release yet. Shipping happens through **EAS Build**, **EAS Submit**, and **EAS Update** as described in [Deploy flows](#deploy-flows).

## Trigger a new production build

1. **Merge to `main`** — [`deploy-ota-or-native.yml`](.github/workflows/deploy-ota-or-native.yml) runs automatically. Use **Run workflow** on that file to force **OTA** or **build**, pick **platform**, or set **dry run** (skips release creation).
2. **Manual cloud build + submit** — GitHub → **Actions** → **EAS production / preview deployment** ([`eas-deploy.yml`](.github/workflows/eas-deploy.yml)).
3. **From your machine** (uses EAS cloud builders, non-blocking with `--no-wait` as in npm scripts):

- `bun run build:production:android` — Android production build and auto-submit to Google Play
- `bun run build:production:ios` — iOS production build and auto-submit to App Store Connect
- `bun run build:preview:ios` / `build:preview:android` / `build:preview` — preview / internal distribution builds

You can inspect build history on the [EAS Builds dashboard](https://expo.dev/accounts/lukehowsam123/projects/foam/builds), submissions on [EAS Submissions](https://expo.dev/accounts/lukehowsam123/projects/foam/submissions), and the queue on [EAS build status](https://expo.dev/eas-build-status).

## Versioning strategy

- **Marketing / release tag version** — `VERSION` in [`app.config.ts`](app.config.ts) is read by `deploy-ota-or-native` for native release tags and changelog flow.
- **Store build numbers** — [`eas.json`](eas.json) sets `"appVersionSource": "remote"` so compatible native version fields are managed on Expo’s side for production builds (see [EAS app version](https://docs.expo.dev/build-reference/app-versions/)).

# Testers management

At the moment we do the internal testing for the `production` app variant.
Every time a new version is published to the stores testers all testers are able to test it out.

## Android internal testers

`Android Internal testing track`

In order to join the internal testing of the Android app distributed via Google Play Store you need to:

1. Be able to access [Google Play Console](https://play.google.com/console/u/0/developers/9181778102935271854/app-list) using your email.
1. Go to the [Google Play Console Internal Testing panel](https://play.google.com/console/u/0/developers/9181778102935271854/app/4972924111544509272/tracks/internal-testing).
   - open details of `Foam internal testers` group
   - provide email address of the tester that is associated with a Google account used in Play Store
   - hit `Save changes` button
1. Instruct the invited tester to open [Internal testing joining link](https://play.google.com/apps/internaltest/).
1. Anytime a new app version is published to the internal testing track the tester will have to ensure the app is updated by visiting Play Store and re-installing the app
1. The app is available at [Play Store](https://play.google.com/store/apps/details?id=), but the link is available only to the testers that are added to the internal testing track.

## iOS internal testers

`iOS TestFlight internal testing track`

In order to join the TestFlight internal testing of the iOS app distributed via App Store you need to:

1. Be able to access [App Store Connect](https://appstoreconnect.apple.com/teams/767f19a6-9131-4dd6-bc88-1a1e0e1b72a4/apps/6742071860/testflight/ios)
2. Invite the person to the team via [`Users and Access`](https://appstoreconnect.apple.com/access/users).
   - provide `First Name`, `Last Name`, `Email`
   - select `Customer Support` role
   - hit `Next` button
   - ensure only the `Foam` app is selected
   - hit `Invite`
3. Before we move on the person has to accept a team invitation that is sent via an email.
4. Go to the [App Store Connect TestFlight panel](https://appstoreconnect.apple.com/teams/767f19a6-9131-4dd6-bc88-1a1e0e1b72a4/apps/6742071860/testflight/groups/c9bb8b4c-9f06-4036-905c-eba2157f39ed).
   - hit `+` button and select the person from the list
   - hit `Add` button
5. Instruct the tester to open an email that is sent when the tester is added to the TestFlight group and follow the instructions to redeem the TestFlight invitation code.
6. Anytime a new app version is published to the TestFlight the tester will have to ensure the app is updated by visiting TestFlight.

# Debugging

1. React Native comes with [`React Native DevTools`](https://reactnative.dev/docs/0.75/debugging) integrated by default.
   Using them you can:
   - inspect the React component tree
   - debug the application using breakpoints
   - access the runtime state of the application
   - Highlight re-renders & more
2. Use Xcode instruments for debugging IOS performance issues - https://reactnative.dev/docs/next/debugging-native-code
3. Use Android studio performance profiler to debug Android performance issues `open project > view > tool windows > profiler`

# Managing access to the project and associated services

- [Google Play Console](https://play.google.com/console/u/0/developers/9181778102935271854/users-and-permissions)
  - access Play Console app dashboard
  - manage releases to the Beta Testers
  - manage data visible on the Play Store associated with the app

- [App Store Connect](https://appstoreconnect.apple.com/apps/6742071860/distribution)
  - access App Store Connect app dashboard
  - manage releases to the TestFlight
  - manage data visible on the App Store associated with the app

- [EAS](https://expo.dev/accounts/lukehowsam123/projects/foam)
  - access EAS dashboard
  - manage builds and submissions
  - manage app versioning
  - manage Android and iOS specific credentials needed for building and submitting the app to the stores
  - currently this account needs to be transferred to an org to enable sharing.

# API dependencies

1. The app currently depends on the following APIs and services to deliver its content

| Title              | Description                                                               | Base URL                                        |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------- |
| Auth proxy         | Auth Lambda - handles proxying twitch authentication requests             | redacted for security                           |
| Twitch ID          | Twitch Authentication API                                                 | https://id.twitch.tv                            |
| Twitch Helix       | Twitch rest API                                                           | https://api.twitch.tv/helix                     |
| Twitch eventsub    | Event sub WebSocket - used for reacting to twitch events in chat          | wss://eventsub.wss.twitch.tv/ws                 |
| Twitch badges      | Provides Twitch badges                                                    | https://badges.twitch.tv/v1/badges              |
| V3 7TV             | Used for 7tv emotes and emotes in chat                                    | https://7tv.io/v3                               |
| 7TV events         | 7TV event WS - used for reacting to 7TV emote/badge/paint changes in chat | wss://events.7tv.io/v3                          |
| V4 7TV             | V4 GQL endpoint - will be used for user paints                            | https://7tv.io/v3                               |
| BTTV               | Used for BTTV badges and emotes in chat                                   | https://api.betterttv.net                       |
| BTTV WS            | Used to subscribe and react to BTTV badge/emote changes                   | wss://sockets.betterttv.net/ws                  |
| BTTV V3 cached     | Returns cached BTTV emotes and badges                                     | https://api.betterttv.net/3/cached              |
| BTTV V3 cached FFZ | Returns cached FFZ emotes and badges                                      | https://api.betterttv.net/3/cached/frankerfacez |
| V1 FFZ             | V1 FFZ - used for FFZ emotes & badges                                     | https://api.frankerfacez.com/v1                 |

> [!NOTE]
> To check the status of these services, visit their respective status pages:
>
> - Twitch services: https://status.twitch.com/
> - 7TV services: https://status.7tv.app/
> - Auth proxy: https://status.lhowsam.com
> - BTTV and FFZ do not have status pages

# Markdown writing guide

1. When editing this README, keep the [table of contents](#table-of-contents) in sync with new top-level sections.
2. Take advantage of using GitHub flavored markdown

   > [!NOTE]
   > This is a note

   > [!WARNING]
   > This is a warning

   > [!IMPORTANT]
   > This is important

   > [!TIP]
   > This is a tip

   > [!CAUTION]
   > This is a caution

# Bug reports

If you encounter a problem with this project, please open an issue. Be sure to include:

- Node version
- OS
- Brief but thorough reproduction steps of the issue (including screenshots/videos)
