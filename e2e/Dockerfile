FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json
COPY webpack.config.js webpack.config.js

COPY libs/common/package.json libs/common/package.json
COPY e2e/package.json e2e/package.json

COPY .docker/stubs/files.json apps/files/package.json
COPY .docker/stubs/auth.json apps/auth/package.json
COPY .docker/stubs/api-gateway.json apps/api-gateway/package.json
COPY .docker/stubs/notifications.json apps/notifications/package.json

RUN corepack enable
RUN pnpm install --filter @app/common --filter @app/e2e

COPY e2e e2e
COPY libs libs
