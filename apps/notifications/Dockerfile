FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json
COPY webpack.config.js webpack.config.js

COPY libs/common/package.json libs/common/package.json
COPY apps/notifications/package.json apps/notifications/package.json

COPY .docker/stubs/files.json apps/files/package.json
COPY .docker/stubs/auth.json apps/auth/package.json
COPY .docker/stubs/api-gateway.json apps/api-gateway/package.json
COPY .docker/stubs/antivirus.json apps/antivirus/package.json
COPY .docker/stubs/e2e.json e2e/package.json

RUN corepack enable
RUN pnpm install --filter @apps/notifications --filter @app/common

COPY apps/notifications apps/notifications
COPY libs libs

RUN pnpm run build notifications

CMD ["pnpm", "start:dev", "notifications"]
