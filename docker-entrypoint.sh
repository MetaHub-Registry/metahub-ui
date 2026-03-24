#!/bin/sh
set -e

# Inject the API URL as a global variable into index.html at container startup.
# The React app reads window.__METAHUB_API_URL__ to determine the API base URL.
if [ -n "$METAHUB_API_URL" ]; then
  echo "Configuring API URL: $METAHUB_API_URL"
  sed -i "s|</head>|<script>window.__METAHUB_API_URL__=\"${METAHUB_API_URL}\";</script></head>|" \
    /usr/share/nginx/html/index.html
fi

exec "$@"
