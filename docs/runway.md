# Runway release management

[Runway](https://docs.runway.team/) sits beside the EAS deploy scripts. It
reads the stores, GitHub and CI, and shows one timeline per release. It does
not replace `bun run deploy`, `bun run submit`, `bun run ota` or the GitHub
deploy workflows. Nothing in this repo calls Runway on the release path unless
`RUNWAY_API_KEY` is set.

## What is set up

Workspace: Runway org `Team` (`org_2x8y8dKV`), signed in as
lukehowsam54@gmail.com. Plan: Basic (free). Basic allows 2 apps, which the two
apps below use up.

Apps:

| Runway app                     | App id (slug)                  | Platform | Store identity                                                              |
| ------------------------------ | ------------------------------ | -------- | --------------------------------------------------------------------------- |
| `Foam: Streams, Chat & Emotes` | `foam-streams-chat--emote-ios` | iOS      | bundle id `foam-tv`, ASC app `6742071860`                                   |
| `Foam`                         | `foam-android`                 | Android  | package `com.lhowsam.foam_tv`, Play developer account `9181778102935271854` |

Integrations connected in the web app (App settings > Integrations):

- iOS: App Store Connect (bundle id `foam-tv`) and TestFlight (same key).
- Android: Google Play Console (package `com.lhowsam.foam_tv`) and Google Play
  beta on the `internal` track (same service account).
- Both apps: release tag pattern `{version}`, release branch `main` (all
  release types), working branch `main`. This is Runway's "trunk-based,
  release from trunk" setup. Runway treats new commits on `main` past the last
  release tag as the next release.

Not connected yet (see "Manual steps"): GitHub, GitHub Actions, Expo EAS,
Sentry, Slack.

Runway only reads the production identities. The internal and TestFlight
variants (`foam-tv-internal`, `foam-tv-testflight`,
`com.lhowsam.foam.internal`) are not registered as apps. Their builds still
show up in Runway as "other" builds under the same ASC team, but they do not
drive a release.

## Files in this repo

- `.github/workflows/eas-deploy.yml` and
  `.github/workflows/deploy-ota-or-native.yml`: gained a `run-name` with
  `key=value` tokens (`variant=`, `platform=`, `deploy_type=`). Runway's
  GitHub Actions integration cannot read workflow inputs from the API, so it
  reads them from the run name. This is what lets Runway trigger a build with
  arguments and filter the runs it lists.
- `.github/workflows/runway.yml`: runs on every GitHub release (the ones
  `scripts/release-github.sh` creates) and on manual dispatch. It calls the
  script below. It exits early when the `RUNWAY_API_KEY` secret is empty, so
  it is a no-op on the Basic plan.
- `scripts/runway-sync-release.sh`: finds or creates the Runway release for a
  tag on both apps and stores the git-cliff notes as the release description.
  Usage: `./scripts/runway-sync-release.sh 1.0.9 .release-notes-body.md`.
  `release-github.sh` writes `.release-notes-body.md`, so the script can also
  run locally right after a deploy.
- `.mcp.json` (untracked, local only): a `runway` MCP server entry for
  `https://mcp.runway.team`. It sends `Authorization: Bearer $RUNWAY_API_KEY`.
  With the variable unset the header is empty and the server is unusable but
  harmless.

## Secrets

No secret value is stored in the repo. Names and locations:

| Name                                                                                                     | Where                                                                                                                                                             | Used by                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App Store Connect API key `FRM54H5GC7` (issuer `767f19a6-9131-4dd6-bc88-1a1e0e1b72a4`, role App Manager) | 1Password vault `ci-cd`, item `tightlog-asc-api-metadata`, field `credential` (the `.p8`)                                                                         | Pasted into Runway's App Store Connect and TestFlight integrations. It is a team-level key, so it also covers Foam. Rotate it in both places together. |
| Play service account `foam-android-testtrack@foam-456217.iam.gserviceaccount.com`                        | 1Password vault `ci-cd`, item `foam playstore service account (foam-android-testtrack)`, file `playstore-service-account.json`                                    | Uploaded to Runway's Google Play Console and Google Play beta integrations. Same file `eas submit` uses.                                               |
| `EXPO_RUNWAY_ACCESS_TOKEN`                                                                               | 1Password vault `ci-cd`, item `foam-runway`                                                                                                                       | Expo personal access token named `RUNWAY_FOAM_INTEGRATION`, created for Runway's Expo EAS integration. Not pasted into Runway yet.                     |
| `RUNWAY_API_KEY`                                                                                         | Not created yet. Put it in the `foam-runway` 1Password item and in GitHub Actions secrets (`gh secret set RUNWAY_API_KEY`). Export it locally for the MCP server. | `.github/workflows/runway.yml`, `scripts/runway-sync-release.sh`, `.mcp.json`.                                                                         |

The 1Password item `foam-runway` (vault `ci-cd`) is the home for every
Runway-related secret. Add new fields there rather than creating more items.

## How a release flows now

1. Merge to `main`. Runway sees commits past the last `{version}` tag and
   opens the next release on the timeline for both apps.
2. Build and submit as before: `bun run deploy -- production all`, or run the
   `Deploy native or OTA` / `EAS app deployment` workflow. EAS builds and
   submits. Runway picks the new build up from App Store Connect, TestFlight
   and the Play `internal` track within about ten minutes.
3. `release-github.sh` tags the commit (`1.0.9`, `1.0.9-internal`) and creates
   the GitHub release. Runway matches the tag against `{version}`.
4. `runway.yml` fires on the GitHub release and, when `RUNWAY_API_KEY` is set,
   copies the notes into the Runway release description.
5. Track review, phased release and rollout in Runway. Automations (App
   settings > Automations) can submit for review and release, but none are
   enabled; the EAS scripts still do that.

OTA updates (`bun run ota`) are unchanged. Runway's Expo EAS integration would
show update groups and let you publish or roll out from Runway, but see
below.

## Manual steps left

1. Finish the GitHub App install. A Brave tab is open at
   `https://github.com/apps/runway-github/installations` asking for sudo
   confirmation (passkey or password). Confirm it. GitHub then installs
   "Runway + GitHub" on `luke-h1/foam` only and redirects back to Runway.
   If the tab is gone, open App settings > Integrations > GitHub > Connect on
   the iOS app and pick `luke-h1` > Only select repositories > `foam`.
2. In Runway, on both apps, App settings > Integrations:
   - GitHub (Version control): pick repo `luke-h1/foam`.
   - GitHub Actions (CI/CD): reuse the GitHub connection, repo `luke-h1/foam`,
     Release Candidate workflow `deploy-ota-or-native.yml`. Add workflow
     arguments `variant=production` and `platform=ios` (Android app:
     `platform=android`, `deploy_type=build`). Leave the release workflow
     empty; the same workflow produces the store build.
   - App settings > General > Version files in codebase: `app.config.ts`,
     field `VERSION` (the line `const VERSION = '1.0.9';`).
3. Decide on the plan. The REST API, MCP server and outgoing webhooks need the
   Enterprise plan. The banner in the web app offers a free 3 week trial of
   every feature. Activating it is a plan change, so it was left to you. With
   the trial or Enterprise:
   - Org settings > API keys > create `foam-ci` with app scopes for both apps.
   - Store it: `op item edit foam-runway --vault ci-cd 'RUNWAY_API_KEY[concealed]=<value>'`
     and `gh secret set RUNWAY_API_KEY`.
   - Export `RUNWAY_API_KEY` in your shell so the `runway` MCP server in
     `.mcp.json` authenticates.
4. Expo EAS. Runway models OTA as a third app, and Basic is capped at 2. If
   the plan allows it, add a product from the app switcher with "Updates to
   this app are also delivered via an OTA framework" checked, then connect
   Expo EAS with project id `950a1e2f-6b25-4be7-adb2-3c16287a2b5e` and the
   `EXPO_RUNWAY_ACCESS_TOKEN` from 1Password. If you do not, revoke that token
   on https://expo.dev/accounts/lukehowsam123/settings/access-tokens and
   delete the field.
5. Optional integrations that need an OAuth login: Sentry (stability
   monitoring, org `foam-tv`, project `foam-tv-mobile` on de.sentry.io) and
   Slack (notifications).
6. Optional: ask Runway support to put both apps in one flightpath. The
   Android app was added by hand, so it has its own timeline.

## Undo

- Runway: App settings > General > Delete app, for both apps. Then remove the
  GitHub App at https://github.com/settings/installations.
- Revoke the Expo token `RUNWAY_FOAM_INTEGRATION` on expo.dev and delete the
  `foam-runway` item from 1Password. The ASC key and Play service account
  predate Runway; leave them.
- Repo: delete `.github/workflows/runway.yml`,
  `scripts/runway-sync-release.sh`, this file, the `run-name` lines in the two
  deploy workflows, and the `runway` block in `.mcp.json`.
- GitHub: `gh secret delete RUNWAY_API_KEY` if it was created.
