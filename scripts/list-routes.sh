#!/usr/bin/env bash
# Source this file and call list_routes. It prints one expo-router path per
# line, read from the route files in src/app. A dynamic segment gets a sample
# value, so each line opens as a deep link.

list_routes() {
  local app_dir
  app_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/src/app"

  find "$app_dir" -type f -name '*.tsx' ! -name '_*' ! -name '+*' ! -path '*/__tests__/*' |
    sed -E -e "s#^${app_dir}/##" -e 's#\.(ios|android|web|native)?\.?tsx$##' -e 's#(^|/)index$##' |
    sort -u |
    while IFS= read -r route; do
      case "$route" in
        '' | auth) ;;
        'category/[id]') echo 'category/21779' ;;
        chat) echo 'chat?channelName=test&channelId=123' ;;
        'streams/clip/[id]') echo 'streams/clip/AwkwardHelplessSalamanderSwiftRage' ;;
        'streams/live-stream/[id]') echo 'streams/live-stream/123' ;;
        'streams/streamer-profile/[id]') echo 'streams/streamer-profile/456' ;;
        'streams/vod/[id]') echo 'streams/vod/123' ;;
        *'['*)
          echo "list_routes: add a sample value for ${route}" >&2
          return 1
          ;;
        *) echo "$route" ;;
      esac
    done
}
