#!/bin/sh
set -e

# generate env.js from environment variables consumed by frontend
API_URL=${VITE_API_BASE_URL:-http://localhost:8080/api}

echo "Generating runtime environment configuration..."
echo "API_BASE_URL: ${API_URL}"

cat > /usr/share/nginx/html/env.js <<EOF
// generated file — do not edit
window._env_ = {
  VITE_API_BASE_URL: "${API_URL}"
};
EOF

echo "Runtime configuration written to /usr/share/nginx/html/env.js"

exec "$@"

