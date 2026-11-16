# syntax=docker/dockerfile:1

# Node version matches .node-version, package.json engines, and the Compose build args.
ARG NODE_VERSION=26.12.1

FROM node:${NODE_VERSION}-bookworm-slim AS dev
WORKDIR /home/node/app
COPY --chmod=755 infra/dev-entrypoint.sh /usr/local/bin/lhamalog-dev-entrypoint.sh
RUN chown node:node /home/node/app
COPY --chown=node:node package.json package-lock.json ./
USER node
RUN --mount=type=cache,target=/home/node/.npm,uid=1000,gid=1000 \
    npm ci \
    && sha256sum package-lock.json | awk '{print $1}' > node_modules/.lhamalog-lock-stamp
COPY --chown=node:node . .
EXPOSE 5173
CMD ["lhamalog-dev-entrypoint.sh"]

FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /src
# Public config is injected when the Nginx container starts. Do not pass Clerk
# keys or the API URL as build arguments: they would be stored in image history.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .
RUN npm run build

FROM nginx/nginx-unprivileged:1.31.8-alpine3.24 AS runtime
USER root
RUN mkdir -p /etc/nginx/snippets
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY infra/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --chmod=755 infra/nginx/render-config.sh /lhamalog-render-config.sh
COPY --chmod=755 infra/nginx/docker-entrypoint.sh /lhamalog-entrypoint.sh
COPY --from=build --link --chown=101:101 /src/dist/ /usr/share/nginx/html/
USER 101
EXPOSE 8080
LABEL org.opencontainers.image.source="https://github.com/LhamaLog/lhamalog-web" \
      org.opencontainers.image.title="lhamalog-web" \
      org.opencontainers.image.description="Frontend LhamaLog compilado e servido por Nginx"
ENTRYPOINT ["/lhamalog-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
