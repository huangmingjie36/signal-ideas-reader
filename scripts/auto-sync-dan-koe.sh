#!/bin/zsh
set -euo pipefail

project_dir="/Users/huangmingjie/Documents/Codex/2026-07-22/new-chat"
node_dir="/Users/huangmingjie/.local/node/node-v24.16.0-darwin-arm64/bin"

export PATH="$node_dir:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

if /usr/bin/nc -z 127.0.0.1 7897 2>/dev/null; then
  export HTTP_PROXY="http://127.0.0.1:7897"
  export HTTPS_PROXY="$HTTP_PROXY"
  export ALL_PROXY="$HTTP_PROXY"
fi

cd "$project_dir"

npm run sync:dan-koe

if git diff --quiet -- public/posts.json docs/posts.json; then
  exit 0
fi

git add public/posts.json docs/posts.json
git commit -m "Sync Dan Koe posts"
git push github main
