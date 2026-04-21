FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY apps/notifications apps/notifications
COPY libs libs

RUN corepack enable
RUN pnpm install --frozen-lockfile
RUN pnpm run build notifications

CMD ["pnpm", "start:dev", "notifications"]