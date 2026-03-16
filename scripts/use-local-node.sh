#!/bin/sh
set -eu

LOCAL_NODE="$HOME/.local/node-v22.14.0-darwin-arm64/bin/node"

if [ -x "$LOCAL_NODE" ]; then
  NODE_BIN="$LOCAL_NODE"
else
  NODE_BIN="${NODE:-$(command -v node 2>/dev/null || true)}"
fi

if [ -z "${NODE_BIN:-}" ]; then
  echo "Node.js was not found. Install Node 18.18+ or make sure the local Node 22 binary exists." >&2
  exit 1
fi

exec "$NODE_BIN" "$@"
