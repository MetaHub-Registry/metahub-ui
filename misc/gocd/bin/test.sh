#!/bin/sh
set -e
docker build --target build -t metahub-ui-test .
docker run --rm metahub-ui-test npm run lint
docker run --rm metahub-ui-test npm run test
