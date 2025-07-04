# foam

## Why?

To improve my React native skills and learn various other tech

The native Twitch app experience doesn't quite line up with the desktop experience and it lacks support for third-party extensions that many people use to express themselves in chat. This project aims to be a mobile alternative that supports these extensions and provides a cleaner and more intutive UI.

## Store links

TBA

## Features

TBA

## Environments

TBA

## Getting started

You will need the following in order to run the project locally:

- [Node.js](https://nodejs.org/en/)
- [NVM](https://github.com/nvm-sh/nvm)
- [Xcode](https://developer.apple.com/xcode/)
- [Android Studio](https://developer.android.com/studio)
- [bun](https://bun.sh/)

Once you have the above installed, you can run the following commands to get started:

Install correct node and package manager versions

```bash
 nvm use
 nvm install
 corepack enable
```

If for whatever reason `corepack enable` doesn't work you can run the following script to install the right version of PNPM:

```bash
BUN_VERSION=$(node -e "console.log(require('./package.json').engines.bun)")
curl -fsSL https://bun.sh/install | bash -s "bun-v$BUN_VERSION"
```

Install dependencies

```bash
bun install
```

Acquire Twitch API credentials

- Create a Twitch account if you do not have one already
- Enable 2FA on your account otherwise you'll not be able to create apps via the dev console
- Go to the [Twitch developer console](https://dev.twitch.tv/console/apps/create) and create a new application. Your OAUTH redirect settings should look like the following:

<img src='.github/docs/twitch-settings.png' alt='Twitch app settings' />

- Copy the client ID and client secret and paste them into a `.env` file in the root of the project. See `.env.example` for an example of what this file should look like

If you're on Linux or windows, you'll need to setup Android studio and install a device to run the app.

If you're on Mac you can just use the iOS simulator (via Xcode) to run the app

You will then need to start the proxy server before you start up the app to proxy authentication requests to Twitch. This is due to a new requirement where Twitch do not let you proxy non `http` URLs. Locally this is just a simple Express server. In production, we'll most likely use a serverless function to get around this issue.

Start the proxy server

```bash
bun run start:proxy
```

Start the app

```bash
bun run ios
```

Create a development build (if needed)

```bash
bun run prebuild
```

## Contributing

### Committing code

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification. [Husky](https://github.com/typicode/husky) is used to execute scrips according to git hooks in order to test if a developer is following the various linting rules and conventional commits. Run `yarn commit` to start an interactive commit.

### Bug reports

If you encounter a problem with this project, please open an issue. Be sure to include:

- Node version
- OS
- Brief but thorough reproduction steps of the issue
