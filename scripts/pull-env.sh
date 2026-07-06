#!/usr/bin/env bash
set -euo pipefail

# Pulls dev secrets from 1Password and writes .env, using .env.example as the
# template so comments, blank lines, and key order are preserved. Keys without
# a vault mapping keep their .env.example defaults (local dev toggles etc).
#
# Auth: sign in with `eval "$(op signin)"` or set OP_SERVICE_ACCOUNT_TOKEN.

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
example_file="$repo_root/.env.example"
env_file="$repo_root/.env"

vault="ci-cd"
staging_item="foam-mobile-staging"
production_item="foam-mobile-production"

# .env key -> "item<TAB>1Password field label"
declare -A field_map=(
  [EXPO_PUBLIC_TWITCH_CLIENT_ID]="$staging_item	TWITCH_CLIENT_ID"
  [EXPO_PUBLIC_TWITCH_PROD_CLIENT_ID]="$production_item	TWITCH_CLIENT_ID"
  [EXPO_PUBLIC_SENTRY_DSN]="$staging_item	EXPO_PUBLIC_SENTRY_DSN"
  [EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL]="$staging_item	AUTH_PROXY_API_BASE_URL"
  [EXPO_PUBLIC_AUTH_PROXY_API_KEY]="$staging_item	AUTH_PROXY_API_KEY"
  [FOAM_AWS_FINGERPRINT_ACCESS_KEY_ID]="$staging_item	FOAM_AWS_FINGERPRINT_ACCESS_KEY_ID"
  [FOAM_AWS_FINGERPRINT_SECRET_KEY]="$staging_item	FOAM_AWS_FINGERPRINT_SECRET_KEY"
  [FOAM_AWS_FINGERPRINT_BUCKET_NAME]="$staging_item	FOAM_AWS_FINGERPRINT_BUCKET_NAME"
  [EXPO_PUBLIC_STATSIG_CLIENT_KEY]="$staging_item	EXPO_PUBLIC_STATSIG_CLIENT_KEY"
)

for bin in op jq; do
  command -v "$bin" >/dev/null 2>&1 || { echo "error: '$bin' is required but not installed." >&2; exit 2; }
done
[ -f "$example_file" ] || { echo "error: $example_file not found." >&2; exit 2; }

# Keep stderr out of the captured JSON: an `op` warning on a successful call
# would otherwise corrupt the payload and make jq report fields as missing.
get_item_json() {
  local json err_file
  err_file="$(mktemp)"
  if ! json="$(op item get "$1" --vault "$vault" --format json --reveal 2>"$err_file")"; then
    echo "error: cannot read item '$1' in vault '$vault'. Are you signed in? (eval \"\$(op signin)\")" >&2
    cat "$err_file" >&2
    rm -f "$err_file"
    exit 2
  fi
  rm -f "$err_file"
  printf '%s' "$json"
}

echo "Fetching secrets from 1Password vault '$vault'..."
staging_json="$(get_item_json "$staging_item")"
production_json="$(get_item_json "$production_item")"

lookup_field() {
  local item="$1" label="$2" json
  case "$item" in
    "$staging_item") json="$staging_json" ;;
    "$production_item") json="$production_json" ;;
    *) return 1 ;;
  esac
  jq -er --arg label "$label" \
    '.fields[]? | select(.label == $label) | .value // empty' <<<"$json"
}

filled=()
defaulted=()
missing=()
output=""

while IFS= read -r line || [ -n "$line" ]; do
  if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)= ]]; then
    key="${BASH_REMATCH[1]}"
    if [ -n "${field_map[$key]:-}" ]; then
      item="${field_map[$key]%%	*}"
      label="${field_map[$key]#*	}"
      if value="$(lookup_field "$item" "$label")"; then
        output+="$key=$value"$'\n'
        filled+=("$key")
      else
        output+="$line"$'\n'
        missing+=("$key (expected field '$label' on '$item')")
      fi
    else
      output+="$line"$'\n'
      defaulted+=("$key")
    fi
  else
    output+="$line"$'\n'
  fi
done <"$example_file"

if [ -f "$env_file" ]; then
  cp "$env_file" "$env_file.bak"
  chmod 600 "$env_file.bak"
  echo "Backed up existing .env to .env.bak"
fi
printf '%s' "$output" >"$env_file"
chmod 600 "$env_file"

echo "Wrote $env_file"
echo
echo "Filled from 1Password (${#filled[@]}):"
printf '  - %s\n' "${filled[@]}"
if [ "${#defaulted[@]}" -gt 0 ]; then
  echo "Kept .env.example defaults (no vault mapping):"
  printf '  - %s\n' "${defaulted[@]}"
fi
if [ "${#missing[@]}" -gt 0 ]; then
  echo "⚠️  Mapped but not found in vault (kept example defaults):"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi
