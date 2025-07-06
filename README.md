# Foam mobile app

A new way to experience Twitch.tv on mobile

## Why?

To improve my React native skills and learn various other tech

The native Twitch app experience doesn't quite line up with the desktop experience and it lacks support for third-party extensions that many people use to express themselves in chat. This project aims to be a mobile alternative that supports these extensions and provides a cleaner and more intutive UI.

# Table of contents

- [Foam mobile app](#foam-mobile-app)
- [Why](#why)
- [Table of contents](#table-of-contents)
- [Project structure](#project-structure)
- [Store Links](#store-links)
- [Features](#features)
- [Installation](#installation)
  - [Recommended dev environment](#recommended-dev-environment)
  - [Running `development` version of the app locally](#running-development-version-of-the-app-locally)
  - [Storybook](#storybook)
  - [Running `preview` or `production` version of the app locally](#running-preview-or-production-version-of-the-app-locally)
- [Contributing](#contributing)
  - [Commit strategy - conventional commits](#commit-strategy-conventional-commits)
  - [Git flow \& Pull Requests](#git-flow--pull-requests)
  - [Imports aliasing](#imports-aliasing)
  - [dev-builds](#dev-builds)
- [CI \& CD](#ci-cd)
  - [Developer experience](#developer-experience)
  - [Continuous Delivery](#continuous-delivery)
  - [E2E testing](#e2e-testing)
    - [Running E2E tests locally](#running-e2e-tests-locally)
  - [Local EAS build](#local-eas-build)
- [Continuous Delivery pipeline](#continuous-delivery-pipeline)
- [Release process](#release-process)
  - [Trigger a new production build](#trigger-a-new-production-build)
  - [Versioning strategy](#versioning-strategy)
- [Testers management](#testers-management)
  - [Android testers](#android-testers)
  - [iOS testers](#ios-testers)
- [Debugging](#debugging-1)
- [Managing access to the project and associated services](#managing-access-to-the-project-and-associated-services)
- [API dependencies](#api-dependencies)
- [Markdown writing guide](#markdown-writing-guide)
- [Bug Reports](#bug-reports)

# Project structure

This is a [React Native app](https://reactnative.dev). This repository is responsible for powering the mobile app and its two variants:

1. `production` - the `production` version of the app that is distributed via the stores (App store via TestFlight and Google Play(Via Google Beta Testers)). Eventually this variant will also submit to the actual stores for external users
2. `development` - Used for local development and for installing development builds on your local phone when developing

Each variant is configured with different `bundleId` for `iOS` and `packageName` for `Android` in order to be able to have all versions of the app installed on the same device at the same time.

Core dependencies:

| Library                                          | Category                       | Version | Description                                             |
| ------------------------------------------------ | ------------------------------ | ------- | ------------------------------------------------------- |
| [bun](https://bun.sh/)                           | Package manager & node runtime | 1.2.5   | Fastest package manager and node runtime                |
| [React Native](https://reactnative.dev/)         | Mobile framework               | 0.79.4  | Cross-platform mobile framework                         |
| [React](https://react.dev/)                      | UI framework                   | 19.0.0  | Most popular UI framework worldwide                     |
| [TypeScript](https://www.typescriptlang.org/)    | Language                       | 5.8.3   | Static typechecking                                     |
| [Expo](https://expo.dev/)                        | SDK                            | 53.0.13 | React native framework / Expo modules                   |
| [React Navigation](https://reactnavigation.org/) | Navigation                     | 7.0.14  | Routing and navigation library                          |
| [Maestro](https://maestro.mobile.dev/)           | E2E testing                    | 1.40.1  | Declarative UI testing                                  |
| [EAS](https://expo.dev/eas)                      | CI/CD                          | N/A     | Build the app binaries and submit the app to the stores |
| [Storybook](https://storybook.js.org/)           | UI preview                     | 8.4.4   | UI development & preview tool for React Native          |

Additional inspiration on how this project is structured is coming from: [Obytess React Native Starter](https://starter.obytes.com/), [Aetherspace Green Stack Starter](https://github.com/Aetherspace/green-stack-starter-demo#readme), [online docs as Storybook website](https://main--62c9a236ee16e6611d719e94.chromatic.com/?path=/story/aetherspace-quickstart--page), [Infinite Red cookbook for React Native](https://ignitecookbook.com/).

## Store links

TBA

## Features

TBA

## Getting started

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

7. Run the app

- `bun run ios`
- `bun run android`

## Recommended dev environment

1. Mac - due to being able to run xcode and android simultaneously

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

TODO

# contributing

## Commit strategy - conventional commits

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. [Husky](https://github.com/typicode/husky) is used to execute scrips according to git hooks in order to test if a developer is following the various linting rules and conventional commits. Run `bun commit` to start an interactive commit. Please familiarize yourself with the [specification](https://www.conventionalcommits.org/en/v1.0.0/#specification).

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
6. `eas-cd-production.yml` is responsible for deploying the app to TestFlight/TestTrack. We currently don't have submit CI set up yet.

## Import aliases

We use [tsconfig-paths](https://github.com/dividab/tsconfig-paths) to alias imports.

## dev-builds

Sometimes you may want to run the app on your device to check your changes, see how it looks on a real device etc. In order to do this you need to run some steps to configure your device for the first time.

1. Connect your phone via cable to your laptop/machine (you must ensure both devices are on the same network, otherwise this will not work.). Make sure to trust the phone/laptop when prompted.

2. Open the project in Xcode: `cd ios && xed .` Make sure to login to xcode if you haven't already

3. Your phone will then pair + connect to xcode. Let that complete

4. When prompted select the project and click the 'hide code' button in the top-right

5. Navigate to signing & capabilities

6. Select your team, ensure the bundle identifier is `foam-dev` (or something else to avoid naming conflicts) and select your device from the dropdown `Foam > YourPhoneName`

7. Run a build by clicking the play button

8. The app will then install on your device and run. Hot reloading will also work

If you get an error such as `no development servers found` then this means the laptop and/or phone is on a different network.

# CI/CD

## CI

TODO

## CD

We use [EAS](https://docs.expo.dev/build-reference/eas/) to build and publish the app

There is currently 3 variants of the app that can be installed on the same device

1. `production` - the app that is distributed via the stores (App Store (via TestFlight) and Google Play (via Google Beta Testers))
   - there is a manual trigger configured for `production` build - use GitHub actions to trigger it.
2. `preview` - the app that is used to easily preview the changes from the PRs and is distributed via [`Internal distribution`](https://docs.expo.dev/build/internal-distribution) mechanism (QR codes)
   - on iOS it requires the [device to be registered beforehand](https://docs.expo.dev/build/internal-distribution/#automation-on-ci-optional)
3. `development` - the development version of the app (including development client) that is not distributed in any way and has to be built locally

All variants can be installed on the same device at the same time, because they have different `bundleIdentifier`s for `iOS` and different `packageName`s for `Android`. You can get more information about multiple app variants in [Expo docs](https://docs.expo.dev/tutorial/eas/multiple-app-variants/).

## E2E testing

We use `maestro` for automated `e2e` testing. The test flows are defined in the <a href='/src/test/maestro/'>`src/test/maestro`</a> directory, and will eventually cover core user journeys once the app is complete. To run them locally use the `maestro` CLI command `maestro test [path to test flow]`.

### Running E2E tests locally

1. Install [`maestro`](https://maestro.mobile.dev/)
2. Before running the E2E tests you need to install the development version of the app
   1. Read [Running `development` version of the app locally](#running-development-version-of-the-app-locally) to achieve this
   2. E2E tests are assumed to be run on Android Emulator or iOS Simulator
3. `bun run e2e-test:android` - runs the tests on Android
4. `bun run e2e-test:ios` - runs the tests on iOS

## Local EAS build

TODO

# Continuous delivery pipeline

TODO

# Release process

The `public` version of the app is distributed via the stores and is not available publicly yet:

We use [EAS Build](https://expo.dev/eas#build) to build app binaries and [EAS Submit](https://expo.dev/eas#submit) to submit them to the stores.
Production deployment is configured to be triggered manually.
Manual trigger is available from GitHub, Expo Dashboard or directly from the console using the following commands:

- `bun run build:production:android` - builds the app for Android and auto-submits it to the Google Play Store
- `bun run build:production:ios` - builds the app for iOS and auto-submits it to the App Store

You can inspect the builds history on the [EAS Builds dashboard](https://expo.dev/accounts/lukehowsam123/projects/foam/builds).
You can inspect the submissions history on the [EAS Submissions dashboard](https://expo.dev/accounts/lukehowsam123/projects/foam/submissions).

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

2. Adhere to the [`Table of Contents`](#table-of-contents) structure

# API dependencies

1. The app currently depends on the following APIs and services to deliver its content

| Title              | Description                                                               | Base URL                                        |
| ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------- |
| Auth proxy         | Auth Lambda - handles proxying twitch authentication requests             | redacted for security                           |
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

1. Take advantage of using GitHub flavored markdown

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
