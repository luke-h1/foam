---
description: Growth review for this app with Appeeky Spec. The specialists read everything, then you write a brief and propose at most one listing change.
---

You are this app's growth co-founder. The repo holds the app's store listing and growth data as files (Appeeky Spec); follow the appeeky-spec skill. Run the CLI as `npx @appeeky/spec <command>`, or `appeeky-spec <command>` when it is installed.

Run the review below, write the brief, and propose at most one listing change.

1. **Where things stand.** Run `status --json`: its `free` list is the stores you may change; the others have a release still being measured. Read `appeeky/loops.md`, `appeeky/playbook.md` and the latest brief in `appeeky/briefs/`, if there is one.

2. **Ask the specialists.** Start the `appeeky-aso`, `appeeky-reviews`, `appeeky-ads`, `appeeky-releases`, `appeeky-ugc` and `appeeky-social` subagents, in parallel when you can. Tell each one today's date, the free stores and the exact way to run the CLI here (`appeeky-spec` or `npx @appeeky/spec`). They only read, and each answers with findings and up to two candidates. If you cannot start subagents, read their instructions (in `.claude/agents/` or `.opencode/agent/`) and do each checklist yourself, one after another. Skip a specialist whose data is missing, and say so in the brief.

3. **Decide.** Pick the one change most likely to win, for a free store:
   - one clear hypothesis, so its result means something;
   - the strongest evidence: an uncovered high-popularity target, words many users write, a paid search that converts, a search a competitor just climbed;
   - never a change the playbook says lost, unless something changed.

   If no store is free, or no candidate is strong enough, change nothing and say why in the brief.

4. **Make it.** Edit the listing files under `appeeky/store/`. Keep the brand; never use another app's name. Run `check` and `diff`, and fix every error. A change marked blocked needs a new App Store version: say so.

5. **Write the brief** to `appeeky/briefs/<YYYY-MM-DD>.md`:
   - **Where we stand:** what is being measured and when it is checked
   - **What the specialists found:** a few lines each, with the numbers
   - **The change:** what, why, the metric and when it is checked; or why there is none this time
   - **For a person:** review replies to send, ads changes, product requests, the next UGC experiment with its creator brief, and posts to publish. Spec does not do these.
   - **Not now:** good candidates you did not pick, and why

6. **Turn what is for a person into drafts they approve by merging:**
   - Each post the social specialist proposed for a connected account: `appeeky/social/drafts/<YYYY-MM-DD>-<slug>.yaml` with `accounts` (platforms from `appeeky/social/accounts.yaml`), `text`, `when` (ISO, at least a day ahead), `media` (public URLs, when the platform needs one) and `why`. Run `social check` and fix every problem, or leave the post out.
   - The video the UGC specialist proposed, if a persona is ready: `appeeky/ugc/briefs/<YYYY-MM-DD>-<slug>.yaml` with `persona`, `script`, `scene`, `caption`, `durationSec`, `aspectRatio` and `why`. Run `ugc generate --dry-run` to show its cost in credits.
   - After the merge, `social push` sends the posts and `ugc generate` makes the clips. Never run those yourself.

7. **Write `.appeeky/proposal.md`:** the first line is a short pull request title. Then what changes, why (with the numbers), which metric should move and when it is checked (day 7 and day 14 after the push), and a link to the brief.

Do not run `push`, `reviews push`, `social push`, `ugc generate` (without `--dry-run`), `revert` or `pull`. A person reviews the pull request; the push runs when it is merged.
