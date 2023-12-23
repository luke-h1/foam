# foam 

> Foam is a Twitch mobile app that supports emotes, badges and user colors from [7TV](https://chrome.google.com/webstore/detail/7tv/ammjkodgmmoknidbanneddgankgfejfh), [BetterTTV (BTTV)](https://chrome.google.com/webstore/detail/betterttv/ajopnjidmegmdimjlfnijceegpefgped), and [FrankerFaceZ (FFZ)](https://chrome.google.com/webstore/detail/frankerfacez/fadndhdgpmmaapbmfcknlfgcflmmmieb) — third-party extensions for Twitch used by millions to aid in making the mobile chat experience more enjoyable.


## Why Foam?
The native twitch mobile app does not support emotes, badges and user colors from the above third-party extensions, resulting in only emote text names to be rendered rather than their actual image or GIF, resulting in a poor mobile chat experience.

In addition to this, Foam supports many actions to meet feature parity with the native Twitch mobile app, such as participating in polls and refreshing chat when new emote are added to a channel.

## Features
TBA


## Applications
* foam - React Native app targeting IOS and Android


## Getting started 
You will need the following in order to run the project locally:

* [Node.js](https://nodejs.org/en/)
* [NVM](https://github.com/nvm-sh/nvm)
* [Xcode](https://developer.apple.com/xcode/)
* [Android Studio](https://developer.android.com/studio)
* [Yarn](https://yarnpkg.com/)

Once you have the above installed, you can run the following commands to get started:

Install correct node version
```bash
 nvm use
 nvm install
```

Install correct yarn version

```bash
corepack enable
```

Install dependencies

```bash
yarn
```

### How to run the android app 

> **Note:** You will need to have an Android emulator running in order to run the app locally. You will need to use the AVD (android virtual device) manager in Android Studio to create a virtual device if you do not have one already.

```bash
cd apps/mobile
yarn prebuild:android && yarn android
```

### How to run the iOS app

> **Note:** You'll need to have Xcode installed in order to run the iOS app locally.

```bash
cd apps/mobile
yarn prebuild:ios && yarn ios
```
