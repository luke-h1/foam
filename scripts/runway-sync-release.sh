#!/usr/bin/env bash
set -euo pipefail

# Mirrors a native release into Runway (https://app.runway.team).
# For each Runway app it finds the release with the same version, creates it
# when it is missing, and stores the release notes as the release description.
#
#  ./scripts/runway-sync-release.sh 1.0.9
#  ./scripts/runway-sync-release.sh 1.0.9-internal .release-notes-body.md
#
# The tag is the GitHub release tag that scripts/release-github.sh creates.
# A variant suffix (-internal, -testflight) is stripped from the version and
# recorded in the description instead.
#
# Env:
#  RUNWAY_API_KEY   required. Runway org settings > API keys. The API needs
#                   the Enterprise plan or the free trial. When the key is not
#                   set the script prints a notice and exits 0.
#  RUNWAY_APP_IDS   optional. Space separated Runway app ids.
#  RUNWAY_API_BASE_URL optional. Defaults to https://api.runway.team.

tag="${1:-}"
notes_file="${2:-.release-notes-body.md}"
api="${RUNWAY_API_BASE_URL:-https://api.runway.team}"
app_ids="${RUNWAY_APP_IDS:-foam-streams-chat--emote-ios foam-android}"

if [ -z "$tag" ]; then
  echo "Usage: ./scripts/runway-sync-release.sh <tag> [notes-file]"
  exit 1
fi

if [ -z "${RUNWAY_API_KEY:-}" ]; then
  echo "RUNWAY_API_KEY is not set; skipping Runway sync for $tag"
  exit 0
fi

for bin in curl jq; do
  command -v "$bin" >/dev/null 2>&1 || { echo "error: '$bin' is required but not installed." >&2; exit 2; }
done

version="${tag#v}"
variant="production"
case "$version" in
  *-internal)
    variant="internal"
    version="${version%-internal}"
    ;;
  *-testflight)
    variant="testflight"
    version="${version%-testflight}"
    ;;
esac

if ! printf '%s' "$version" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+$'; then
  echo "error: '$tag' does not contain a semver version" >&2
  exit 1
fi

notes=""
if [ -f "$notes_file" ]; then
  notes="$(cat "$notes_file")"
fi
description="$(printf 'Variant: %s\nTag: %s\n\n%s' "$variant" "$tag" "$notes")"

runway_api() {
  local method="$1" path="$2" body="${3:-}"
  if [ -n "$body" ]; then
    curl -sS --fail-with-body -X "$method" "$api$path" \
      -H "X-API-Key: $RUNWAY_API_KEY" \
      -H "Content-Type: application/json" \
      --data "$body"
  else
    curl -sS --fail-with-body -X "$method" "$api$path" \
      -H "X-API-Key: $RUNWAY_API_KEY"
  fi
}

for app_id in $app_ids; do
  echo "Runway: syncing $version ($variant) to app $app_id"

  release_id="$(runway_api GET "/v2/app/$app_id/releases?limit=100" |
    jq -r --arg v "$version" '(.data // .releases // .) | .[] | select(.version == $v) | .id' |
    head -n 1)"

  if [ -z "$release_id" ]; then
    echo "Runway: no release $version on $app_id, creating it"
    release_id="$(runway_api POST "/app/$app_id/release" "$(jq -cn --arg v "$version" '{version: $v}')" |
      jq -r '.id // .data.id')"
  fi

  if [ -z "$release_id" ] || [ "$release_id" = "null" ]; then
    echo "error: could not resolve a Runway release id for $version on $app_id" >&2
    exit 1
  fi

  runway_api PUT "/app/$app_id/release/$release_id" \
    "$(jq -cn --arg d "$description" '{releaseDescription: $d}')" >/dev/null

  echo "Runway: updated release $release_id on $app_id"
done
