#!/bin/sh
set -e

# Replace __METAHUB_API_URL__ placeholder in built JS files with the runtime API URL.
# This allows configuring the API URL at container startup via environment variable.
if [ -n "$METAHUB_API_URL" ]; then
  echo "Configuring API URL: $METAHUB_API_URL"
  find /usr/share/nginx/html/assets -name '*.js' -exec \
    sed -i "s|__METAHUB_API_URL__|${METAHUB_API_URL}|g" {} +
fi

exec "$@"
