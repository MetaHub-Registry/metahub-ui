#!/bin/bash

# Source environment variables
if [[ -f .env ]]; then
  source .env
fi

if [[ "$1" == "local" ]]; then
  SONAR_QUBE_URL=${SONAR_QUBE_URL_LOCAL}
  SONAR_QUBE_TOKEN=${SONAR_QUBE_TOKEN_LOCAL}
fi

# Auto-detect version from .bumpversion.cfg
VERSION=$(grep "^current_version" .bumpversion.cfg 2>/dev/null | head -1 | cut -d= -f2 | tr -d ' ')

if [[ -n "$1" && "$1" != "local" ]]; then
  # Explicit tag/ref argument: use as version, target main branch, extract date
  TS=$(git show -s --format=%cI "$1" | tail -n1 | awk -F"T" '{print $1}')
  TAG_ARG="-Dsonar.projectVersion=$1 -Dsonar.branch.name=main -Dsonar.projectDate=${TS}"
elif [[ -n "${VERSION}" ]]; then
  # Auto-detected version from .bumpversion.cfg
  TAG_ARG="-Dsonar.projectVersion=${VERSION} -Dsonar.branch.name=$(git rev-parse --abbrev-ref HEAD)"
else
  # Fallback: branch only, no version
  TAG_ARG="-Dsonar.branch.name=$(git rev-parse --abbrev-ref HEAD)"
fi

set -x

sonar-scanner ${TAG_ARG} \
  -Dsonar.projectKey=${SONAR_QUBE_PROJECT} \
  -Dsonar.sources=src \
  -Dsonar.tests=src \
  -Dsonar.test.inclusions="**/*.test.ts,**/*.test.tsx" \
  -Dsonar.exclusions="src/components/ui/**,src/test/setup.ts,node_modules/**,dist/**,coverage/**" \
  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
  -Dsonar.typescript.lcov.reportPaths=coverage/lcov.info \
  -Dsonar.host.url=${SONAR_QUBE_URL} \
  -Dsonar.token=${SONAR_QUBE_TOKEN} \
  -Dsonar.scm.disabled=true
