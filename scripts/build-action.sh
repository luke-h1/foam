# shellcheck disable=SC2148
rm -rf .github/actions/fingerprint-native/index.js
npx ncc build .github/actions/fingerprint-native/index.ts -o .github/actions/fingerprint-native
