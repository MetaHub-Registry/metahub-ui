# Stage 1: Build
# Pinned to $BUILDPLATFORM: the JS build is arch-independent and runs natively
# on the build agent (no QEMU). The per-arch nginx:alpine runtime only COPYs
# static output.
FROM --platform=$BUILDPLATFORM mirror.gcr.io/library/node:lts-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve
FROM mirror.gcr.io/library/nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
