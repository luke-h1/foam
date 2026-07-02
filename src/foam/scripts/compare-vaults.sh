#!/usr/bin/env bash
set -euo pipefail

vault="ci-cd"
staging_item="foam-mobile-staging"
production_item="foam-mobile-production"
compare_values=false

usage() {
  cat <<'EOF'
Usage: ./scripts/compare-vaults.sh [--values] [--vault NAME] [staging-item] [production-item]

Asserts two items in vault have the same fields.

--values: also reports, per shared field, whether the value is identical (=)
or differs (≠). Values are never printed; value differences do NOT fail the
script (env-specific secrets are meant to differ).

Auth: sign in with `eval "$(op signin)"` or set OP_SERVICE_ACCOUNT_TOKEN.
Exit codes: 0 = field sets equal, 1 = field sets differ, 2 = setup/auth error.
EOF
}

args=()
while [ $# -gt 0 ]; do
  case "$1" in
    --values) compare_values=true ;;
    --vault)
      shift
      if [ $# -eq 0 ] || [[ "$1" == -* ]]; then
        echo "error: --vault requires a vault name." >&2
        usage >&2
        exit 2
      fi
      vault="$1"
      ;;
    -h | --help) usage; exit 0 ;;
    -*) echo "error: unknown option '$1'" >&2; usage >&2; exit 2 ;;
    *) args+=("$1") ;;
  esac
  shift
done
if [ "${#args[@]}" -gt 2 ]; then
  echo "error: expected at most 2 positional arguments." >&2
  usage >&2
  exit 2
fi
[ "${#args[@]}" -ge 1 ] && staging_item="${args[0]}"
[ "${#args[@]}" -ge 2 ] && production_item="${args[1]}"

for bin in op jq comm; do
  command -v "$bin" >/dev/null 2>&1 || { echo "error: '$bin' is required but not installed." >&2; exit 2; }
done

get_item() {
  local json
  if ! json="$(op item get "$2" --vault "$1" --format json 2>&1)"; then
    echo "error: cannot read item '$2' in vault '$1'." >&2
    echo "$json" >&2
    exit 2
  fi
  printf '%s' "$json"
}

labels_of() {
  jq -r '.fields[]? | select((.label // "") != "") | .label' <<<"$1" | sort
}

print_list() {
  while IFS= read -r line; do
    [ -n "$line" ] && printf '  - %s\n' "$line"
  done <<<"$1"
}

echo "Comparing items in vault '$vault':"
echo "  staging:    $staging_item"
echo "  production: $production_item"
echo

staging_json="$(get_item "$vault" "$staging_item")"
production_json="$(get_item "$vault" "$production_item")"

staging_labels="$(labels_of "$staging_json")"
production_labels="$(labels_of "$production_json")"

only_staging="$(comm -23 <(printf '%s\n' "$staging_labels") <(printf '%s\n' "$production_labels"))"
only_production="$(comm -13 <(printf '%s\n' "$staging_labels") <(printf '%s\n' "$production_labels"))"

diffs=0
if [ -n "$only_staging" ]; then
  diffs=1
  echo "Fields only in $staging_item (missing from $production_item):"
  print_list "$only_staging"
  echo
fi
if [ -n "$only_production" ]; then
  diffs=1
  echo "Fields only in $production_item (missing from $staging_item):"
  print_list "$only_production"
  echo
fi

if $compare_values; then
  echo "Value comparison (= identical, ≠ differs, </> present on one side only):"
  if ! {
    op item get "$staging_item" --vault "$vault" --format json --reveal
    op item get "$production_item" --vault "$vault" --format json --reveal
  } | jq -nr '
    def field_map: (.fields // []) | map(select((.label // "") != "")) | map({key: .label, value: (.value // "")}) | from_entries;
    (input) as $s | (input) as $p |
    ($s | field_map) as $sf | ($p | field_map) as $pf |
    (($sf | keys) + ($pf | keys) | unique)[] as $k |
    if   ($sf[$k] == null)      then "  > \($k) (only in production)"
    elif ($pf[$k] == null)      then "  < \($k) (only in staging)"
    elif ($sf[$k] == $pf[$k])   then "  = \($k)"
    else                             "  ≠ \($k)" end'; then
    echo "error: cannot read or compare revealed item values." >&2
    exit 2
  fi
  echo
fi

shared_count="$(comm -12 <(printf '%s\n' "$staging_labels") <(printf '%s\n' "$production_labels") | grep -c . || true)"
if [ "$diffs" -eq 0 ]; then
  echo "✅ Both items have the same fields ($shared_count shared)."
  exit 0
fi
echo "❌ Items differ."
exit 1
