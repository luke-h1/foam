# Keep the 1Password secret loaders as separate role-scoped composites

CI loads secrets through three composite actions —
`.github/actions/load-fingerprint-cache-secrets` (the AWS trio),
`load-ota-deploy-secrets` (that trio + Sentry + auth proxy), and
`load-native-deploy-secrets` (that set + Twitch + Google services + Slack) — plus
two inline `1password/load-secrets-action` steps (`deploy-ota-or-native.yml`'s
`slack-notify` job loads only `SLACK_WEBHOOK_URL`; `e2e.yml`'s build job loads only
the iOS Google-services blob). All five pin the same action SHA and version, and
the `op://ci-cd/foam-staging/` vault+environment prefix repeats ~26 times.
Collapsing them onto one seam looks attractive.

We deliberately keep them separate.

- The differing secret **lists are least-privilege, not duplication**. The
  slack-notify job loading only the webhook (with `export-env: false`) and the e2e
  job loading only the Google-services file are scoped so a job never gets secrets
  it has no business holding. A single shared loader would hand every caller the
  union — the native job's Twitch/Google/Slack secrets would leak into the
  fingerprint and slack jobs. Least-privilege is a real constraint that *varies*
  across these seams.
- Composite-action YAML **cannot parametrize the `op://` env-block**. The
  `1password/load-secrets-action` reads refs from a step's `env:` map; a wrapper
  composite can't accept a dynamic map of `NAME → op://…` from its caller. The only
  way to centralize the `foam-staging` environment segment would be to abandon the
  pinned action for raw `op read` calls in bash — adding auth handling and losing
  the action's masking, strictly more machinery than the repeated path lines it
  removes.

Net: the repetition is structural to GitHub Actions, and the one collapse that
would remove it (one over-granting loader) breaks least-privilege. Fails the
deletion test as a deepening — deleting the three composites would scatter the
secret lists across call sites, but merging them concentrates nothing; it only
widens each job's secret grant.

## Consequences

The pinned `1password/load-secrets-action` SHA lives in five places and the
`op://ci-cd/foam-staging/` prefix repeats across the loaders. That is accepted: a
SHA bump or an environment move is a mechanical find-and-replace, and the cost is
paid back by every job holding exactly the secrets it needs. If the prefix ever
needs to vary at runtime (e.g. a `foam-prod` environment), revisit by introducing
a templating step that emits the env file — not by merging the loaders.
