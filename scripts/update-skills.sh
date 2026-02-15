#!/bin/bash
set -e
cd "$(dirname "$0")/.."

AGENTS=(-a cursor -a claude-code)

SKILLS=(
    "bunx skills add https://github.com/expo/skills --skill building-native-ui"
    "bunx skills add https://github.com/expo/skills --skill native-data-fetching"
    "bunx skills add https://github.com/expo/skills --skill upgrading-expo"
    "bunx skills add https://github.com/expo/skills --skill expo-dev-client"
    "bunx skills add https://github.com/expo/skills --skill expo-deployment"
    "bunx skills add https://github.com/expo/skills --skill expo-cicd-workflows"
    "bunx skills add https://github.com/expo/skills --skill use-dom"
    "bunx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-native-skills"
    "bunx skills add https://github.com/callstackincubator/agent-skills --skill react-native-best-practices"
)

for cmd in "${SKILLS[@]}"; do
    echo "→ $cmd"
    eval "$cmd" "${AGENTS[@]}" -y
done

echo "Done. Installed skills (cursor + claude-code only):"
bunx skills list -a cursor -a claude-code