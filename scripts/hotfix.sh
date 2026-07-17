#!/usr/bin/env bash
set -euo pipefail

# Sets up a hotfix branch for an already-released build and cherry-picks the fix
# commit(s) onto it, without dragging in unrelated `main` changes.
#
#   bun run hotfix -- <base-tag> <commit-sha> [<commit-sha> ...]
#
# Examples:
#   bun run hotfix -- 1.0.0 4f086c92
#   bun run hotfix -- 1.0.0-internal 4f086c92 a081b61b
#   bun run hotfix -- 1.0.0 4f086c92 --base <commit>   # force the base commit
#
# The base tag is any native release tag (`1.0.0`, `1.0.0-internal`,
# `1.0.0-testflight`). It names *which released build* you're patching.
#
# IMPORTANT: the branch is created from the commit that is actually LIVE on that
# channel, which is NOT always the native tag. OTA updates ship on top of a
# native release without bumping the version, so the live code is the latest
# `ota-<variant>-<version>-<run>` tag (see .github/workflows/deploy-ota-or-native.yml).
# Branching from the bare native tag would drop every OTA shipped since and
# regress users. This script resolves that automatically; `--base <ref>` overrides
# it if you need a specific commit.

base_tag=""
base_override=""
commits=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --base)
      base_override="${2:-}"
      shift 2 || {
        echo "--base needs a commit-ish argument"
        exit 1
      }
      ;;
    *)
      if [ -z "$base_tag" ]; then
        base_tag="$1"
      else
        commits+=("$1")
      fi
      shift
      ;;
  esac
done

if [ -z "$base_tag" ] || [ "${#commits[@]}" -eq 0 ]; then
  echo "Usage: bun run hotfix -- <base-tag> <commit-sha> [<commit-sha> ...] [--base <ref>]"
  echo "Example: bun run hotfix -- 1.0.0 4f086c92"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash your changes first."
  exit 1
fi

echo "Fetching tags from origin..."
git fetch --tags origin

if ! git rev-parse -q --verify "refs/tags/${base_tag}" >/dev/null; then
  echo "Tag '${base_tag}' does not exist. Available native release tags:"
  git tag -l | grep -E '^v?[0-9]+\.[0-9]+\.[0-9]+(-(internal|testflight))?$' | sort -V | tail -20
  exit 1
fi

# Split the native tag into its version + variant so we can find OTA tags that
# shipped on top of this exact release (`ota-<variant>-<version>-<run>`).
if [[ "$base_tag" =~ ^v?([0-9]+\.[0-9]+\.[0-9]+)(-(internal|testflight))?$ ]]; then
  version="${BASH_REMATCH[1]}"
  variant="${BASH_REMATCH[3]:-production}"
else
  version=""
  variant=""
fi

resolve_live_ref() {
  # Explicit override wins.
  if [ -n "$base_override" ]; then
    echo "$base_override"
    return
  fi

  # Non-standard base tag - can't map to a channel, use it as-is.
  if [ -z "$version" ]; then
    echo "$base_tag"
    return
  fi

  # Highest run number for this variant+version is the latest OTA on the channel.
  local latest_ota
  latest_ota="$(
    git tag -l "ota-${variant}-${version}-*" |
      sort -t- -k4 -n |
      tail -1
  )"

  if [ -n "$latest_ota" ]; then
    echo "$latest_ota"
    return
  fi

  echo "$base_tag"
}

base_ref="$(resolve_live_ref)"

if [ -n "$base_override" ]; then
  echo "ℹ️ Using the base commit you passed with --base: '${base_ref}' ($(git rev-parse --short "$base_ref"^{commit}))."
elif [ "$base_ref" != "$base_tag" ]; then
  echo "ℹ️ OTA updates shipped on top of ${base_tag}; branching from the live commit '${base_ref}' ($(git rev-parse --short "$base_ref"^{commit})) so the hotfix is a superset."
elif [ -n "$version" ]; then
  echo "⚠️ No OTA tags found for ${variant} ${version}; branching from the native tag '${base_tag}'."
  echo "   If OTA updates shipped on this version before OTA tagging existed, find the live commit with EAS and pass it explicitly:"
  echo "     eas channel:view ${variant} --json   # -> linked branch"
  echo "     eas update:list --branch <branch> --json --limit 1   # -> newest update"
  echo "   then re-run with:  bun run hotfix -- ${base_tag} <sha> --base <live-commit>"
fi

branch="hotfix/${base_tag}"

if git rev-parse -q --verify "refs/heads/${branch}" >/dev/null; then
  echo "Branch '${branch}' already exists. Check it out and continue there, or delete it first."
  exit 1
fi

echo "Creating branch '${branch}' from '${base_ref}'..."
git switch --create "$branch" "$base_ref"

echo "Cherry-picking ${#commits[@]} commit(s) onto '${branch}'..."
for sha in "${commits[@]}"; do
  if ! git rev-parse -q --verify "${sha}^{commit}" >/dev/null; then
    echo "Commit '${sha}' not found. Resolve the remaining picks manually."
    exit 1
  fi
  echo "  cherry-pick ${sha}"
  if ! git cherry-pick "$sha"; then
    cat <<EOF

Cherry-pick of '${sha}' conflicted. Resolve the conflicts, then run:
  git cherry-pick --continue
Or abort with:
  git cherry-pick --abort
EOF
    exit 1
  fi
done

cat <<EOF

✅ Hotfix branch '${branch}' is ready with your cherry-picked fix(es).

Next steps:
  1. Bump VERSION in app.config.ts (e.g. patch: ${version:-1.0.0} -> next patch) so the
     hotfix gets its own release tag and changelog range.
  2. Check whether the hotfix needs a native build or can ship as an OTA:
       bun run ota:check
  3. Ship it from this branch (does NOT touch main):
       - OTA-eligible:  bun run ota -- ${variant:-<variant>} <platform> "hotfix: ..."
       - native build:  bun run deploy -- ${variant:-<variant>} <platform> --no-push
  4. Cut the release tag off this branch (see README "Hotfix / cherry-pick
     releases") and push only the tag.
  5. Open a PR to merge (or cherry-pick) the same fix back into main so the two
     histories don't diverge.
EOF
