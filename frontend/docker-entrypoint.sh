#!/bin/sh
set -e

# generate env.js from environment variables consumed by frontend
# expected env variables: VITE_API_BASE_URL, VITE_WEBSOCKET_URL, VITE_OTHER_*

API_URL=${VITE_API_BASE_URL:-http://localhost:8080/api}
WS_URL=${VITE_WEBSOCKET_URL:-ws://localhost:8080/ws/alerts}

cat > /usr/share/nginx/html/env.js <<EOF
// generated file — do not edit
window._env_ = {
  VITE_API_BASE_URL: "${API_URL}",
  VITE_WEBSOCKET_URL: "${WS_URL}"
};
EOF

exec "$@"

