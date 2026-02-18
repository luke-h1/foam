#!/bin/bash
set -e
cd "$(dirname "$0")/.."

INSTALL_GLOBAL=
while [[ $# -gt 0 ]]; do
    case $1 in
        -g|--global) INSTALL_GLOBAL=1; shift ;;
        *) echo "Usage: $0 [-g|--global]  (default: project-level; -g = install globally for cursor + claude-code)"; exit 1 ;;
    esac
done

AGENTS=(-a cursor -a claude-code)
if [[ -n "$INSTALL_GLOBAL" ]]; then
    GLOBAL_FLAG=(-g)
    echo "Installing skills globally (user-level) for cursor + claude-code."
else
    GLOBAL_FLAG=()
    echo "Installing skills at project level for cursor + claude-code. Use -g or --global to install globally."
fi

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
    "bunx skills add https://github.com/dammyjay93/interface-design --skill interface-design"
    "bunx skills add  callstackincubator/agent-device"
)

for cmd in "${SKILLS[@]}"; do
    echo "→ $cmd"
    eval "$cmd" "${AGENTS[@]}" -y "${GLOBAL_FLAG[@]}"
done

echo "Done. Installed skills (cursor + claude-code):"
bunx skills list -a cursor -a claude-code "${GLOBAL_FLAG[@]}"
