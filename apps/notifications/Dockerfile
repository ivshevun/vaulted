FROM node:alpine

WORKDIR /usr/src/app

COPY package.json .
COPY pnpm-lock.yaml .
COPY tsconfig.json tsconfig.json
COPY nest-cli.json nest-cli.json

COPY .env.test .env.test
COPY apps/notifications apps/notifications
COPY libs libs

RUN npm install -g pnpm
RUN pnpm install
RUN pnpm run build notifications

CMD ["pnpm", "start:dev", "notifications"]