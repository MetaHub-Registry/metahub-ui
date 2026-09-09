#!/bin/bash
set -e

HARBOR_REG="${HARBOR_REG:-harbor.example.com}"

echo "> Login to ${HARBOR_REG} as 'robot\$good'"
echo "HARBOR_TOKEN length: $(echo ${HARBOR_TOKEN}|wc -c)"
docker login ${HARBOR_REG} \
  -u 'robot$good' \
  -p "${HARBOR_TOKEN}"

IMAGE_NAME_BASE="${HARBOR_REG}/metahub/ui"
GIT_TAG=$(git describe --tags --exact-match 2>/dev/null || true)
if [ -n "$GIT_TAG" ]; then
  TAG="${GIT_TAG}-dev"
  NEW_IMAGE_NAME="${IMAGE_NAME_BASE}"
else
  TAG="${GO_PIPELINE_LABEL}"
  NEW_IMAGE_NAME="$(echo ${IMAGE_NAME_BASE}/${GO_PIPELINE_GROUP_NAME}/${GO_PIPELINE_NAME}|tr '[:upper:]' '[:lower:]')"
fi

NEW_IMAGE="${NEW_IMAGE_NAME}:${TAG}"

docker run --privileged --rm tonistiigi/binfmt --install arm64 >/dev/null 2>&1 || echo "> WARNING: binfmt install failed"
printf '[registry."%s"]\n  http = true\n' "${HARBOR_REG}" > /tmp/buildkitd-multiarch.toml
docker buildx rm multiarch >/dev/null 2>&1 || true
docker buildx create --name multiarch --driver docker-container --buildkitd-config /tmp/buildkitd-multiarch.toml --use
docker buildx use multiarch

echo "Building ${NEW_IMAGE} (amd64+arm64)..."
docker buildx build --platform linux/amd64,linux/arm64 -t "${NEW_IMAGE}" --push .
echo "Done: ${NEW_IMAGE}"

gdh patch -f result.yaml \
  --add=metahub.image.reg=${HARBOR_REG} \
  --add=metahub.image.name=${NEW_IMAGE_NAME} \
  --add=metahub.image.tag=${TAG} \
  --add=metahub.image.full=${NEW_IMAGE}
