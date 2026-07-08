#!/usr/bin/env bash
set -euo pipefail

# Local equivalent of .github/actions/create-release + update-changelog:
# generates release notes with git-cliff, updates and pushes CHANGELOG.md,
# then creates/updates the native GitHub release.
#
#  ./scripts/release-github.sh internal
#  ./scripts/release-github.sh production --dry-run
#  ./scripts/release-github.sh internal --no-push

variant="${1:-}"
dry_run="false"
no_push="false"
shift || true

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run) dry_run="true" ;;
    --no-push) no_push="true" ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
  shift
done

case "$variant" in
  internal | testflight | production) ;;
  *)
    echo "Usage: ./scripts/release-github.sh <internal|testflight|production> [--dry-run]"
    exit 1
    ;;
esac

git_cliff_bin="$(command -v git-cliff || true)"
if [ -z "$git_cliff_bin" ] && [ -x "$HOME/.cargo/bin/git-cliff" ]; then
  git_cliff_bin="$HOME/.cargo/bin/git-cliff"
fi

if [ -z "$git_cliff_bin" ]; then
  echo "git-cliff is required. Install it with: brew install git-cliff"
  exit 1
fi

if [ -z "${GITHUB_RELEASE_TOKEN:-}" ] && [ -f .env ]; then
  GITHUB_RELEASE_TOKEN="$(grep -E '^GITHUB_RELEASE_TOKEN=' .env | head -n 1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  export GITHUB_RELEASE_TOKEN
fi

if [ "$dry_run" = "false" ] && [ "$no_push" = "false" ] && [ -z "${GITHUB_RELEASE_TOKEN:-}" ]; then
  echo "GITHUB_RELEASE_TOKEN is not set. Add it to your .env (see .env.example)."
  exit 1
fi

repository="$(git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##')"
version="$(grep "const VERSION = " app.config.ts | sed "s/const VERSION = '//g" | sed "s/';//g" | tr -d ' ')"

if [ "$variant" = "production" ]; then
  tag="$version"
  variant_label="Production"
else
  tag="${version}-${variant}"
  case "$variant" in
    internal) variant_label="Internal" ;;
    testflight) variant_label="TestFlight" ;;
  esac
fi

# Variant tags for the same version often point at the same commits as this
# release. Ignore them so git-cliff applies --tag instead of reusing the
# existing tag's name (WARN: There is already a tag (...) for <sha>).
escaped_version="$(printf '%s' "$version" | sed 's/[.]/\\./g')"
case "$variant" in
  production) ignore_tags="^${escaped_version}-(internal|testflight)$" ;;
  testflight) ignore_tags="^${escaped_version}-internal$" ;;
  internal) ignore_tags="^${escaped_version}-testflight$" ;;
esac

git fetch --tags origin 2>/dev/null || true

tag_exists="false"
if git tag -l "$tag" | grep -qx "$tag"; then
  tag_exists="true"
  echo "Tag $tag already exists; will reuse it"
fi

native_tag_pattern='^v?[0-9]+\.[0-9]+\.[0-9]+$'
if [ "$variant" != "production" ]; then
  native_tag_pattern="^v?[0-9]+\\.[0-9]+\\.[0-9]+-${variant}$"
fi

previous_tag=$(
  git tag -l 2>/dev/null |
    grep -E "$native_tag_pattern" |
    grep -vE '^ota-' |
    grep -v "^${tag}$" |
    sort -V --reverse |
    head -1 || true
)

if [ -z "$previous_tag" ]; then
  echo "No previous tag found"
  release_notes="Initial release"
else
  echo "Previous tag: $previous_tag"
  raw_notes=$("$git_cliff_bin" --config cliff.toml "$previous_tag"..HEAD --tag "$tag" --ignore-tags "$ignore_tags" --unreleased --strip all 2>&1 | grep -v "^[[:space:]]*WARN\|^[[:space:]]*ERROR" || echo "")
  content_only=$(echo "$raw_notes" | tail -n +2 | sed '/^[[:space:]]*$/d')

  if [ -n "$content_only" ]; then
    release_notes="$raw_notes"
  else
    commit_count=$(git rev-list --count "$previous_tag"..HEAD 2>/dev/null || echo "0")
    if [ "$commit_count" = "0" ]; then
      release_notes="No changes since previous release."
    else
      echo "No unreleased commits found, using git log for recent commits"
      git_log=$(git log --pretty=format:"- %s" "$previous_tag"..HEAD | head -20)
      release_notes="### Changes"$'\n\n'"${git_log}"
    fi
  fi

  if echo "$release_notes" | grep -q "panicked"; then
    echo "git-cliff panicked, falling back to git log"
    git_log=$(git log --pretty=format:"- %s" "$previous_tag"..HEAD | head -20)
    release_notes="### Changes"$'\n\n'"${git_log}"
  fi

  release_notes=$(echo "$release_notes" | awk 'BEGIN{first=1} /^## / { if (!first) exit; first=0 } { print }')
fi

printf '%s\n' "$release_notes" > .release-notes-body.md

release_body="## ${variant_label} Native Build: ${tag}

**Deployment Type:** Native Build
**App Version:** \`${version}\`
**Previous tag:** ${previous_tag:-N/A (initial release)}

---

${release_notes}"

if [ "$dry_run" = "true" ]; then
  echo "========= DRY MODE =========="
  echo "Tag: $tag"
  echo "App Version: $version"
  echo "Variant: $variant"
  echo "Previous tag: ${previous_tag:-<none>}"
  echo "Would commit CHANGELOG.md if changed, push tag $tag, and create/update the GitHub release"
  echo ""
  echo "=== Generated Changelog ==="
  echo "$release_notes"
  echo "============================="
  exit 0
fi

if [ "$no_push" = "false" ]; then
  auth_header="$(printf 'luke-h1:%s' "$GITHUB_RELEASE_TOKEN" | base64 | tr -d '\n')"
  authed_push() {
    git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth_header}" push "https://github.com/${repository}.git" "$@"
  }
fi

"$git_cliff_bin" --config cliff.toml --tag "$tag" --ignore-tags "" -o CHANGELOG.md
GIT_CLIFF_BIN="$git_cliff_bin" bunx tsx scripts/workflows/changelog-per-env-cli.ts CHANGELOG.md "$tag"
bunx tsx scripts/workflows/changelog-headings-cli.ts CHANGELOG.md

bunx prettier --write CHANGELOG.md

if [ "$no_push" = "true" ]; then
  if git diff --quiet CHANGELOG.md 2>/dev/null; then
    echo "CHANGELOG.md has not changed"
  else
    echo "CHANGELOG.md regenerated locally and left uncommitted (--no-push)"
  fi
  echo "Skipping commit, tag, push, and GitHub release for $tag (--no-push)"
  exit 0
fi

if git diff --quiet CHANGELOG.md 2>/dev/null; then
  echo "CHANGELOG.md has not changed"
else
  echo "CHANGELOG.md has changed, committing and pushing to main..."
  git add CHANGELOG.md
  git commit -m "chore(changelog): update CHANGELOG.md for ${tag}"
  authed_push HEAD:main
fi

if [ "$tag_exists" = "false" ]; then
  git tag -a "$tag" -m "${variant_label} Native Build: ${tag}"
  authed_push "refs/tags/${tag}"
fi

latest_args=(--latest=false)
if [ "$variant" = "production" ]; then
  latest_args=(--latest)
fi

printf '%s' "$release_body" > .release-body.md

if GH_TOKEN="$GITHUB_RELEASE_TOKEN" gh release view "$tag" --repo "$repository" > /dev/null 2>&1; then
  GH_TOKEN="$GITHUB_RELEASE_TOKEN" gh release edit "$tag" \
    --repo "$repository" \
    --title "$tag" \
    --notes-file .release-body.md \
    "${latest_args[@]}" > /dev/null
  echo "Updated GitHub release $tag"
else
  GH_TOKEN="$GITHUB_RELEASE_TOKEN" gh release create "$tag" \
    --repo "$repository" \
    --verify-tag \
    --title "$tag" \
    --notes-file .release-body.md \
    "${latest_args[@]}" > /dev/null
  echo "Created GitHub release $tag"
fi

echo "https://github.com/${repository}/releases/tag/${tag}"
