# foam

> Foam is a Twitch mobile app that supports emotes, badges and user colors from [7TV](https://chrome.google.com/webstore/detail/7tv/ammjkodgmmoknidbanneddgankgfejfh), [BetterTTV (BTTV)](https://chrome.google.com/webstore/detail/betterttv/ajopnjidmegmdimjlfnijceegpefgped), and [FrankerFaceZ (FFZ)](https://chrome.google.com/webstore/detail/frankerfacez/fadndhdgpmmaapbmfcknlfgcflmmmieb) — third-party extensions for Twitch used by millions to aid in making the mobile chat experience more enjoyable.

<br />

This repository is managed currently using yarn v3. We're in the process of migrating to PNPM + PNPM workspaces and a monorepo structure

## Why Foam?

The native twitch mobile app does not support emotes, badges and user colors from the above third-party extensions, resulting in only emote text names to be rendered rather than their actual image or GIF, resulting in a poor mobile chat experience.

In addition to this, Foam supports many actions to meet feature parity with the native Twitch mobile app, such as participating in polls, redeeming channel points (with a few extra sprinkles such as auto-redeeming points 😉) and refreshing chat when new emote are added to a channel.

## Store links

TBA

## Features

TBA

## Environments

TBA

## Applications

- foam - React Native app targeting IOS and Android

## Tech stack

- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Expo](https://expo.io/)
- [Tamagui](https://tamagui.dev/)
- [React query](https://tanstack.com/query/latest/)

## Getting started

You will need the following in order to run the project locally:

- [Node.js](https://nodejs.org/en/)
- [NVM](https://github.com/nvm-sh/nvm)
- [Xcode](https://developer.apple.com/xcode/)
- [Android Studio](https://developer.android.com/studio)
- [Yarn](https://yarnpkg.com/)

Once you have the above installed, you can run the following commands to get started:

Install correct node version

```bash
 nvm use
 nvm install
```

Install correct pnpm version

```bash
corepack enable
```

Install dependencies

```bash
pnpm i 
```

Acquire Twitch API credentials

- Create a Twitch account if you do not have one already
- Go to the [Twitch developer console](https://dev.twitch.tv/console/apps/create) and create a new application
- Copy the client ID and client secret and paste them into a `.env` file in the root of the project. See `.env.example` for an example of what this file should look like

### How to run the app

> **Note:** You will need to have an Android emulator running in order to run the app locally. You will need to use the AVD (android virtual device) manager in Android Studio to create a virtual device if you do not have one already.

> **Note:** You'll need to have Xcode installed in order to run the iOS app locally.

```bash
cd apps/mobile && npx expo start
```

## Contributing

### Commiting code

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. [Husky](https://github.com/typicode/husky) is used to execute scrips according to git hooks in order to test if a developer is following the various linting rules and conventional commits. Run `yarn commit` to start an interactive commit.

### Bug reports

If you encounter a problem with this project, please open an issue. Be sure to include:

- Node version
- OS
- Brief but thorough reproduction steps of the issue

## High level design

TBA
