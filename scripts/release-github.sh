#!/usr/bin/env bash
set -euo pipefail

# Local equivalent of .github/actions/create-release: renders the release notes
# from the changesets, cuts CHANGELOG.md for a production build, then
# creates/updates the native GitHub release.
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

cut_release="false"
if [ "$variant" = "production" ]; then
  cut_release="true"
fi

git fetch --tags origin 2>/dev/null || true

tag_exists="false"
if git tag -l "$tag" | grep -qx "$tag"; then
  tag_exists="true"
  echo "Tag $tag already exists; will reuse it"
fi

release_notes() {
  bun scripts/release-notes.ts "$@"
}

if [ "$dry_run" = "true" ]; then
  echo "========= DRY MODE =========="
  echo "Tag: $tag"
  echo "App Version: $version"
  echo "Variant: $variant"
  if [ "$cut_release" = "true" ]; then
    echo "Would cut CHANGELOG.md for $version, commit it to main, push tag $tag, and create/update the GitHub release"
  else
    echo "Would push tag $tag and create/update the GitHub release with the pending notes"
  fi
  echo ""
  echo "=== Pending release notes ==="
  release_notes pending
  echo "============================="
  exit 0
fi

if [ "$no_push" = "false" ]; then
  auth_header="$(printf 'luke-h1:%s' "$GITHUB_RELEASE_TOKEN" | base64 | tr -d '\n')"
  authed_push() {
    git -c "http.https://github.com/.extraheader=AUTHORIZATION: basic ${auth_header}" push "https://github.com/${repository}.git" "$@"
  }
fi

if [ "$cut_release" = "true" ]; then
  notes="$(release_notes release --version "$version")"
  bunx oxfmt CHANGELOG.md
else
  echo "Pre-production builds do not cut CHANGELOG.md"
  notes="$(release_notes pending)"
fi

printf '%s\n' "$notes" > .release-notes-body.md

if [ "$no_push" = "true" ]; then
  if [ "$cut_release" = "true" ]; then
    echo "CHANGELOG.md cut for $version and left uncommitted (--no-push)"
  fi
  echo "Skipping commit, tag, push, and GitHub release for $tag (--no-push)"
  exit 0
fi

if [ "$cut_release" = "true" ]; then
  git add CHANGELOG.md .changeset
  if git diff --cached --quiet; then
    echo "CHANGELOG.md already carries $version"
  else
    echo "Cutting CHANGELOG.md for $version, committing and pushing to main..."
    git commit -m "chore(changelog): release ${version}"
    authed_push HEAD:main
  fi
fi

release_body="## ${variant_label} Native Build: ${tag}

**Deployment Type:** Native Build
**App Version:** \`${version}\`

---

${notes}"

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
