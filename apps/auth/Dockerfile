FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json
COPY webpack.config.js webpack.config.js

COPY libs/common/package.json libs/common/package.json
COPY apps/auth/package.json apps/auth/package.json

COPY .docker/stubs/files.json apps/files/package.json
COPY .docker/stubs/api-gateway.json apps/api-gateway/package.json
COPY .docker/stubs/antivirus.json apps/antivirus/package.json
COPY .docker/stubs/notifications.json apps/notifications/package.json
COPY .docker/stubs/e2e.json e2e/package.json

RUN corepack enable
RUN pnpm install --filter @apps/auth --filter @app/common

COPY apps/auth apps/auth
COPY libs libs

RUN cd apps/auth && npx prisma generate --schema=src/prisma/schema.prisma
RUN pnpm run build auth

CMD sh -c "npx prisma migrate deploy --schema=apps/auth/src/prisma/schema.prisma && pnpm start:dev auth"
